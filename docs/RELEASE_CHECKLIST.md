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
- [ ] Native leaked-password protection: documented Free-plan limitation; application-level HIBP protection is enabled.

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

## Gate E — Profile
- [ ] Profile is created for an authenticated user on first open.
- [ ] Display name, username, and bio save and reload correctly.
- [ ] Username format and uniqueness validation work.
- [ ] Profile avatar upload, replacement, signed display, and removal work.
- [ ] Avatar storage is private and restricted to the owning user.

## Gate F1 — Productivity layer
- [ ] Quick Capture creates only the explicitly requested Task, Expense, or Schedule item.
- [ ] Quick Capture explains missing/ambiguous information without creating data.
- [ ] Daily Briefing reflects current tasks, schedule, near deadlines, and today's spending.
- [ ] Assistant planner shortcuts remain read-only until action permission is explicitly enabled.

## Gate F2 — Habits
- [ ] Create a habit with one or more target weekdays.
- [ ] Mark and unmark completed days.
- [ ] Streak and weekly progress update correctly.
- [ ] Edit and archive habits.
- [ ] Habit and log rows remain isolated to the authenticated owner.

## Gate F — Core data
- [ ] Create, edit, complete, and delete a Task.
- [ ] Create, edit, and delete Finance entries.
- [ ] Create, edit, and delete Schedule items.
- [ ] Invalid dates/times are rejected.
- [ ] Overlapping Schedule items are rejected.
- [ ] Data remains isolated per authenticated user.
- [ ] Refresh rehydrates remote data correctly.

## Gate J — Productivity layer
- [ ] Quick Capture creates only the explicitly requested Task, Expense, or Schedule item.
- [ ] Quick Capture explains missing/ambiguous information without creating data.
- [ ] Daily Briefing reflects current tasks, schedule, near deadlines, and today's spending.
- [ ] Assistant planner shortcuts remain read-only until action permission is explicitly enabled.

## Gate G — Google Calendar
- [ ] Connect Google Calendar.
- [ ] Sync a Schedule item.
- [ ] Edit and update the remote event.
- [ ] Delete the remote event.
- [ ] Recover from a remote 404.
- [ ] Verify access-token refresh behavior.

## Gate H — Telegram
- [ ] Configure bot + webhook secret.
- [ ] Set the production webhook.
- [ ] Generate a one-time link code.
- [ ] Complete private-chat linking.
- [ ] Verify supported commands.
- [ ] Verify duplicate delivery does not duplicate writes.
- [ ] Verify `/ai <request>` and normal natural-language messages reach the shared Assistant.

## Gate I — WhatsApp (deferred)
- [ ] Not applicable to the current production scope.
- WhatsApp is intentionally skipped; do not treat missing WhatsApp credentials as a release failure.

## Gate K — Assistant
- [ ] Verify the Cloudflare Workers AI binding is available in production.
- [ ] Test read-only schedule/task/expense queries.
- [ ] Confirm writes are unavailable in read-only mode.
- [ ] Enable actions explicitly.
- [ ] Test one Task write and one Expense write.
- [ ] Confirm the UI reports action results.
- [ ] Verify the same Assistant/tool permission boundaries apply from Telegram.
- [ ] Assistant can read active habit context without receiving habit write tools.

## Gate L1 — Command Center
- [ ] Global Search opens with Ctrl/Cmd+K, focuses input, closes with Escape, and navigates to Task/Finance/Schedule results.
- [ ] Notification Center shows actionable attention items, supports per-item dismissal, and persists dismissals per user.
- [ ] Notification timing refreshes without idle polling storms.
- [ ] Focus Mode can select an open task, start/pause/reset a 25-minute session, and mark the task complete.

## Gate L — UX and reliability
- [ ] Dashboard remains usable at desktop, tablet, and mobile widths.
- [ ] Mobile navigation remains reachable while scrolling.
- [ ] Browser URL reflects the active workspace view and Back/Forward restores it.
- [ ] Realtime workspace updates are received by a second authenticated tab/device.
- [ ] Auth logout resets the active in-memory workspace before demo state is loaded.
- [ ] Background reminder dispatch is deduplicated and does not depend on an open browser tab for connected Telegram/WhatsApp users.
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
Do not call the release final until every applicable production gate passes. Deferred providers may remain unconfigured when they are explicitly out of scope for the current release, but the UI must state that boundary clearly. Core features and every in-scope integration must be operational. For Telegram AI, both the explicit `/ai` command and ordinary messages should use the shared Assistant gateway.
