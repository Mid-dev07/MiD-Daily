create table if not exists public.telegram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null unique,
  telegram_user_id bigint,
  telegram_username text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_link_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_codes_user_id_idx
  on public.telegram_link_codes (user_id);

create index if not exists telegram_link_codes_expires_at_idx
  on public.telegram_link_codes (expires_at);

alter table public.telegram_connections enable row level security;
alter table public.telegram_link_codes enable row level security;

revoke all on table public.telegram_connections from anon, authenticated;
revoke all on table public.telegram_link_codes from anon, authenticated;
grant all on table public.telegram_connections to service_role;
grant all on table public.telegram_link_codes to service_role;

drop trigger if exists telegram_connections_set_updated_at on public.telegram_connections;
create trigger telegram_connections_set_updated_at before update on public.telegram_connections for each row execute function public.set_updated_at();
