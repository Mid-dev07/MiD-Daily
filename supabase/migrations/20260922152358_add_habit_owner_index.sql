create index if not exists habit_logs_habit_user_idx
  on public.habit_logs (habit_id, user_id);
