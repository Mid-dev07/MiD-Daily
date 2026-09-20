# MiD-Daily

Lightweight daily management web app.

## Current phase
M2.6 — Schedule / Google Calendar foundation

## Stack
- React
- TypeScript
- Vite

## Structure
The frontend uses a responsibility-first structure. Feature-specific code stays inside its feature folder; shared layout, UI primitives, utilities, and integrations remain separate. The backend is a lightweight TypeScript service for secure integrations.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Run backend locally

```bash
cd backend
npm install
npm run dev
```

Copy `backend/.env.example` to `backend/.env` and configure the Google OAuth credentials before connecting Calendar.

## Current focus
The Schedule module has date navigation, filtering, CRUD, recurrence, reminders, local persistence, browser notifications, Google Calendar OAuth, and API-backed one-way event sync. Task Management now has search, status/priority filters, CRUD, deadlines, notes, and progress tracking. The next step is authenticated user ownership and calendar selection, followed later by two-way synchronization.
