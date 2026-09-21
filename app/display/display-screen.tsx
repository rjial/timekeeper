"use client";

import { useEffect, useRef } from "react";
import { formatClock, msToNextSecond, remainingMs, widestClock } from "@/lib/timer/compute";
import { useLiveTimer } from "@/lib/timer/use-live-timer";
import { BARS, CONDITION } from "@/lib/timer/condition";
import { Pips } from "./pips";
import { useDisplayShell } from "./use-display-shell";
import { useFittedText } from "./use-fitted-text";
import "./display.css";

export function DisplayScreen() {
  const { snapshot, offsetMs, seconds, phase, rehearsing } = useLiveTimer();
  const { idle } = useDisplayShell();
  const wipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snapshot) return;
    /* Align the wipe to the timer's own second boundary, so the sweep lands
       exactly as the number changes. The delay is written to the node rather
       than held in state: re-rendering it would restart the animation. */
    const wipe = wipeRef.current;
    if (wipe) {
      if (snapshot.running) {
        const left = remainingMs(snapshot, Date.now() + offsetMs);
        const intoSecond = (1000 - msToNextSecond(left)) % 1000;
        wipe.style.animationDelay = `-${(intoSecond / 1000).toFixed(3)}s`;
      } else {
        wipe.style.removeProperty("animation-delay");
      }
    }
  }, [snapshot, offsetMs]);

  const clock = snapshot ? formatClock(seconds) : "--:--";
  const sample = widestClock(snapshot?.durationMs ?? 0);
  const message = snapshot?.message ?? "";

  const {
    boxRef: countBox,
    probeRef: countProbe,
    size: countSize,
  } = useFittedText(sample, 0.94);
  const {
    boxRef: cueBox,
    probeRef: cueProbe,
    size: cueSize,
  } = useFittedText(message || " ", 0.3);

  const captions = [
    rehearsing ? "Rehearsal" : null,
    phase === "nosignal" && snapshot ? "Last known" : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`slate${idle ? " slate--idle" : ""}`} data-phase={phase}>
      <div className="slate__tally">
        {phase === "nosignal" ? (
          BARS.map((bar) => (
            <span key={bar} className="slate__bar" style={{ background: bar }} />
          ))
        ) : (
          <span className="slate__bar" />
        )}
      </div>

      <div className="slate__line">
        <span className="slate__condition" aria-live="polite">
          {CONDITION[phase]}
        </span>
        <span className="slate__fields">
          {captions.map((caption) => (
            <span key={caption} className="slate__caption">
              {caption}
            </span>
          ))}
          <Pips phase={phase} />
        </span>
      </div>

      <div className="slate__count" ref={countBox}>
        <span className="slate__probe slate__probe--count" ref={countProbe} aria-hidden>
          {sample}
        </span>
        <span
          className="slate__digits"
          style={{ fontSize: countSize || undefined }}
          role="timer"
          aria-live="off"
        >
          {clock}
        </span>
      </div>

      <div className="slate__cue" ref={cueBox}>
        <span className="slate__probe slate__probe--cue" ref={cueProbe} aria-hidden>
          {message || " "}
        </span>
        {message ? (
          <span
            className="slate__cue-text"
            style={{ fontSize: cueSize || undefined }}
            aria-live="polite"
          >
            {message}
          </span>
        ) : null}
      </div>

      <div className="slate__wipe" ref={wipeRef} />
    </div>
  );
}
