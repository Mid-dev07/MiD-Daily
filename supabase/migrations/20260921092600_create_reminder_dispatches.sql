create table if not exists public.reminder_dispatches (
  dispatch_key text primary key,
  schedule_id bigint not null references public.schedule_items(id) on delete cascade,
  channel text not null check (channel in ('telegram','whatsapp')),
  occurrence_date date not null,
  trigger_at time not null,
  sent_at timestamptz not null default now()
);

create index if not exists reminder_dispatches_schedule_idx
  on public.reminder_dispatches (schedule_id, occurrence_date);

create index if not exists reminder_dispatches_sent_at_idx
  on public.reminder_dispatches (sent_at);

alter table public.reminder_dispatches enable row level security;
revoke all on table public.reminder_dispatches from anon, authenticated;
grant all on table public.reminder_dispatches to service_role;
