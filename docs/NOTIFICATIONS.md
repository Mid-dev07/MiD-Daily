# MiD-Daily — Notifications

## Delivery model

MiD-Daily uses two notification paths:

1. **Browser/device reminders**
   - Permission is requested from the browser.
   - Reminder scheduling runs while the MiD-Daily application is open.
   - The service worker handles notification clicks and can reopen/focus the application.

2. **Background channel delivery**
   - When a user has linked Telegram and/or WhatsApp, scheduled reminders can be delivered without the MiD-Daily tab being open.
   - Cloudflare Workers Cron runs the background dispatcher every minute.
   - The dispatcher uses APP_TIMEZONE (production: Asia/Jakarta) for schedule time calculations.
   - Dispatch claims are stored in public.reminder_dispatches so retries and concurrent executions do not intentionally duplicate a successful delivery.
   - Failed provider deliveries release their claim so a later retry can deliver the reminder.

## Recurrence

Supported schedule recurrence:
- none
- daily
- weekly
- monthly

Reminder offsets:
- at start
- 5, 10, 15, 30, or 60 minutes before

Recurring dates are resolved from the schedule recurrence rule rather than materialized into separate rows.

## Operational boundary

Browser notifications are not a guaranteed background scheduler. For reliable background delivery, a linked Telegram or WhatsApp channel is required.

The dispatcher is intentionally lightweight for the initial personal/small-scale deployment. It checks the current and immediately previous local calendar date to handle reminder offsets that cross midnight.
