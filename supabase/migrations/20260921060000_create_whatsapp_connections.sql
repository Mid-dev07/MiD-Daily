create table if not exists public.whatsapp_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wa_id text not null unique,
  phone_number text,
  display_name text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_link_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_updates (
  update_hash text primary key,
  received_at timestamptz not null default now()
);

alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_link_codes enable row level security;
alter table public.whatsapp_updates enable row level security;

revoke all on table public.whatsapp_connections, public.whatsapp_link_codes, public.whatsapp_updates from anon, authenticated;
grant all on table public.whatsapp_connections, public.whatsapp_link_codes, public.whatsapp_updates to service_role;

drop trigger if exists whatsapp_connections_set_updated_at on public.whatsapp_connections;
create trigger whatsapp_connections_set_updated_at before update on public.whatsapp_connections for each row execute function public.set_updated_at();

create index if not exists whatsapp_link_codes_user_id_idx on public.whatsapp_link_codes (user_id);
create index if not exists whatsapp_link_codes_expires_at_idx on public.whatsapp_link_codes (expires_at);
