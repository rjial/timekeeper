-- ---------------------------------------------------------------------------
-- Console passphrase gate.
--
-- Run this AFTER schema.sql, once, in the Supabase SQL editor.
--
-- The console is a browser page: its key and its code are public, so a check
-- written in JavaScript protects nothing. The gate is enforced here instead —
-- every write function now requires the passphrase, and the display's
-- read-only access is untouched.
--
-- SET YOUR PASSPHRASE on the last line of this file before running it.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.console_access (
  id   text primary key default 'global',
  hash text not null
);

-- Nobody reads this table from the browser. No policy is created, and RLS
-- with no policy denies everything to anon and authenticated alike.
alter table public.console_access enable row level security;

create or replace function public.set_console_passphrase(p_new text)
returns void language sql security definer set search_path = public, extensions as $$
  insert into public.console_access (id, hash)
  values ('global', extensions.crypt(p_new, extensions.gen_salt('bf')))
  on conflict (id) do update set hash = excluded.hash;
$$;

-- Deliberately not granted to anon: the passphrase is changed from the SQL
-- editor, never from the app.
revoke all on function public.set_console_passphrase(text) from anon, authenticated;

create or replace function public.console_unlocked(p_pass text)
returns boolean language sql security definer stable set search_path = public, extensions as $$
  select exists (
    select 1 from public.console_access
    where id = 'global' and hash = extensions.crypt(coalesce(p_pass, ''), hash)
  );
$$;

grant execute on function public.console_unlocked(text) to anon, authenticated;

-- --- Every write now takes the passphrase -----------------------------------

create or replace function public.timer_set(p_duration_ms bigint, p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state
     set duration_ms = p_duration_ms,
         remaining_ms = p_duration_ms,
         running = false,
         ends_at = null
   where id = 'global';
end;
$$;

create or replace function public.timer_start(p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state
     set running = true,
         ends_at = now() + make_interval(secs => remaining_ms / 1000.0)
   where id = 'global' and running = false;
end;
$$;

create or replace function public.timer_hold(p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state
     set running = false,
         remaining_ms = extract(epoch from (ends_at - now())) * 1000,
         ends_at = null
   where id = 'global' and running = true and ends_at is not null;
end;
$$;

create or replace function public.timer_reset(p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state
     set running = false, remaining_ms = duration_ms, ends_at = null
   where id = 'global';
end;
$$;

create or replace function public.timer_adjust(p_delta_ms bigint, p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state
     set ends_at = case when running then ends_at + make_interval(secs => p_delta_ms / 1000.0) else ends_at end,
         remaining_ms = case when running then remaining_ms else remaining_ms + p_delta_ms end
   where id = 'global';
end;
$$;

create or replace function public.timer_message(p_message text, p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.console_unlocked(p_pass) then
    raise exception 'wrong passphrase' using errcode = '28000';
  end if;
  update public.timer_state set message = coalesce(p_message, '') where id = 'global';
end;
$$;

-- The old ungated versions must go, or they remain a way in.
drop function if exists public.timer_set(bigint);
drop function if exists public.timer_start();
drop function if exists public.timer_hold();
drop function if exists public.timer_reset();
drop function if exists public.timer_adjust(bigint);
drop function if exists public.timer_message(text);

grant execute on function
  public.timer_set(bigint, text),
  public.timer_start(text),
  public.timer_hold(text),
  public.timer_reset(text),
  public.timer_adjust(bigint, text),
  public.timer_message(text, text)
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Set the passphrase LAST, and set it in the SQL editor — not here.
--
-- If you type your real passphrase into this file and commit it, a public
-- repository publishes your gate. Run the line below on its own, with your own
-- value, in the Supabase SQL editor:
--
--   select public.set_console_passphrase('your-crew-passphrase');
--
-- To change it later, run that same line again with the new value.
-- ---------------------------------------------------------------------------
