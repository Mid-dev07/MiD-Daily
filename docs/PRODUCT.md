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

## Connected modules
- Browser/device reminders
- Google Calendar
- Telegram
- Assistant

## Deferred providers
- WhatsApp is intentionally out of the current production scope.
- Instagram analytics remains an optional read-only foundation and is intentionally unconfigured until a provider account and current API permissions are available.

## Product principles
1. Core data remains user-scoped.
2. Integrations are adapters; they must not leak provider credentials into the browser.
3. Nature is part of the visual environment, not a decorative background pasted behind a dashboard.
4. Interaction should communicate state through depth, light, motion, and clear copy without excessive effects.
5. The application must remain useful when optional providers are unavailable.
