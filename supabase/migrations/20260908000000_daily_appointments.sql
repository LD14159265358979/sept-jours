create table public.daily_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  appointment_time time not null,
  description text not null check (char_length(trim(description)) between 1 and 180),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_completion_consistency check (
    (is_completed = true and completed_at is not null)
    or (is_completed = false and completed_at is null)
  )
);

create index appointments_user_date_idx on public.daily_appointments (user_id, date, appointment_time);

create trigger appointments_set_updated_at before update on public.daily_appointments
for each row execute function public.set_updated_at();

create or replace function public.enforce_three_daily_appointments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.daily_appointments
    where user_id = new.user_id and date = new.date
  ) >= 3 then
    raise exception 'A maximum of three appointments per day is allowed.';
  end if;
  return new;
end;
$$;

create trigger daily_appointments_limit before insert on public.daily_appointments
for each row execute function public.enforce_three_daily_appointments();

alter table public.daily_appointments enable row level security;

create policy "Users can read their appointments" on public.daily_appointments for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their appointments" on public.daily_appointments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their appointments" on public.daily_appointments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their appointments" on public.daily_appointments for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.daily_appointments to authenticated;

alter table public.daily_appointments replica identity full;
alter publication supabase_realtime add table public.daily_appointments;
