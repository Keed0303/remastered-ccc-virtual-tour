-- Roles, admin permissions, and site-wide settings.

alter table public.profiles
  add column if not exists role text not null default 'student' check (role in ('student', 'admin'));

-- Users may edit their own look and name, but never their role.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, gender, skin_color, hair_color) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  show_wireframe boolean not null default true,
  show_students boolean not null default true,
  show_vehicles boolean not null default true,
  show_labels boolean not null default true,
  npc_count integer not null default 46 check (npc_count between 0 and 200),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Anyone can read settings" on public.app_settings;
create policy "Anyone can read settings"
  on public.app_settings for select to anon, authenticated
  using (true);

drop policy if exists "Admins can update settings" on public.app_settings;
create policy "Admins can update settings"
  on public.app_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke insert, delete, truncate on public.app_settings from anon, authenticated;

-- Live updates on the campus when an admin saves settings.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end;
$$;
