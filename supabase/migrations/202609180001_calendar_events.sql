create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  start_date date not null,
  event_time time not null,
  recurrence text not null default 'none' check (recurrence in ('none', 'weekly')),
  recurrence_end_date date,
  reminder_text text check (reminder_text is null or char_length(trim(reminder_text)) between 1 and 180),
  excluded_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_end_after_start check (
    recurrence_end_date is null or recurrence_end_date >= start_date
  )
);

create index calendar_events_user_start_idx on public.calendar_events (user_id, start_date, event_time);

create trigger calendar_events_set_updated_at before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "Users can read their calendar events" on public.calendar_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their calendar events" on public.calendar_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their calendar events" on public.calendar_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their calendar events" on public.calendar_events for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.calendar_events to authenticated;

alter table public.calendar_events replica identity full;
alter publication supabase_realtime add table public.calendar_events;
