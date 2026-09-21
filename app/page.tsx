import Link from "next/link";

/**
 * Patch bay. Two channels exist in this product; one of them is wired.
 */
const CHANNELS = [
  {
    href: "/display",
    label: "Display",
    line: "Room-facing count for the projector or stage screen.",
    live: true,
  },
  {
    href: "/console",
    label: "Console",
    line: "The cue sheet: prepare the show, then run it with one button.",
    live: true,
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-10 px-[6vw] py-16">
      <div className="h-[6px] w-full bg-tally-clear" />
      <h1 className="text-[clamp(2rem,6vw,4.5rem)] font-bold uppercase leading-none tracking-tight [font-stretch:112%]">
        Countdown Realtime
      </h1>
      <ul className="flex flex-col">
        {CHANNELS.map((channel) => {
          const body = (
            <>
              <span className="text-[clamp(1.1rem,2.4vw,1.8rem)] font-semibold uppercase tracking-[0.2em] [font-stretch:92%]">
                {channel.label}
              </span>
              <span className="text-sm uppercase tracking-[0.26em] text-ink-dim [font-stretch:88%]">
                {channel.live ? "Wired" : "Not wired"}
              </span>
              <span className="basis-full text-base text-ink-dim">{channel.line}</span>
            </>
          );
          return (
            <li key={channel.label} className="border-t border-graticule py-6 last:border-b">
              {channel.href ? (
                <Link
                  href={channel.href}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-2 transition-colors hover:text-tally-clear"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-ink-dim">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
