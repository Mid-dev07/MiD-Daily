# MiD-Daily — Architecture Baseline

MiD-Daily starts as a modular monolith.

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
  |        |         |
Google  Telegram   WhatsApp (future)
```

## Schedule integration boundary
The Schedule domain owns the event and reminder intent. External adapters will be added later without putting provider-specific code inside Schedule UI components.

```text
Schedule Event
   |
   +--> Reminder intent
   |      |
   |      +--> Native notification adapter (future)
   |
   +--> Calendar sync intent
          |
          +--> Google Calendar adapter (future)
```

The initial UI exposes these concepts without requiring external credentials.
