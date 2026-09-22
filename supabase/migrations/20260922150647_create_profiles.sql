create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'MiD User',
  username text,
  bio text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 60),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_bio_length check (char_length(bio) <= 160)
);

create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 5242880, array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_avatars_select_own" on storage.objects;
drop policy if exists "profile_avatars_insert_own" on storage.objects;
drop policy if exists "profile_avatars_update_own" on storage.objects;
drop policy if exists "profile_avatars_delete_own" on storage.objects;

create policy "profile_avatars_select_own" on storage.objects for select to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "profile_avatars_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "profile_avatars_update_own" on storage.objects for update to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "profile_avatars_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));