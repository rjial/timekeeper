import type { Phase } from "./types";

/** Floor-manager language: the condition read before the number. */
export const CONDITION: Record<Phase, string> = {
  ready: "Ready",
  onair: "On air",
  windup: "Wind up",
  cut: "Cut",
  over: "Over",
  hold: "Hold",
  nosignal: "No signal",
};

/** SMPTE 75% bars — what a control room puts up when there is no feed. */
export const BARS = [
  "#c0c0c0",
  "#c0c000",
  "#00c0c0",
  "#00c000",
  "#c000c0",
  "#c00000",
  "#0000c0",
];
