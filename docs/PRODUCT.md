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

## Connected modules
- Browser/device reminders
- Google Calendar
- Telegram
- WhatsApp
- Assistant

## Optional foundation
- Instagram analytics is implemented as a provider adapter and UI foundation. It remains intentionally disabled until a provider account and current API permissions are configured.

## Product principles
1. Core data remains user-scoped.
2. Integrations are adapters; they must not leak provider credentials into the browser.
3. Nature is part of the visual environment, not a decorative background pasted behind a dashboard.
4. Interaction should communicate state through depth, light, motion, and clear copy without excessive effects.
5. The application must remain useful when optional providers are unavailable.
