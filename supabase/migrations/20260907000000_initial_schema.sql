create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 500),
  scheduled_date date not null,
  priority text not null check (priority in ('red', 'yellow', 'green')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_completion_consistency check (
    (is_completed = true and completed_at is not null)
    or (is_completed = false and completed_at is null)
  )
);

create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  text text not null default '' check (char_length(text) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.upcoming_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  event_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_date_idx on public.tasks (user_id, scheduled_date, sort_order);
create index tasks_user_completed_idx on public.tasks (user_id, completed_at) where is_completed = true;
create index notes_user_date_idx on public.daily_notes (user_id, date desc);
create index events_user_date_idx on public.upcoming_events (user_id, event_date);

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.daily_notes
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.upcoming_events
for each row execute function public.set_updated_at();

create or replace function public.enforce_three_upcoming_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_date <= current_date then
    raise exception 'The event date must be in the future.';
  end if;
  if (select count(*) from public.upcoming_events where user_id = new.user_id and event_date > current_date) >= 3 then
    raise exception 'A maximum of three upcoming events is allowed.';
  end if;
  return new;
end;
$$;

create trigger upcoming_events_limit before insert on public.upcoming_events
for each row execute function public.enforce_three_upcoming_events();

alter table public.tasks enable row level security;
alter table public.daily_notes enable row level security;
alter table public.upcoming_events enable row level security;

create policy "Users can read their tasks" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their tasks" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their tasks" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their tasks" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their notes" on public.daily_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their notes" on public.daily_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their notes" on public.daily_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their notes" on public.daily_notes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their events" on public.upcoming_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their events" on public.upcoming_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their events" on public.upcoming_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their events" on public.upcoming_events for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.daily_notes to authenticated;
grant select, insert, update, delete on public.upcoming_events to authenticated;

alter table public.tasks replica identity full;
alter table public.daily_notes replica identity full;
alter table public.upcoming_events replica identity full;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.daily_notes;
alter publication supabase_realtime add table public.upcoming_events;
