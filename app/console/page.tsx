import type { Metadata } from "next";
import { ConsoleScreen } from "./console-screen";

export const metadata: Metadata = {
  title: "Console",
  description: "Timekeeper controls for the room's countdown.",
};

export default function ConsolePage() {
  return <ConsoleScreen />;
}
