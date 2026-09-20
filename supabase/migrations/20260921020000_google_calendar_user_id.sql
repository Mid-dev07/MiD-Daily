create table if not exists public.google_calendar_connections (
  owner_id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  encrypted_token text not null,
  connected_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists google_calendar_connections_user_id_unique_idx
  on public.google_calendar_connections (user_id)
  where user_id is not null;

update public.google_calendar_connections
set user_id = owner_id::uuid
where user_id is null
  and owner_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

alter table public.google_calendar_connections enable row level security;

revoke all on table public.google_calendar_connections from anon, authenticated;
grant all on table public.google_calendar_connections to service_role;

create index if not exists google_calendar_connections_updated_at_idx
  on public.google_calendar_connections (updated_at);

create index if not exists google_calendar_connections_user_id_idx
  on public.google_calendar_connections (user_id);
