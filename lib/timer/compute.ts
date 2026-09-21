import type { Phase, TimerSnapshot } from "./types";

/** The count turns amber here: the speaker should be steering toward a close. */
export const WIND_UP_MS = 5 * 60 * 1000;
/** The count turns red here: land it now. */
export const CUT_MS = 60 * 1000;

/** Milliseconds left, negative once the session has run over. */
export function remainingMs(snapshot: TimerSnapshot, now: number): number {
  if (snapshot.running && snapshot.endsAt !== null) return snapshot.endsAt - now;
  return snapshot.remainingMs;
}

/**
 * Whole seconds as the room should read them: a countdown rounds up so it shows
 * 0:01 for the whole final second, an overrun counts whole seconds elapsed.
 */
export function displaySeconds(ms: number): number {
  return ms >= 0 ? Math.ceil(ms / 1000) : -Math.floor(-ms / 1000);
}

/** Milliseconds until the displayed number next changes. */
export function msToNextSecond(ms: number): number {
  const within = ((ms % 1000) + 1000) % 1000;
  return within === 0 ? 1000 : within;
}

export function phaseOf(
  seconds: number,
  running: boolean,
  hasSignal: boolean,
  atFull: boolean,
): Phase {
  if (!hasSignal) return "nosignal";
  /* Loaded and never started is not the same as paused mid-talk, and the
     operator who just opened the desk should not be told the show is held. */
  if (!running) return atFull ? "ready" : "hold";
  if (seconds <= 0) return "over";
  if (seconds * 1000 <= CUT_MS) return "cut";
  if (seconds * 1000 <= WIND_UP_MS) return "windup";
  return "onair";
}

/** `m:ss` under an hour, `h:mm:ss` over it. Overrun carries a leading `+`. */
export function formatClock(seconds: number): string {
  const over = seconds < 0;
  const total = Math.abs(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const body = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
  return over ? `+${body}` : body;
}

/**
 * The widest string the count can ever reach this session. The type is measured
 * against this once, so digits never resize or reflow mid-talk.
 */
export function widestClock(durationMs: number): string {
  return durationMs >= 3600 * 1000 ? "+9:99:99" : "+99:99";
}
