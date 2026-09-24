-- Per-user Instagram connection storage. Secrets remain server-only.
create table if not exists public.instagram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_account_id text not null,
  username text,
  encrypted_access_token text not null,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'connected'
    check (status in ('connected','degraded','revoked'))
);

create unique index if not exists instagram_connections_provider_account_idx
  on public.instagram_connections (provider_account_id);

create index if not exists instagram_connections_updated_at_idx
  on public.instagram_connections (updated_at desc);

alter table public.instagram_connections enable row level security;

revoke all on table public.instagram_connections from anon, authenticated;
grant all on table public.instagram_connections to service_role;

drop policy if exists "instagram_connections_deny_client" on public.instagram_connections;
create policy "instagram_connections_deny_client"
  on public.instagram_connections for all to anon, authenticated
  using (false) with check (false);

drop trigger if exists instagram_connections_set_updated_at on public.instagram_connections;
create trigger instagram_connections_set_updated_at
  before update on public.instagram_connections
  for each row execute function public.set_updated_at();
