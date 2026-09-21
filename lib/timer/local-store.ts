import type { Phase, TimerSnapshot } from "./types";

const DEFAULT_DURATION_MS = 30 * 60 * 1000;

/**
 * The rehearsal timer. Stands in for Supabase when no configuration is present
 * so both surfaces stay usable on a laptop with nothing wired, and so the
 * console's own controls give feedback instead of failing silently.
 *
 * It is per-tab and never shared. Nothing here is the room's truth.
 */
let snapshot: TimerSnapshot = {
  running: false,
  endsAt: null,
  remainingMs: DEFAULT_DURATION_MS,
  durationMs: DEFAULT_DURATION_MS,
  message: "",
  updatedAt: Date.now(),
};

const listeners = new Set<(next: TimerSnapshot) => void>();

export function readLocal(): TimerSnapshot {
  return snapshot;
}

export function writeLocal(patch: Partial<TimerSnapshot>) {
  snapshot = { ...snapshot, ...patch, updatedAt: Date.now() };
  for (const listener of listeners) listener(snapshot);
}

export function subscribeLocal(listener: (next: TimerSnapshot) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Milliseconds left right now, whichever way the timer is currently held. */
export function localRemaining(): number {
  return snapshot.running && snapshot.endsAt !== null
    ? snapshot.endsAt - Date.now()
    : snapshot.remainingMs;
}

/** Pins a condition so a venue can be checked against every state before doors. */
export function pinLocalPhase(phase: Phase) {
  const now = Date.now();
  const pins: Record<Phase, Partial<TimerSnapshot>> = {
    onair: { running: true, endsAt: now + DEFAULT_DURATION_MS },
    windup: { running: true, endsAt: now + 4 * 60 * 1000 + 12_000 },
    cut: {
      running: true,
      endsAt: now + 38_000,
      message: "WRAP UP — HARD STOP AT THE HOUR",
    },
    over: { running: true, endsAt: now - 47_000, message: "PLEASE CLOSE" },
    hold: { running: false, endsAt: null, remainingMs: 222_000 },
    nosignal: { running: true, endsAt: now + 222_000 },
  } as Record<Phase, Partial<TimerSnapshot>>;
  writeLocal(pins[phase] ?? {});
}
