import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TimerFeed, TimerSnapshot, TimerSource } from "./types";

/** Row shape of the proposed `timer_state` table. See `supabase/schema.sql`. */
type TimerRow = {
  id: string;
  running: boolean;
  ends_at: string | null;
  remaining_ms: number | string;
  duration_ms: number | string;
  message: string | null;
  updated_at: string;
};

const TABLE = "timer_state";
const ROW_ID = "global";
/** How often the display re-measures its clock against the server's. */
const RESYNC_MS = 60_000;

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

function toSnapshot(row: TimerRow): TimerSnapshot {
  return {
    running: row.running,
    endsAt: row.ends_at ? Date.parse(row.ends_at) : null,
    remainingMs: Number(row.remaining_ms ?? 0),
    durationMs: Number(row.duration_ms ?? 0),
    message: row.message?.trim() ?? "",
    updatedAt: Date.parse(row.updated_at),
  };
}

/**
 * Measures server-minus-device clock offset so two devices agree on the same
 * instant even when one of their clocks is wrong. Falls back to no correction
 * when the helper function is absent, rather than guessing.
 */
async function measureOffset(client: SupabaseClient): Promise<number | null> {
  const sent = Date.now();
  const { data, error } = await client.rpc("server_now");
  if (error || typeof data !== "string") return null;
  const received = Date.now();
  const serverNow = Date.parse(data);
  if (Number.isNaN(serverNow)) return null;
  return serverNow - (sent + received) / 2;
}

export function createSupabaseSource(config: {
  url: string;
  anonKey: string;
}): TimerSource {
  return {
    subscribe(listener) {
      const client = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 4 } },
      });

      let disposed = false;
      let snapshot: TimerSnapshot | null = null;
      let connection: TimerFeed["connection"] = "connecting";
      let offsetMs = 0;

      const emit = () => {
        if (!disposed) listener({ snapshot, connection, offsetMs });
      };

      const pull = async () => {
        const { data, error } = await client
          .from(TABLE)
          .select("*")
          .eq("id", ROW_ID)
          .maybeSingle<TimerRow>();
        if (disposed) return;
        if (error || !data) {
          connection = "lost";
          emit();
          return;
        }
        snapshot = toSnapshot(data);
        emit();
      };

      const resync = async () => {
        const measured = await measureOffset(client);
        if (disposed || measured === null) return;
        offsetMs = measured;
        emit();
      };

      const channel = client
        .channel("timer-display")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
          (payload) => {
            const row = payload.new as TimerRow | null;
            if (!row?.updated_at) return;
            snapshot = toSnapshot(row);
            emit();
          },
        )
        .subscribe((status) => {
          if (disposed) return;
          if (status === "SUBSCRIBED") {
            connection = "live";
            void pull();
            void resync();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            connection = "lost";
          }
          emit();
        });

      const goOffline = () => {
        connection = "lost";
        emit();
      };
      const goOnline = () => {
        void pull();
      };
      window.addEventListener("offline", goOffline);
      window.addEventListener("online", goOnline);
      const resyncTimer = window.setInterval(resync, RESYNC_MS);

      void pull();
      emit();

      return () => {
        disposed = true;
        window.clearInterval(resyncTimer);
        window.removeEventListener("offline", goOffline);
        window.removeEventListener("online", goOnline);
        void client.removeChannel(channel);
      };
    },
  };
}
