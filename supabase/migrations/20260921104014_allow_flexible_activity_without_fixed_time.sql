alter table public.schedule_items
  alter column start_time drop not null,
  alter column end_time drop not null;

alter table public.schedule_items
  drop constraint if exists schedule_items_end_time_check;

alter table public.schedule_items
  add constraint schedule_items_end_time_check
    check (
      (activity_mode = 'FLEXIBLE' and start_time is null and end_time is null)
      or
      (activity_mode <> 'FLEXIBLE' and start_time is not null and end_time is not null and end_time > start_time)
    );
