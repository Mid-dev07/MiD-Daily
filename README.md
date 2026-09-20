# MiD-Daily

Lightweight daily management web app.

## Current phase
M7 — Authenticated multi-user data foundation

## Stack
- React
- TypeScript
- Vite
- Node.js backend
- Supabase Auth + PostgreSQL

## Core modules
- Schedule / Agenda
- Tasks
- Finance
- Dashboard

## Integrations
- Browser notifications
- Google Calendar OAuth + one-way event sync
- Supabase Auth
- Supabase PostgreSQL persistence

## Run locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Copy `frontend/.env.example` and `backend/.env.example` into local `.env` files and configure the services you enable.

Apply Supabase SQL migrations in `supabase/migrations/` before using authenticated cloud persistence.

## Current behavior

With Supabase Auth configured, MiD-Daily gates the application behind authentication and scopes Task, Finance, and Schedule data by the authenticated user. LocalStorage remains as a cache and demo compatibility layer.

Without Supabase Auth configuration, the application runs in demo mode using local persistence.

Google Calendar uses a separate OAuth connection stored server-side and never exposes Google client secrets to the browser.

## CI

GitHub Actions builds both frontend and backend on pushes and pull requests targeting `main`.

## Roadmap

Core management → authenticated persistence → deployment → Telegram → WhatsApp → social analytics → AI assistance.
