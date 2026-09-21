# MiD-Daily — Notification Layer

## M2.5 scope

The notification layer is separated from Schedule UI.

Schedule reminder intent is evaluated by the reminder engine, then passed to a notification adapter. The browser adapter can use the Notifications API and a service worker.

## Current behavior

- Permission is requested only from an explicit user action.
- A service worker is registered when a notification is first delivered and supported.
- The app-level reminder scheduler checks active reminders every 15 seconds when a background trigger is not already scheduled.
- Reminder delivery is deduplicated per browser session.
- After a delivery, the scheduler rechecks so recurring reminders do not leave the scheduler idle.
- Notifications include schedule metadata for future click handling.

## Current limitation

M2.5 is not a guaranteed background alarm system. The scheduler depends on the MiD-Daily application context being active. Persistent background delivery requires a later PWA push and/or native device layer.

## Future adapters

Browser / PWA, Android native, and iOS native implementations should consume the same Schedule reminder domain model.
