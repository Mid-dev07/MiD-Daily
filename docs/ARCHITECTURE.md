# MiD-Daily — Architecture Baseline

Initial direction: modular monolith with a lightweight React frontend.

```text
Frontend / PWA
      |
Application Shell
      |
Feature Modules
  |       |       |       |
Dashboard Schedule Tasks Finance
      |
Application API (future)
      |
PostgreSQL / Supabase (future)
      |
External Integrations (future)
  |        |        |
Google  Telegram  WhatsApp
```

## Principles
- Keep deployment lightweight.
- Separate modules by responsibility.
- Avoid premature microservices.
- Keep authentication and authorization explicit.
- Keep local prototype concerns isolated so they can be replaced by API/database layers later.
- Enforce user data isolation at application and database levels when multi-user support is introduced.

## Frontend state
M1 uses local component state for navigation and a small storage adapter for task persistence. This is intentionally temporary; it is not the final data architecture.

## UI architecture
- `app/`: composition and root state
- `features/`: domain-oriented UI
- `components/layout/`: application shell pieces
- `components/ui/`: reusable primitives
- `lib/`: framework-agnostic helpers
- `styles/`: design tokens and global application styles

## Change management
- NOW: foundation, UI/UX consistency, core feature behavior
- NEXT: persistent Schedule / Tasks / Finance data layer
- LATER: authentication, integrations, multi-user hardening
- REJECT / REDESIGN: unnecessary infrastructure and premature complexity
