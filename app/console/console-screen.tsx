"use client";

import { useEffect, useMemo, useState } from "react";
import { formatClock } from "@/lib/timer/compute";
import { BARS, CONDITION } from "@/lib/timer/condition";
import { createController, gated, verifyPassphrase } from "@/lib/timer/controller";
import {
  clearPassphrase,
  isWrongPassphrase,
  readPassphrase,
  writePassphrase,
} from "@/lib/timer/passphrase";
import { useLiveTimer } from "@/lib/timer/use-live-timer";
import { useWallClock } from "@/lib/timer/use-wall-clock";
import { Pips } from "../display/pips";
import "./console.css";

const MINUTE = 60 * 1000;
const LENGTHS = [15, 20, 30, 45];
const ADJUSTMENTS = [-5, -1, 1, 5];
const CUES = ["5 MINUTES", "WRAP UP", "TIME", "Q&A NOW"];

/** Accepts `30`, `30:00` or `1:05:00` and returns milliseconds. */
function parseLength(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.some((part) => part === "" || !/^\d+$/.test(part))) return null;
  const [a, b, c] = parts.map(Number);
  if (parts.length === 1) return a * MINUTE;
  if (parts.length === 2) return (a * 60 + b) * 1000;
  if (parts.length === 3) return (a * 3600 + b * 60 + c) * 1000;
  return null;
}

