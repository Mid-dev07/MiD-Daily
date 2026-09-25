# MiD-Daily — Deployment

## Current production architecture
Browser → Cloudflare Workers (frontend) → Cloudflare Worker API (backend) → Supabase Auth/PostgreSQL.

Optional provider connections extend the backend to Google Calendar, Telegram, WhatsApp, Instagram analytics, and OpenAI.

## Custom domain

Production frontend: `https://mid-manager.xyz`

Production API: `https://api.mid-manager.xyz`

Cloudflare Worker Custom Domains provision DNS records and certificates after the zone is active. Add the apex domain to the frontend Worker and `api.mid-manager.xyz` to the backend Worker. citeturn400080search0turn400080search9

## Cloudflare

Frontend:
`https://mid-manager.xyz`

Backend:
`https://api.mid-manager.xyz`

The frontend is a Vite SPA deployed from `frontend/` using Cloudflare Workers Assets. The backend is a TypeScript Worker deployed from `backend/`.

Frontend build variables:
```env
VITE_API_BASE_URL=https://api.mid-manager.xyz
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Backend runtime values are configured in Wrangler plus Worker secrets. Keep all provider secrets server-side.

## Domain cutover

At Rumahweb, replace the domain nameservers with the two nameservers assigned by Cloudflare. Rumahweb notes that nameserver propagation can take roughly 1–24 hours. citeturn400080search7

After the zone is Active, deploy the custom-domain Worker configuration. Do not create manual CNAME records for these Worker hostnames; Cloudflare provisions the records for Custom Domains. citeturn400080search0

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

## Instagram

Production supports two analytics modes:
- **User-scoped Connect** uses Instagram Business Login OAuth. The browser receives only an authorization URL; token exchange and encrypted persistence remain server-side.
- **Deployment fallback** can use the legacy server-side access token/account variables while per-user OAuth is not configured.

OAuth configuration:
```env
INSTAGRAM_CLIENT_ID=<server-side app id>
INSTAGRAM_CLIENT_SECRET=<server-side app secret>
INSTAGRAM_REDIRECT_URI=https://api.mid-manager.xyz/auth/instagram/callback
INSTAGRAM_GRAPH_VERSION=<current supported Graph version>
```

Analytics uses the Business Login scopes `instagram_business_basic` and `instagram_business_manage_insights`. Long-lived tokens are refreshed by the Worker on a bounded six-hour maintenance window when they approach expiry.

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
