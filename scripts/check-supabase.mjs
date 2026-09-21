/**
 * Wiring check. Verifies the project is reachable, the schema is applied, and
 * every call the console makes actually lands. Run: pnpm check:supabase
 *
 * It writes to the live timer row, then restores what it found.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* file absent is fine */
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Writes are gated in Postgres; pass the crew passphrase to exercise them.
const pass = process.env.CONSOLE_PASSPHRASE ?? "";

if (!url || !key) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY missing. Copy .env.example to .env.local.");
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const results = [];
let failed = 0;

async function check(name, run) {
  try {
    const detail = await run();
    results.push(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    failed += 1;
    results.push(`✗ ${name} — ${error.message}`);
  }
}

const read = async () => {
  const { data, error } = await client
    .from("timer_state")
    .select("*")
    .eq("id", "global")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("no row with id 'global' — run supabase/schema.sql");
  return data;
};

const rpc = async (fn, args = {}) => {
  const { data, error } = await client.rpc(fn, { ...args, p_pass: pass });
  if (error) throw new Error(error.message);
  return data;
};

const plainRpc = async (fn, args = {}) => {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};

const before = await read().catch(() => null);

await check("table timer_state readable", async () => {
  const row = await read();
  return `duration ${Math.round(row.duration_ms / 1000)}s, running ${row.running}`;
});

await check("console passphrase", async () => {
  if (!pass) throw new Error("CONSOLE_PASSPHRASE not set — add it to .env.local");
  const ok = await plainRpc("console_unlocked", { p_pass: pass });
  if (!ok) throw new Error("the passphrase does not match what is stored");
  return "accepted";
});

await check("a wrong passphrase is refused", async () => {
  const ok = await plainRpc("console_unlocked", { p_pass: `${pass}-wrong` });
  if (ok) throw new Error("the gate accepted a wrong passphrase");
  try {
    const { error } = await client.rpc("timer_message", {
      p_message: "SHOULD NOT LAND",
      p_pass: `${pass}-wrong`,
    });
    if (!error) throw new Error("a gated write went through without the passphrase");
  } catch (error) {
    if (String(error.message).includes("went through")) throw error;
  }
  return "refused at the database, not the browser";
});

await check("server_now()", async () => {
  const now = await plainRpc("server_now");
  const drift = Math.abs(Date.parse(now) - Date.now());
  return `clock drift ${drift}ms`;
});

await check("timer_set", async () => {
  await rpc("timer_set", { p_duration_ms: 1800000 });
  const row = await read();
  if (Number(row.duration_ms) !== 1800000) throw new Error("duration did not change");
  return "30:00 loaded";
});

await check("timer_start", async () => {
  await rpc("timer_start");
  const row = await read();
  if (!row.running || !row.ends_at) throw new Error("did not start");
  return "running, ends_at set by the server";
});

await check("timer_adjust", async () => {
  const row = await read();
  const was = Date.parse(row.ends_at);
  await rpc("timer_adjust", { p_delta_ms: 60000 });
  const after = await read();
  const moved = Date.parse(after.ends_at) - was;
  if (Math.abs(moved - 60000) > 1500) throw new Error(`moved ${moved}ms, expected 60000`);
  return "+1 min landed";
});

await check("timer_hold", async () => {
  await rpc("timer_hold");
  const row = await read();
  if (row.running) throw new Error("still running");
  return `held at ${Math.round(row.remaining_ms / 1000)}s`;
});

await check("timer_message", async () => {
  await rpc("timer_message", { p_message: "WIRING CHECK" });
  const row = await read();
  if (row.message !== "WIRING CHECK") throw new Error("message did not land");
  await rpc("timer_message", { p_message: "" });
  return "cue sent and cleared";
});

await check("realtime subscription", async () => {
  const status = await new Promise((resolve) => {
    const channel = client
      .channel("wiring-check")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timer_state", filter: "id=eq.global" },
        () => {},
      )
      .subscribe((state) => {
        if (state !== "SUBSCRIBED" && state !== "CHANNEL_ERROR" && state !== "TIMED_OUT") return;
        client.removeChannel(channel);
        resolve(state);
      });
    setTimeout(() => {
      client.removeChannel(channel);
      resolve("TIMED_OUT");
    }, 8000);
  });
  if (status !== "SUBSCRIBED")
    throw new Error(`${status} — enable Realtime for public.timer_state`);
  return "SUBSCRIBED";
});

if (before) {
  await rpc("timer_set", { p_duration_ms: Number(before.duration_ms) }).catch(() => {});
  await rpc("timer_message", { p_message: before.message ?? "" }).catch(() => {});
}

console.log(results.join("\n"));
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed. The room and the desk are wired.");
process.exit(failed ? 1 : 0);
