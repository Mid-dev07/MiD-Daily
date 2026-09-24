create table if not exists public.instagram_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists instagram_oauth_states_user_idx
  on public.instagram_oauth_states (user_id);

create index if not exists instagram_oauth_states_expires_idx
  on public.instagram_oauth_states (expires_at);

alter table public.instagram_oauth_states enable row level security;

revoke all on table public.instagram_oauth_states from anon, authenticated;
grant all on table public.instagram_oauth_states to service_role;

drop policy if exists "instagram_oauth_states_deny_client" on public.instagram_oauth_states;
create policy "instagram_oauth_states_deny_client"
  on public.instagram_oauth_states for all to anon, authenticated
  using (false) with check (false);
