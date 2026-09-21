This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Countdown Realtime

Two surfaces: `/display` (room-facing, built) and the operator console (not built yet).

### Configure Supabase

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply `supabase/schema.sql` first. That schema is a **proposed contract** — the
display reads exactly that shape, and the adapter in
`lib/timer/supabase-source.ts` is the single place to change if your project
already uses a different one.

With no configuration present the display runs a rehearsal feed and says
`REHEARSAL` on the slate rather than passing a local number off as the room's.

### Checking the display before doors

Every condition can be pinned so a venue can be checked against a real
projector:

- `/display?rehearse=onair`
- `/display?rehearse=windup` — under five minutes
- `/display?rehearse=cut` — under one minute
- `/display?rehearse=over` — past zero
- `/display?rehearse=hold` — held
- `/display?rehearse=nosignal` — feed lost

`f` toggles full screen. The pointer hides after three seconds and the screen
is kept awake while the page is visible.

### Console

`/console` is the timekeeper's surface, in the order the job happens:

1. **Session length** — 15 / 20 / 30 / 45, or a custom value (`30` or `30:00`).
   The default is 30 minutes. Setting a length stops the clock and loads it full.
2. **Start / Hold**, with Reset beside it.
3. **Adjust while running** — ±1 and ±5 minutes, including past zero.
4. **Cue the speaker** — four canned cues, a free-typed one, and Clear.

The top of the console always shows what the room reads right now: the same
count and the same cue.

**Access is open by design:** anyone with the console URL can control the live
timer. The write path is a set of `security definer` functions in
`supabase/schema.sql`, executable by `anon`. To close it later, revoke execute
from `anon` and grant it to `authenticated`; no application code changes.

### Verifying the wiring

```bash
pnpm check:supabase
```

Walks the whole path the surfaces use: the row is readable, `server_now()`
agrees with this device's clock, then set → start → adjust → hold → cue, then
the realtime subscription. It restores the row to what it found, so it is safe
to run against a live project between sessions.

## Deploying to Cloudflare Pages

Every route is static and the only backend is Supabase, so `next build` writes
a plain folder (`out/`). No adapter, no Workers runtime, nothing to cold-start
before a talk.

**Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**

| Setting | Value |
| --- | --- |
| Framework preset | None (or Next.js Static HTML Export) |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Both variables are **build-time**: Next inlines `NEXT_PUBLIC_*` into the
bundle, so changing one in Cloudflare requires a redeploy, not a restart. Do
not add `CONSOLE_PASSPHRASE` there — the app never reads it; it is typed at the
console's gate.

### Before the first public deploy

Run `supabase/002-passphrase.sql` in the SQL editor, with your own passphrase
on its last line. It moves the gate into Postgres and **drops the ungated write
functions**, so the order matters: until it runs, a deployed console cannot
write.

### On event day

- Free-tier Supabase pauses a project after about a week idle, and a paused
  project reads as `NO SIGNAL` on the projector. Open the display once before
  doors.
- `pnpm check:supabase` verifies the whole path from any machine.

## Deploying to GitHub Pages

Also supported, and already wired: `.github/workflows/deploy-pages.yml` builds
the export and publishes it on every push to `main`.

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Secrets and variables → Actions → Variables:** add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

They are repository *variables*, not secrets, deliberately: both ship inside
the browser bundle on any host and are public by design. The timer is guarded
by the passphrase checked in Postgres, which never leaves your database.

Three things a plain file host needs, all handled in `next.config.ts` and the
workflow:

- **`basePath`** — a project site lives at `/<repo>`, so assets and links carry
  that prefix. The workflow passes it from `actions/configure-pages`; locally it
  is empty. A custom domain or a `<user>.github.io` repo needs no prefix and
  this stays out of the way.
- **`.nojekyll`** — GitHub runs Jekyll by default, which drops the `_next`
  directory and serves a page with no CSS. `public/.nojekyll` ships an empty
  file that switches Jekyll off.
- **`trailingSlash`** — `/console` resolves to `/console/index.html`.

The tradeoff against Cloudflare Pages: GitHub Pages has no free custom-domain
password protection and is always public. That does not weaken the timer — the
gate is in the database, not the page — but the display URL is guessable by
anyone who knows the repo.

### The house clock

Both surfaces show time of day in the slate line, corrected by the server
offset so it agrees with the countdown even when a device's clock does not.
Minutes only — seconds would put a second moving number on a screen that has
to stay still.
