create table if not exists public.telegram_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

alter table public.telegram_updates enable row level security;
revoke all on table public.telegram_updates from anon, authenticated;
grant all on table public.telegram_updates to service_role;

create index if not exists telegram_updates_received_at_idx
  on public.telegram_updates (received_at);
