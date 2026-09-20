create table if not exists public.google_calendar_connections (
  owner_id text primary key,
  encrypted_token text not null,
  connected_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

revoke all on table public.google_calendar_connections from anon, authenticated;
grant all on table public.google_calendar_connections to service_role;

create index if not exists google_calendar_connections_updated_at_idx
  on public.google_calendar_connections (updated_at);