export function ConsoleScreen() {
  const { snapshot, offsetMs, seconds, phase, rehearsing, hasSignal } = useLiveTimer();
  const controller = useMemo(() => createController(), []);
  const wallClock = useWallClock(offsetMs);
  const [custom, setCustom] = useState("");
  const [cue, setCue] = useState("");
  const [fault, setFault] = useState<string | null>(null);
  /* null while the stored passphrase is being checked against the server.
     With no project wired there is nothing to lock. */
  const [unlocked, setUnlocked] = useState<boolean | null>(() => (gated() ? null : true));
  const [entry, setEntry] = useState("");
  const [gateFault, setGateFault] = useState<string | null>(null);

  useEffect(() => {
    if (!gated()) return;
    let live = true;
    verifyPassphrase(readPassphrase())
      .then((ok) => live && setUnlocked(ok))
      .catch(() => live && setUnlocked(false));
    return () => {
      live = false;
    };
  }, []);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      setFault(null);
    } catch (error) {
      if (isWrongPassphrase(error)) {
        clearPassphrase();
        setUnlocked(false);
        setFault(null);
        return;
      }
      setFault(error instanceof Error ? error.message : "That did not reach the room");
    }
  };

  const running = snapshot?.running ?? false;
  const liveCue = snapshot?.message ?? "";
  const lengthMs = snapshot?.durationMs ?? 0;
  /* Nothing on this desk should look live when the room cannot hear it. */
  const off = !hasSignal;

  if (unlocked !== true) {
    return (
      <div className="console" data-phase={unlocked === null ? "ready" : "hold"}>
        <div className="console__tally">
          <span className="console__bar" />
        </div>
        <div className="console__line">
          <span className="console__condition">
            {unlocked === null ? "Checking" : "Locked"}
          </span>
          <span className="console__fields">
            <span className="console__caption">Console</span>
          </span>
        </div>
        {unlocked === false ? (
          <div className="console__gate">
            <h1 className="console__gate-head">Passphrase</h1>
            <p className="console__gate-note">
              The desk controls a live room. The display needs no passphrase; this
              does.
            </p>
            {gateFault ? (
              <p className="console__fault" role="status">
                {gateFault}
              </p>
            ) : null}
            <form
              className="console__form"
              onSubmit={(event) => {
                event.preventDefault();
                const candidate = entry.trim();
                if (!candidate) return;
                void verifyPassphrase(candidate)
                  .then((ok) => {
                    if (!ok) {
                      setGateFault("That is not the passphrase");
                      return;
                    }
                    writePassphrase(candidate);
                    setEntry("");
                    setGateFault(null);
                    setUnlocked(true);
                  })
                  .catch((error: unknown) =>
                    setGateFault(
                      error instanceof Error ? error.message : "Could not reach the project",
                    ),
                  );
              }}
            >
              <input
                className="console__input"
                type="password"
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
                placeholder="Crew passphrase"
                aria-label="Crew passphrase"
                autoFocus
              />
              <button type="submit" className="console__plate">
                Unlock
              </button>
            </form>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`console${off ? " console--off" : ""}`} data-phase={phase}>
      <div className="console__tally">
        {phase === "nosignal" ? (
          BARS.map((bar) => (
            <span key={bar} className="console__bar" style={{ background: bar }} />
          ))
        ) : (
          <span className="console__bar" />
        )}
      </div>

      <div className="console__line">
        <span className="console__condition" aria-live="polite">
          {CONDITION[phase]}
        </span>
        <span className="console__fields">
          {wallClock ? (
            <span className="console__clock" aria-label="Time of day">
              {wallClock}
            </span>
          ) : null}
          <span className="console__caption">
            {rehearsing ? "Rehearsal — not wired" : "Console"}
          </span>
          {gated() ? (
            <button
              type="button"
              className="console__lock"
              onClick={() => {
                clearPassphrase();
                setUnlocked(false);
              }}
            >
              Lock
            </button>
          ) : null}
          <Pips phase={phase} />
        </span>
      </div>

      <div className="console__body">
        <div className="console__mirror">
          <span className="console__caption">
            {off ? "Last known — the feed is lost" : "What the room reads"}
          </span>
          <span className="console__count">
            {snapshot ? formatClock(seconds) : "--:--"}
          </span>
          <span className={`console__reads${liveCue ? "" : " console__reads--empty"}`}>
            {liveCue || "No cue on the screen"}
          </span>
          {off ? (
            <p className="console__recovery" role="status">
              The room is not receiving this desk. Check the network — the
              connection comes back on its own, and nothing you set now will land.
            </p>
          ) : null}
        </div>

        {fault ? (
          <p className="console__fault" role="status">
            {fault}
          </p>
        ) : null}

        <div className="console__run">
          <button
            type="button"
            className="console__primary"
            disabled={off}
            onClick={() => void run(() => (running ? controller.hold() : controller.start()))}
          >
            {running ? "Hold" : "Start"}
          </button>
          <button
            type="button"
            className="console__secondary"
            disabled={off}
            onClick={() => void run(() => controller.reset())}
          >
            Reset
          </button>
        </div>

        <section className="console__block">
          <h2 className="console__head">
            <span>Session length</span>
            <span>{lengthMs ? formatClock(Math.round(lengthMs / 1000)) : "not set"}</span>
          </h2>
          <div className="console__keys">
            {LENGTHS.map((value) => (
              <button
                key={value}
                type="button"
                className={`console__plate${
                  lengthMs === value * MINUTE ? " console__plate--current" : ""
                }`}
                disabled={off}
                onClick={() => void run(() => controller.setDuration(value * MINUTE))}
              >
                {value} min
              </button>
            ))}
          </div>
          <form
            className="console__form"
            onSubmit={(event) => {
              event.preventDefault();
              const ms = parseLength(custom);
              if (ms === null || ms <= 0) {
                setFault(`“${custom}” is not a length — try 30 or 30:00`);
                return;
              }
              setCustom("");
              void run(() => controller.setDuration(ms));
            }}
          >
            <input
              className="console__input"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Custom — 30 or 30:00"
              inputMode="numeric"
              disabled={off}
              aria-label="Custom session length"
            />
            <button type="submit" className="console__plate" disabled={off}>
              Set
            </button>
          </form>
          <p className="console__note">Stops the clock and loads it full.</p>
        </section>

        <section className="console__block">
          <h2 className="console__head">
            <span>Adjust while running</span>
          </h2>
          <div className="console__keys">
            {ADJUSTMENTS.map((step) => (
              <button
                key={step}
                type="button"
                className="console__plate"
                disabled={off}
                onClick={() => void run(() => controller.adjust(step * MINUTE))}
              >
                {step > 0 ? `+${step}` : step} min
              </button>
            ))}
          </div>
        </section>

        <section className="console__block">
          <h2 className="console__head">
            <span>Cue the speaker</span>
          </h2>
          <div className="console__keys console__keys--cues">
            {CUES.map((text) => (
              <button
                key={text}
                type="button"
                className={`console__plate${
                  liveCue === text ? " console__plate--current" : ""
                }`}
                disabled={off}
                onClick={() => void run(() => controller.sendMessage(text))}
              >
                {text}
              </button>
            ))}
            <button
              type="button"
              className="console__plate"
              disabled={off || !liveCue}
              onClick={() => void run(() => controller.sendMessage(""))}
            >
              Clear
            </button>
          </div>
          <form
            className="console__form"
            onSubmit={(event) => {
              event.preventDefault();
              const text = cue.trim();
              if (!text) return;
              setCue("");
              void run(() => controller.sendMessage(text.toUpperCase()));
            }}
          >
            <input
              className="console__input"
              value={cue}
              onChange={(event) => setCue(event.target.value)}
              placeholder="Type a cue for the speaker"
              disabled={off}
              aria-label="Cue for the speaker"
            />
            <button type="submit" className="console__plate" disabled={off}>
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
