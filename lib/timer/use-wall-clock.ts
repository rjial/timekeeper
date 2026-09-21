"use client";

import { useEffect, useState } from "react";

function format(now: number): string {
  const date = new Date(now);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

/**
 * Time of day, corrected by the server offset so the house clock agrees with
 * the countdown even when this device's clock does not. Minutes only: seconds
 * would put a second moving number on a screen that must stay still.
 *
 * Empty until the browser has it, so the server-rendered markup does not
 * disagree with the first paint.
 */
export function useWallClock(offsetMs: number): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const now = Date.now() + offsetMs;
      setTime(format(now));
      timer = window.setTimeout(tick, 60_000 - (now % 60_000) + 50);
    };
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, [offsetMs]);

  return time;
}
