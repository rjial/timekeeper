# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the **timekeeper/operator** running an event from backstage or the tech desk, on a laptop or phone, under time pressure and often in low light. They watch the room and the timer at once and must act in one glance and one tap.

Second audience is the **room**: the speaker on stage and the attendees, reading a full-screen display on a projector or TV from across the room. They do not interact; they only read.

## Product Purpose

A cross-device realtime countdown for keeping live events on schedule. The operator controls one shared timer; the room display reflects every change instantly on a separate device. Success is that the speaker always knows exactly how much time is left, and the operator never has to shout, gesture, or walk across the room to change it.

## Positioning

The timer state lives on the server and is shared, not mirrored per-device. Control surface and display surface are separate devices reading the same authoritative state, so an adjustment made backstage lands on the stage screen with no manual re-sync and no clock drift between devices.

## Operating Context

Live events: conferences, talks, stage sessions, workshops. The display screen is a projector, TV, or stream overlay seen from meters away, frequently in a darkened room. The operator device is held or set on a desk beside other gear. Sessions run long; the operator adjusts on the fly rather than restarting.

## Capabilities and Constraints

Confirmed capabilities:

- Single global timer — one live timer for the whole app. No rooms, no multi-stage, no queued agenda.
- Two surfaces: an **operator console** and a **full-screen display**.
- Operator controls: start / pause / reset; live adjust (+/- minutes) mid-run; send a short message/cue to the display (e.g. "wrap up").
- Overrun: at zero the timer does not stop — it counts up past zero in a warning state.

Confirmed constraints:

- Stack stays Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript, pnpm.
- **Supabase** is the realtime backend carrying shared timer state across devices. The user supplies the Supabase configuration; do not invent project URLs, keys, table names, or schema.
- The display must be legible on a projector or TV from across a room. Big-screen legibility outranks density on that surface.

Open decisions:

- Supabase schema is proposed in `supabase/schema.sql` and not yet confirmed or applied by the owner.
- Access is open by the owner's decision: anyone with the console URL can control the live timer, with no login. The console URL is the secret. Recorded as a decision, not a gap.
- Preset durations, sound/audio cues, and stream-overlay (transparent background) mode: not specified.

## Evidence on Hand

No external evidence: no customers, events, testimonials, press, or usage data, and none may be fabricated. The project began as an unmodified `create-next-app` scaffold.

Authored in-project and real: the Control Room Slate visual system (`/display`, `/console`) and the proposed Supabase contract in `supabase/schema.sql`. No state is held per device; only the timer is shared. The rehearsal feed that runs without Supabase configuration is synthetic and labels itself `REHEARSAL` on both surfaces.

## Product Principles

1. **One glance, one tap.** The operator acts under pressure while watching the room; every control must be reachable and readable without study.
2. **Legible from across the room.** The display is read at distance, often in the dark. Remaining time is the largest thing on any screen it appears on.
3. **The shared state is the truth.** Both surfaces render server state; never let a device's local clock or optimistic UI diverge from what the room sees.
4. **Zero is not the end.** Overrun is a normal, expected state and must be designed as deliberately as the countdown itself, not treated as an error.
5. **No invented product facts.** Supabase configuration, auth model, and schema come from the user.

## Accessibility & Inclusion

No formal standard established. Product-specific need: the display is read at distance and frequently in a dark room, so contrast and type size on that surface are functional requirements, not preferences. Timer state (running, paused, overrun) must not be signalled by color alone.
