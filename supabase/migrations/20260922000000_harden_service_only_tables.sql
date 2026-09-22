-- MiD-Daily: explicit defense-in-depth deny policies for server-only tables.
-- Client roles already lack table privileges; these policies make the RLS boundary explicit as well.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'google_calendar_connections',
    'telegram_connections',
    'telegram_link_codes',
    'telegram_updates',
    'whatsapp_connections',
    'whatsapp_link_codes',
    'whatsapp_updates',
    'reminder_dispatches'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_deny_client', table_name);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false)',
      table_name || '_deny_client',
      table_name
    );
  end loop;
end $$;
