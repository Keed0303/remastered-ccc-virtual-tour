-- Accounts, character looks, passport count, and logged-in-only presence.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  gender text not null check (gender in ('female', 'male')),
  skin_color text not null default '#e0ac84' check (skin_color ~ '^#[0-9a-fA-F]{6}$'),
  hair_color text not null default '#2a2118' check (hair_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Logged-in users can read profiles" on public.profiles;
create policy "Logged-in users can read profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Creates the profile from sign-up metadata. Bad values fall back to safe defaults,
-- so they can never block an account from being created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(trim(coalesce(meta ->> 'display_name', '')), 24);
  v_skin text := meta ->> 'skin_color';
  v_hair text := meta ->> 'hair_color';
begin
  if char_length(v_name) < 2 then
    v_name := 'Student';
  end if;
  insert into public.profiles (id, display_name, gender, skin_color, hair_color)
  values (
    new.id,
    v_name,
    case when meta ->> 'gender' = 'female' then 'female' else 'male' end,
    case when v_skin ~ '^#[0-9a-fA-F]{6}$' then v_skin else '#e0ac84' end,
    case when v_hair ~ '^#[0-9a-fA-F]{6}$' then v_hair else '#2a2118' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The number of Student Passports issued. Returns only a count, so visitors can see it.
create or replace function public.passport_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.profiles;
$$;

revoke all on function public.passport_count() from public;
grant execute on function public.passport_count() to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Only logged-in users may join the private "campus" Realtime channel.
drop policy if exists "Logged-in users can read campus" on realtime.messages;
create policy "Logged-in users can read campus"
  on realtime.messages for select to authenticated
  using ((select realtime.topic()) = 'campus');

drop policy if exists "Logged-in users can write campus" on realtime.messages;
create policy "Logged-in users can write campus"
  on realtime.messages for insert to authenticated
  with check ((select realtime.topic()) = 'campus');
