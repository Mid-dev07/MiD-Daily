# MiD-Daily — Release Checklist

## Gate A — Repository
- [ ] `main` CI has a successful frontend build.
- [ ] `main` CI has a successful backend build and test run.
- [ ] No secrets are committed to the repository.
- [ ] Supabase migrations are in timestamp order.

## Gate B — Supabase
- [ ] Apply every migration in `supabase/migrations/`.
- [ ] Confirm Auth providers and redirect URLs.
- [ ] Confirm RLS is enabled on user data tables.
- [ ] Confirm backups/restore expectations for the selected Supabase plan.

## Gate C — Render
- [ ] Deploy `mid-daily-web` from `frontend`.
- [ ] Deploy `mid-daily-api` from `backend`.
- [ ] Set all required environment variables.
- [ ] Verify `GET /health` returns HTTP 200.
- [ ] Verify frontend can reach the deployed API.

## Gate D — Authentication
- [ ] Register with email/password.
- [ ] Sign in and refresh the browser.
- [ ] Sign in with Google.
- [ ] Request password reset and complete recovery.
- [ ] Sign out and confirm protected API access is rejected without a token.

## Gate E — Core data
- [ ] Create, edit, complete, and delete a Task.
- [ ] Create, edit, and delete Finance entries.
- [ ] Create, edit, and delete Schedule items.
- [ ] Confirm data remains isolated to the signed-in user.
- [ ] Refresh and confirm remote data hydrates correctly.

## Gate F — Google Calendar
- [ ] Connect Google Calendar with the production redirect URI.
- [ ] Sync a Schedule item.
- [ ] Edit the item and verify remote update.
- [ ] Delete the item and verify remote deletion.
- [ ] Re-test after an API token refresh/restart boundary.

## Gate G — Telegram
- [ ] Configure bot username/token and webhook secret.
- [ ] Run the webhook setup command against the production backend URL.
- [ ] Generate a link code in MiD-Daily.
- [ ] Complete account linking in a private chat.
- [ ] Verify supported commands.
- [ ] Verify duplicate webhook delivery does not duplicate writes.

## Gate H — WhatsApp
- [ ] Configure Cloud API credentials and webhook verification values.
- [ ] Register the production webhook URL in Meta.
- [ ] Complete account linking.
- [ ] Verify supported commands and duplicate-event handling.
- [ ] Verify invalid signatures/challenges are rejected.

## Gate I — Assistant
- [ ] Confirm `OPENAI_API_KEY` is backend-only.
- [ ] Test read-only queries against schedule, tasks, and expenses.
- [ ] Confirm write tools are unavailable when actions are disabled.
- [ ] Enable actions and explicitly create one test Task and one test Expense.
- [ ] Confirm the UI shows returned action status.

## Gate J — Observability and limits
- [ ] Add provider/CDN rate limiting before public exposure.
- [ ] Review Render/Supabase logs after smoke tests.
- [ ] Record provider failures with enough context to diagnose without logging secrets.
- [ ] Re-test after a service restart/cold start.

## Final state
Do not mark the release complete until the production smoke tests above pass against the deployed URLs. The repository CI gate is necessary but does not replace live-provider verification.
