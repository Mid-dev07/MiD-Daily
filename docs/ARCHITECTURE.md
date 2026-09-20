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

## Principles
- Keep deployment lightweight.
- Separate modules by responsibility.
- Avoid premature microservices.
- Make authentication and authorization explicit.
- Enforce user data isolation at application and database levels when multi-user support is introduced.

## Change management
- NOW: foundation and core stability
- NEXT: core productivity modules
- LATER: integrations and advanced features
- REJECT / REDESIGN: unnecessary complexity
