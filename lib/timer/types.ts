/**
 * Shared timer state for the countdown.
 *
 * PROPOSED CONTRACT — see `supabase/schema.sql`. The Supabase project belongs to
 * the operator; nothing here is confirmed until they apply that schema.
 */

/** A snapshot of the single global timer, as the display understands it. */
export type TimerSnapshot = {
  /** True while the countdown is advancing. */
  running: boolean;
  /** Absolute server instant the countdown reaches zero. Null while held. */
  endsAt: number | null;
  /** Frozen remainder, in ms, while held. Ignored while running. */
  remainingMs: number;
  /** Configured length of the session, in ms. Sizes the display type. */
  durationMs: number;
  /** Operator cue for the speaker. Empty string means no cue. */
  message: string;
  /** Server instant this row was last written. */
  updatedAt: number;
};

/** Health of the link to the shared state. A stale number is worse than none. */
export type Connection = "connecting" | "live" | "lost";

/**
 * The condition the room reads before it reads the number.
 * Named in floor-manager language, because that is what the surface speaks.
 */
export type Phase =
  | "ready"
  | "onair"
  | "windup"
  | "cut"
  | "over"
  | "hold"
  | "nosignal";

export type TimerFeed = {
  snapshot: TimerSnapshot | null;
  connection: Connection;
  /** Server clock minus this device's clock, in ms. */
  offsetMs: number;
};

export type TimerSource = {
  subscribe(listener: (feed: TimerFeed) => void): () => void;
};
