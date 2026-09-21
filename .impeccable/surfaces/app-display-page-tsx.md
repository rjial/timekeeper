---
version: 1
slug: "app-display-page-tsx"
primary_target: "app/display/page.tsx"
related_targets: []
---

# Display screen

Scope: `/display` — the full-screen room/projector surface. Visitor mode: Operate.

Audience: the speaker on stage and the room, reading at ten meters in a darkened venue. They never interact. Job: know how much time is left and what condition the session is in, in under one second, without decoding anything.

Content confirmed by the user: remaining time and the operator's pushed cue. Nothing else — no wall clock, no session title.
States that must be unmistakable at distance: running, paused, warning thresholds, overrun, connection lost.
Anti-goals stated by the user: nothing may compete with the number; no animation that draws the eye during a talk.

Constraints: Next.js 16 + React 19 + Tailwind v4. Supabase carries shared timer state; the user declares the configuration, so the schema in code is a proposed contract awaiting their confirmation.

## Direction contract

THESIS: The room's clock is a studio slate, not a timer widget. A control room never asks anyone to interpret a number — it puts the condition on the wall as a lit state and lets the count live inside it. This refuses the category arrangement: a centered white count on near-black inside a rounded container with a progress ring and a muted caption.

OWN-WORLD: Control-room broadcast. Near-black panel ground (#07090A) with vectorscope-graticule hairlines; a tally strip across the top edge that is lit, not decorated — studio cue green, amber, on-air red; engraved panel caps, widely tracked, for every label; one variable grotesque (Archivo, width and weight axes) at two widths, expanded for the count, condensed for caps; SMPTE 75% color bars reserved for exactly one state. One ink per state: white, amber, red-ink, then a red field. No containers, no rings, no rounded cards, no gradients.

STORY: The speaker glances up and reads a condition before a number: on air, wind up, cut, over, hold, no signal. They believe the feed is live because one hairline is sweeping. They act by finishing on time; when a cue arrives in the bottom band, they act on that instead.

FIRST VIEWPORT: A declared 12x8 ruling of the whole viewport, nothing centered by improvisation. Row 1: the tally strip, full bleed, carrying the state color. Row 2: state word in engraved caps at the left, pip mark at the right (one pip ON AIR, two WIND UP, three CUT, knockout three OVER, pause bars HOLD, chevrons NO SIGNAL) so no state is signalled by color alone. Rows 3-7: the count, measured to fill the ruling at the widest format it can reach, tabular, no reflow. Row 8: the cue band, unlit black until the operator pushes text. Bottom 2px: the clock-wipe hairline, the surface's only continuous motion, sweeping once per second as proof of sync; it stops when the timer is held and dies when the feed dies. Overrun inverts the field to on-air red with knocked-out black numerals — the one moment the screen is allowed to light the room.

FORM: Control Room Slate, candidate 1 of my ordered grounded list, taken by the user from the IMPECCABLE'S PICK card over the rolled assignment (Pit Wall, index 5). Seed key d85af6e8, code-led. Four raises carry over from the declined challengers: the state owns the whole field, not a badge (gravity-rain garden); one declared ruling places every element (Miura sheet); ground luminance is budgeted for a dark venue (darkroom safelight); one ink per state, hierarchy by scale and density (ASCII render).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Supabase table/channel shape is a proposed contract in `lib/timer/`, not user-confirmed.
- Warning threshold values default to 5:00 and 1:00; not confirmed by the user.
- Operator console is a separate surface, not built here.
