import type { Metadata } from "next";
import { DisplayScreen } from "./display-screen";

export const metadata: Metadata = {
  title: "Display",
  description: "Room-facing countdown for the stage screen.",
};

export default function DisplayPage() {
  return <DisplayScreen />;
}
