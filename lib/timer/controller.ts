import { localRemaining, readLocal, writeLocal } from "./local-store";
import { readPassphrase } from "./passphrase";
import { supabaseClient, supabaseConfig } from "./supabase-source";

/**
 * Every write the console can make. The room's timer is server state, so each
 * action is one call and the server decides the instant — the console never
 * sends a timestamp it computed from its own clock.
 */
export type TimerController = {
  setDuration(durationMs: number): Promise<void>;
  start(): Promise<void>;
  hold(): Promise<void>;
  reset(): Promise<void>;
  adjust(deltaMs: number): Promise<void>;
  sendMessage(text: string): Promise<void>;
};

function createSupabaseController(config: {
  url: string;
  anonKey: string;
}): TimerController {
  const client = supabaseClient(config);

  /* The passphrase rides with every write and is checked in Postgres. */
  const call = async (fn: string, args: Record<string, unknown> = {}) => {
    const { error } = await client.rpc(fn, { ...args, p_pass: readPassphrase() });
    if (error) throw new Error(error.message);
  };

  return {
    setDuration: (durationMs) => call("timer_set", { p_duration_ms: durationMs }),
    start: () => call("timer_start"),
    hold: () => call("timer_hold"),
    reset: () => call("timer_reset"),
    adjust: (deltaMs) => call("timer_adjust", { p_delta_ms: deltaMs }),
    sendMessage: (text) => call("timer_message", { p_message: text }),
  };
}

/** Drives the rehearsal timer so the console works with nothing wired. */
function createLocalController(): TimerController {
  const done = () => Promise.resolve();
  return {
    setDuration: (durationMs) => {
      writeLocal({
        durationMs,
        remainingMs: durationMs,
        running: false,
        endsAt: null,
      });
      return done();
    },
    start: () => {
      const current = readLocal();
      if (!current.running) {
        writeLocal({ running: true, endsAt: Date.now() + current.remainingMs });
      }
      return done();
    },
    hold: () => {
      if (readLocal().running) {
        writeLocal({ running: false, endsAt: null, remainingMs: localRemaining() });
      }
      return done();
    },
    reset: () => {
      writeLocal({
        running: false,
        endsAt: null,
        remainingMs: readLocal().durationMs,
      });
      return done();
    },
    adjust: (deltaMs) => {
      const current = readLocal();
      if (current.running && current.endsAt !== null) {
        writeLocal({ endsAt: current.endsAt + deltaMs });
      } else {
        writeLocal({ remainingMs: current.remainingMs + deltaMs });
      }
      return done();
    },
    sendMessage: (text) => {
      writeLocal({ message: text });
      return done();
    },
  };
}

export function createController(): TimerController {
  const config = supabaseConfig();
  return config ? createSupabaseController(config) : createLocalController();
}

/**
 * Asks Postgres whether a passphrase is the right one, so the console can show
 * a wrong code at the gate instead of on the first control the operator
 * presses. Without Supabase there is nothing to lock.
 */
export async function verifyPassphrase(candidate: string): Promise<boolean> {
  const config = supabaseConfig();
  if (!config) return true;
  const { data, error } = await supabaseClient(config).rpc("console_unlocked", {
    p_pass: candidate,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

/** True when this deployment has a gate at all. */
export function gated(): boolean {
  return supabaseConfig() !== null;
}
