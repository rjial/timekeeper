---
version: 1
slug: "app-console-page-tsx"
primary_target: "app/console/page.tsx"
related_targets: []
---

# Operator console

Scope: `/console` — the timekeeper's control surface. Visitor mode: Operate. The world is settled: this surface inherits Control Room Slate from `/display` and changes nothing about it.

Audience: one timekeeper, working from a phone in the hand backstage **and** a laptop at the tech desk — neither is primary, so the composition has to hold at both. Dark room, under time pressure, attention mostly on the stage.

Confirmed by the user: typed durations and preset buttons; free-typed cue messages and canned cue buttons; access is open — anyone with the console URL can control the timer, with no login. That is the user's decision, recorded as a risk in `supabase/schema.sql` and the README, not designed around.

## Direction contract

THESIS: The console is the job in order, and nothing else. The operator answers three questions top to bottom — how long, run it, change it — and every block is one row of large keys with a plain caption. The earlier cue-sheet structure was replaced on the user's instruction ("i want to simple ... because i dont understand of this app right now"); the refusal it carried still stands, but it is now delivered by removing controls rather than by deferring them into a stack.

OWN-WORLD: Inherited unchanged from `/display`: #07090A panel ground, the lit tally strip carrying the live condition, engraved caps widely tracked, Archivo at two widths, drawn pips, hard cuts with no fades. Added for this surface only, in the same grammar: one oversized START plate that keeps the affirmative green on every condition, because the state ink erases it on hold and a held timer is not a disabled console; grids of 48px engraved keys under plain captions; hairlines only where a field is divided. Status takes the condition's ink, the desk's own controls never do, and on overrun only the strip and the status go red — the desk stays dark, because no small label clears 4.5:1 on that field. No cards, no rounded containers, no shadows, no gradients.

STORY: The operator opens the desk and finds it READY with 30:00 already loaded, so the first thing they see is a length and a way to start it. They change the length if the session is not 30, press START, and then mostly watch the room. When the speaker runs long they reach for ±1 or ±5; when the speaker needs telling, they send a cue. Nothing is armed in advance and nothing is modal: every control acts the moment it is pressed, and the whole desk de-energises when the room can no longer hear it.

FIRST VIEWPORT: One column, 44rem wide, centred, identical in the hand and at the desk. Tally strip across the top edge carrying the live condition; slate line beneath it with the condition word, the CONSOLE field and the pip mark. Then the mirror: what the room reads, as the count at display scale with the live cue under it in two reserved lines, so an arriving cue never moves the button below. Then one oversized START/HOLD plate in affirmative green with RESET beside it. Then three labelled blocks of 48px keys in the order the job happens: session length (15/20/30/45, default 30, plus a custom field), adjust while running (±1, ±5), cue the speaker (four canned, one typed, clear). Nothing is modal, nothing is hidden behind a mode, and the whole desk de-energises when the feed is lost.

FORM: Cue Sheet was dealt by seed d3c19bb3 (hand 5/7/6) and locked by the user, built, reviewed, and then retired at the user's instruction as too complex to operate. A user-pinned decision beats the roll, so the shipped form is the plain stack above. The cue model, the per-device sheet in localStorage, and the GO plate were deleted rather than hidden. Code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Access is open by the user's decision; no gate is built. Recorded as an open decision in PRODUCT.md.
- The cue sheet was removed; there is no per-device state left on this surface. Only the timer is shared.
- Display fix batch from its finish review is still outstanding and is not part of this surface.
