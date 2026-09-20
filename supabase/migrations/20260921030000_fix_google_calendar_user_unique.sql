drop index if exists public.google_calendar_connections_user_id_unique_idx;

create unique index if not exists google_calendar_connections_user_id_unique_idx
  on public.google_calendar_connections (user_id);
