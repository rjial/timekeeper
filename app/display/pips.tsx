import type { Phase } from "@/lib/timer/types";

/**
 * The second, non-chromatic channel for the condition: every phase differs by
 * count and shape, so the slate still reads with the color removed.
 */
export function Pips({ phase }: { phase: Phase }) {
  const common = {
    height: 20,
    fill: "currentColor",
    xmlns: "http://www.w3.org/2000/svg",
    className: "slate__pips",
    "aria-hidden": true,
  } as const;

  if (phase === "hold") {
    return (
      <svg {...common} viewBox="0 0 18 20">
        <rect x="0" y="0" width="6" height="20" />
        <rect x="12" y="0" width="6" height="20" />
      </svg>
    );
  }

  if (phase === "nosignal") {
    return (
      <svg {...common} viewBox="0 0 26 20" fill="none">
        {[0, 9, 18].map((x) => (
          <polyline
            key={x}
            points={`${x + 1},3 ${x + 6},10 ${x + 1},17`}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        ))}
      </svg>
    );
  }

  if (phase === "ready") {
    return (
      <svg {...common} viewBox="0 0 10 20">
        <rect x="0" y="5" width="10" height="10" />
      </svg>
    );
  }

  if (phase === "over") {
    return (
      <svg {...common} viewBox="0 0 42 20">
        {[0, 16, 32].map((x) => (
          <rect key={x} x={x} y="5" width="10" height="10" />
        ))}
      </svg>
    );
  }

  const count = phase === "onair" ? 1 : phase === "windup" ? 2 : 3;
  const width = count * 10 + (count - 1) * 6;
  return (
    <svg {...common} viewBox={`0 0 ${width} 20`}>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={i * 16 + 5} cy="10" r="5" />
      ))}
    </svg>
  );
}
