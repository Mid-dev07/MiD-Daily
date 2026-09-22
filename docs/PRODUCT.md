# MiD-Daily — Product Baseline

## Vision
MiD-Daily is a lightweight personal daily-management workspace that brings schedule, tasks, finance, and connected assistants into one calm, nature-led interface.

## Target
Personal use first, with a clear ownership model suitable for small-scale multi-user expansion.

## Core modules
- Dashboard / daily overview
- Schedule / agenda
- Tasks / focus and progress
- Finance / income and expenses
- Authentication / account and recovery
- Profile / photo, display name, username, and bio
- Quick Capture / task, expense, and schedule capture from Today
- Daily Briefing / current priorities and daily context
- Habits / repeatable routines and weekly streaks
- Insights / current workload and weekly context

### Product roadmap
- Phase 1: Quick Capture + Daily Briefing — complete.
- Phase 2: AI Planner + Insights — complete.
- Phase 3: Habits / routines — complete.
- Phase 4: UNREAL Living Environment — complete.
- Phase 5: UNREAL Habitat Shell + ecosystem convergence — complete.
- Phase 6: Production hardening and release certification — complete for the automated production gates described below.
- Phase 7: UI/UX Refinement — complete for the current interface scope: reduce information duplication, consolidate secondary actions, simplify provider setup surfaces, sharpen page-specific hierarchy, and preserve the UNREAL environment under responsive/reduced-motion constraints.

The roadmap is complete for the current product scope. Provider-specific setup and interactive account-consent checks remain explicit deployment/operations work, not hidden product phases.

## Connected modules
- Browser/device reminders
- Google Calendar
- Telegram
- Assistant

## Deferred / operational boundaries
- WhatsApp remains a separately configured provider; the adapter/foundation exists, but production certification depends on external Meta credentials, permissions, webhook configuration, and review state.
- Instagram analytics remains an optional read-only foundation; live metrics depend on a Professional account and current provider permissions.
- Google Calendar two-way sync and calendar selection remain future work because they require external-change detection, conflict resolution, and additional account UX.
- Credentialed end-user acceptance flows (email recovery, Google OAuth, Telegram/Calendar consent) require a real interactive test session and are not represented as completed solely from automated CI evidence.

## Product principles
1. Core data remains user-scoped.
2. Integrations are adapters; they must not leak provider credentials into the browser.
3. Nature is part of the visual environment, not a decorative background pasted behind a dashboard.
4. Interaction should communicate state through depth, light, motion, and clear copy without excessive effects.
5. The application must remain useful when optional providers are unavailable.
