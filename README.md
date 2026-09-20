# MiD-Daily

Lightweight daily management web app.

## Current phase
M2.6 — Schedule / Google Calendar foundation

## Stack
- React
- TypeScript
- Vite

## Structure
The frontend uses a responsibility-first structure. Feature-specific code stays inside its feature folder; shared layout, UI primitives, utilities, and integrations remain separate.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Current focus
The Schedule module has date navigation, filtering, CRUD, recurrence, reminders, local persistence, browser notifications, and a Google Calendar handoff. The next Calendar step is secure OAuth authorization plus API-backed one-way sync, followed later by two-way synchronization.
