# MiD-Daily — Release Checklist

## Gate A — Repository
- [ ] `main` CI has a successful frontend build.
- [ ] `main` CI has a successful backend build and test run.
- [ ] No secrets are committed to the repository.
- [ ] Frontend and backend lockfiles are tracked.

## Gate B — Supabase
- [ ] Live core tables exist.
- [ ] RLS is enabled on user data tables.
- [ ] Task, Finance, and Schedule own-row policies are present.
- [ ] Integration tables remain service-only.
- [ ] Security and performance advisors reviewed.
- [ ] Leaked-password protection enabled.

## Gate C — Cloudflare
- [ ] Frontend Worker deploy succeeds.
- [ ] Backend Worker deploy succeeds.
- [ ] Frontend smoke test passes.
- [ ] `GET /health` returns HTTP 200.
- [ ] Backend secrets are present.
- [ ] Frontend reaches the production API.

## Gate D — Authentication
- [ ] Register with email/password.
- [ ] Sign in and refresh the browser.
- [ ] Sign in with Google.
- [ ] Request password reset.
- [ ] Complete password recovery.
- [ ] Sign out.
- [ ] Protected API calls reject unauthenticated access.

## Gate E — Core data
- [ ] Create, edit, complete, and delete a Task.
- [ ] Create, edit, and delete Finance entries.
- [ ] Create, edit, and delete Schedule items.
- [ ] Invalid dates/times are rejected.
- [ ] Overlapping Schedule items are rejected.
- [ ] Data remains isolated per authenticated user.
- [ ] Refresh rehydrates remote data correctly.

## Gate F — Google Calendar
- [ ] Connect Google Calendar.
- [ ] Sync a Schedule item.
- [ ] Edit and update the remote event.
- [ ] Delete the remote event.
- [ ] Recover from a remote 404.
- [ ] Verify access-token refresh behavior.

## Gate G — Telegram
- [ ] Configure bot + webhook secret.
- [ ] Set the production webhook.
- [ ] Generate a one-time link code.
- [ ] Complete private-chat linking.
- [ ] Verify supported commands.
- [ ] Verify duplicate delivery does not duplicate writes.

## Gate H — WhatsApp
- [ ] Configure Cloud API credentials.
- [ ] Register the production webhook.
- [ ] Complete account linking.
- [ ] Verify supported commands.
- [ ] Verify duplicate-event handling.
- [ ] Verify invalid signatures/challenges are rejected.

## Gate I — Assistant
- [ ] Configure the backend OpenAI key.
- [ ] Test read-only schedule/task/expense queries.
- [ ] Confirm writes are unavailable in read-only mode.
- [ ] Enable actions explicitly.
- [ ] Test one Task write and one Expense write.
- [ ] Confirm the UI reports action results.

## Gate J — UX and reliability
- [ ] Dashboard remains usable at desktop, tablet, and mobile widths.
- [ ] Mobile navigation remains reachable while scrolling.
- [ ] Modals support Escape and do not scroll the page behind them.
- [ ] Keyboard focus is visible.
- [ ] Reduced-motion preference is respected.
- [ ] Error boundary prevents full-app blank screens.
- [ ] PWA manifest loads.
- [ ] Production smoke tests pass after the latest deployment.
- [ ] Frontend performance budget remains within the documented CI thresholds.
- [ ] Core dashboard does not eagerly load optional integration UI.

## Performance gate
- Largest frontend JavaScript asset must remain below 160 KiB gzip.
- Total generated CSS must remain below 18 KiB gzip.
- Optional provider UI must remain code-split from the initial Dashboard route.
- Continuous polling in the idle shell should be avoided unless the feature explicitly requires it.

## Final state
Do not call the release final until every applicable production gate passes. Optional provider features may remain disabled when credentials or provider approval are unavailable, but the UI must state that boundary clearly.
