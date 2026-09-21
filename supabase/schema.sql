-- PROPOSED CONTRACT — not yet confirmed by the project owner.
-- The display (`/display`) reads exactly this shape. Apply it to your Supabase
-- project, or tell me the shape you already have and the adapter in
-- `lib/timer/supabase-source.ts` moves to match it.

create table if not exists public.timer_state (
  id           text primary key default 'global',
  running      boolean     not null default false,
  -- Absolute instant the count reaches zero. Set while running, null while held.
  ends_at      timestamptz,
  -- Frozen remainder while held, in milliseconds.
  remaining_ms bigint      not null default 1800000,
  -- Configured session length, in milliseconds. Default is 30 minutes.
  duration_ms  bigint      not null default 1800000,
  -- Operator cue shown in the display's bottom band. Empty means no cue.
  message      text        not null default '',
  updated_at   timestamptz not null default now()
);

insert into public.timer_state (id) values ('global') on conflict do nothing;

create or replace function public.touch_timer_state()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists timer_state_touch on public.timer_state;
create trigger timer_state_touch
  before update on public.timer_state
  for each row execute function public.touch_timer_state();

-- The display measures its own clock against this so two devices agree on the
-- same instant even when one of them is wrong. Without it the display falls
-- back to the device clock uncorrected.
create or replace function public.server_now()
returns timestamptz language sql stable as $$ select now() $$;

-- Realtime delivery of row changes to the display.
alter publication supabase_realtime add table public.timer_state;

-- The display is read-only and anonymous; the console's write path is a
-- separate decision and is deliberately not granted here.
alter table public.timer_state enable row level security;

drop policy if exists timer_state_read on public.timer_state;
create policy timer_state_read
  on public.timer_state for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Console write path.
--
-- The timer's instant is decided here, never by the console's clock: every
-- action reads now() on the server, so a laptop with a wrong clock cannot
-- shift what the room sees.
--
-- ACCESS: the project owner chose open access — anyone who has the console URL
-- can control the live timer, with no login. These functions are therefore
-- security definer and executable by anon. Treat the console URL as the
-- secret. To close this later, revoke execute from anon and grant it to
-- authenticated instead; no application code has to change.
-- ---------------------------------------------------------------------------

create or replace function public.timer_set(p_duration_ms bigint)
returns void language sql security definer set search_path = public as $$
  update public.timer_state
     set duration_ms = p_duration_ms,
         remaining_ms = p_duration_ms,
         running = false,
         ends_at = null
   where id = 'global';
$$;

create or replace function public.timer_start()
returns void language sql security definer set search_path = public as $$
  update public.timer_state
     set running = true,
         ends_at = now() + make_interval(secs => remaining_ms / 1000.0)
   where id = 'global' and running = false;
$$;

create or replace function public.timer_hold()
returns void language sql security definer set search_path = public as $$
  update public.timer_state
     set running = false,
         remaining_ms = extract(epoch from (ends_at - now())) * 1000,
         ends_at = null
   where id = 'global' and running = true and ends_at is not null;
$$;

create or replace function public.timer_reset()
returns void language sql security definer set search_path = public as $$
  update public.timer_state
     set running = false,
         remaining_ms = duration_ms,
         ends_at = null
   where id = 'global';
$$;

-- Adjusting while over time is allowed: the remainder stays negative and the
-- room keeps counting up.
create or replace function public.timer_adjust(p_delta_ms bigint)
returns void language sql security definer set search_path = public as $$
  update public.timer_state
     set ends_at = case when running then ends_at + make_interval(secs => p_delta_ms / 1000.0) else ends_at end,
         remaining_ms = case when running then remaining_ms else remaining_ms + p_delta_ms end
   where id = 'global';
$$;

create or replace function public.timer_message(p_message text)
returns void language sql security definer set search_path = public as $$
  update public.timer_state set message = coalesce(p_message, '') where id = 'global';
$$;

grant execute on function
  public.timer_set(bigint),
  public.timer_start(),
  public.timer_hold(),
  public.timer_reset(),
  public.timer_adjust(bigint),
  public.timer_message(text),
  public.server_now()
to anon, authenticated;
