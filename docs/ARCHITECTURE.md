# MiD-Daily — Architecture Baseline

MiD-Daily starts as a modular monolith.

The Schedule domain owns event intent, recurrence, and reminder intent. Provider-specific delivery stays outside Schedule presentation components.

Current boundary:
Schedule event -> Reminder engine -> Notification adapter -> Browser notification / Service worker

Future:
Schedule event -> Calendar adapter -> Google Calendar

Notification adapters:
- Browser / PWA
- Android native
- iOS native

The initial application remains lightweight and dependency-free beyond React tooling.
