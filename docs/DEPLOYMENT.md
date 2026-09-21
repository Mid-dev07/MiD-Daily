# MiD-Daily — Deployment

## Current production architecture
Browser → Cloudflare Workers (frontend) → Cloudflare Worker API (backend) → Supabase Auth/PostgreSQL.

Optional provider connections extend the backend to Google Calendar, Telegram, WhatsApp, Instagram analytics, and OpenAI.

## Cloudflare

Frontend:
`https://mid-daily.e41262272.workers.dev`

Backend:
`https://mid-daily-api.e41262272.workers.dev`

The frontend is a Vite SPA deployed from `frontend/` using Cloudflare Workers Assets. The backend is a TypeScript Worker deployed from `backend/`.

Frontend build variables:
```env
VITE_API_BASE_URL=https://mid-daily-api.e41262272.workers.dev
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Backend runtime values are configured in Wrangler plus Worker secrets. Keep all provider secrets server-side.

## Supabase

Production project:
`ywpvwxhfzgxwmxrwcfsf`

Required production checks:
- Supabase project is healthy.
- RLS is enabled on core user-data tables.
- Task, Finance, and Schedule policies scope rows to `auth.uid()`.
- Integration tables remain service-only and are not exposed as a client data API.
- Run Supabase security/performance advisors after schema changes.

## Authentication

Supported client flows:
- Email/password sign-in
- Email/password registration
- Google OAuth
- Password reset
- Password recovery update

The frontend uses the Supabase publishable key only. Sensitive provider credentials never belong in Vite environment variables.

## Core data

Task, Finance, and Schedule APIs derive the owner from the authenticated Supabase access token. CRUD data is persisted in Supabase and rehydrated after refresh.

## Google Calendar

Flow:
sign in → connect Google → create Schedule item → sync → edit/update → delete.

Google access and refresh tokens are encrypted before persistence.

## Telegram

Linking is authenticated and uses one-time link codes. Webhooks verify Telegram's configured secret token and deduplicate update IDs.

## WhatsApp

Linking is authenticated and uses one-time link codes. Webhooks verify Meta HMAC signatures and deduplicate incoming update hashes.

## Assistant

The assistant is backend-mediated. Read tools are always available when configured; write tools are exposed only when the user explicitly enables actions in the UI.

## Notifications

Browser notifications use the service worker at `/sw.js`. Notification delivery requires a browser/device grant and the app to be running for the current reminder scheduler implementation.

## CI/CD

GitHub Actions verifies:
- frontend TypeScript + Vite build
- backend TypeScript build + tests
- worker dry-run
- production frontend deployment + smoke test
- production backend deployment + health/secrets checks

## Production hardening

Before exposing the app broadly:
- enable Supabase leaked-password protection;
- review provider-specific rate limits and quotas;
- verify backup/restore expectations;
- keep domain-specific CORS;
- review logs for provider failures without logging secrets;
- re-test cold-start and token-refresh boundaries.
