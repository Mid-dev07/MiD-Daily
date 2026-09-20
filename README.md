# MiD-Daily

Lightweight daily management web app.

## Current phase
M2.3 — Schedule / Agenda

## Stack
- React
- TypeScript
- Vite

## Structure
The frontend uses a responsibility-first structure. Feature-specific code stays inside its feature folder; shared layout, UI primitives, utilities, and types remain separate.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Current focus
The Schedule module has date navigation, filtering, CRUD, recurrence, reminder data, and local persistence. Native device notifications and Google Calendar remain provider adapters for a later phase.
