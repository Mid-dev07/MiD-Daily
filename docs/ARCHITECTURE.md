# MiD-Daily — Architecture Baseline

Initial direction: modular monolith.

```text
Frontend / PWA
      |
Authenticated Session
      |
Application API
      |
Business Modules
  |    |    |    |
Schedule Tasks Finance Dashboard
      |
PostgreSQL / Supabase
      |
External Integrations
  |       |        |
Google  Telegram  WhatsApp (future)
```

The current frontend is a local prototype. Persistence is isolated behind `lib/storage.ts` so it can later be replaced with an API-backed repository without moving UI responsibilities into components.
