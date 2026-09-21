"use client";

import { useEffect, useState } from "react";
import { displaySeconds, msToNextSecond, phaseOf, remainingMs } from "./compute";
import { useTimerFeed } from "./use-timer-feed";
import type { Phase, TimerSnapshot } from "./types";

export type LiveTimer = {
  snapshot: TimerSnapshot | null;
  /** Server clock minus this device's clock, in ms. */
  offsetMs: number;
  /** Whole seconds as the room reads them; negative once over. */
  seconds: number;
  phase: Phase;
  hasSignal: boolean;
  rehearsing: boolean;
};

/**
 * The shared read model both surfaces run on, so the console's mirror and the
 * room's slate can never disagree about the condition.
 */
export function useLiveTimer(): LiveTimer {
  const { feed, rehearsing } = useTimerFeed();
  const { snapshot, connection, offsetMs } = feed;
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!snapshot) return;
    let timer = 0;
    const tick = () => {
      const left = remainingMs(snapshot, Date.now() + offsetMs);
      setSeconds(displaySeconds(left));
      if (!snapshot.running) return;
      timer = window.setTimeout(tick, msToNextSecond(left) + 8);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [snapshot, offsetMs]);

  const hasSignal = connection === "live" && snapshot !== null;
  const atFull = snapshot ? snapshot.remainingMs >= snapshot.durationMs : true;
  return {
    snapshot,
    offsetMs,
    seconds,
    phase: phaseOf(seconds, snapshot?.running ?? false, hasSignal, atFull),
    hasSignal,
    rehearsing,
  };
}
