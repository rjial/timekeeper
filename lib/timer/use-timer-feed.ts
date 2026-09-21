"use client";

import { useEffect, useMemo, useState } from "react";
import { createDemoSource } from "./demo-source";
import { createSupabaseSource, supabaseConfig } from "./supabase-source";
import type { Phase, TimerFeed } from "./types";

const REHEARSAL_PHASES: Phase[] = ["onair", "windup", "cut", "over", "hold", "nosignal"];

function readRehearsal(): Phase | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("rehearse");
  return REHEARSAL_PHASES.includes(value as Phase) ? (value as Phase) : null;
}

const INITIAL: TimerFeed = { snapshot: null, connection: "connecting", offsetMs: 0 };

/**
 * Subscribes to shared timer state. Falls back to the rehearsal feed when the
 * Supabase configuration is absent, and says so on the slate rather than
 * pretending the number came from the room.
 */
export function useTimerFeed(): { feed: TimerFeed; rehearsing: boolean } {
  const [feed, setFeed] = useState<TimerFeed>(INITIAL);
  const config = useMemo(() => supabaseConfig(), []);

  useEffect(() => {
    const source = config
      ? createSupabaseSource(config)
      : createDemoSource(readRehearsal());
    return source.subscribe(setFeed);
  }, [config]);

  return { feed, rehearsing: !config };
}
