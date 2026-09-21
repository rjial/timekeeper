import { pinLocalPhase, readLocal, subscribeLocal } from "./local-store";
import type { Phase, TimerSource } from "./types";

/**
 * Rehearsal feed. Runs when no Supabase configuration is present, and lets a
 * phase be pinned with `?rehearse=` so a venue can be checked against every
 * state before doors open. The connection is reported lost for the `nosignal`
 * pin, which is the point of that pin.
 */
export function createDemoSource(pinned: Phase | null): TimerSource {
  return {
    subscribe(listener) {
      const connection = pinned === "nosignal" ? "lost" : "live";
      const emit = () =>
        listener({ snapshot: readLocal(), connection, offsetMs: 0 });

      const unsubscribe = subscribeLocal(emit);
      if (pinned) pinLocalPhase(pinned);
      emit();
      return unsubscribe;
    },
  };
}
