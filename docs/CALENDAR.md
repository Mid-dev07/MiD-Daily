# MiD-Daily — Google Calendar Integration

## M2.6 scope

M2.6 establishes the Calendar integration boundary and a safe connection + one-way synchronization path from MiD-Daily to Google Calendar.

### Current capabilities

- Schedule items carry Google Calendar sync metadata.
- Legacy `googleCalendarConnected` data is migrated without claiming that an API sync actually occurred.
- A Schedule item can be opened in Google Calendar through a prefilled event template.
- The event mapping includes title, notes, location, local timezone, and a private MiD-Daily schedule ID.
- The backend provides OAuth start, callback, connection status, and disconnect endpoints.
- OAuth uses authorization code + PKCE.
- OAuth state is bound to an HttpOnly browser cookie.
- Google access and refresh tokens are persisted in Supabase after AES-256-GCM encryption.
- Create, update, and delete event operations are exposed through the backend.
- Access tokens are refreshed automatically when close to expiry, with one retry after HTTP 401.
- Schedule metadata stores the Google event ID, sync status, last-sync time, and any sync error.
- A remote event that no longer exists is recreated on update; a remote 404 on delete is treated as already deleted.

### Storage model

`supabase/migrations/20260920000000_create_google_calendar_connections.sql` creates the protected connection table.

The table has:
- `owner_id`: legacy browser-owner key retained for compatibility
- `encrypted_token`: encrypted OAuth token payload
- `connected_at`
- `updated_at`

RLS is enabled, access for `anon` and `authenticated` is revoked, and backend administrative access is isolated to the server-side Supabase secret. Supabase documents RLS as the database authorization layer and warns that secret/service-role keys must never be exposed to browsers. 

### Important ownership limitation

The current backend now supports authenticated user ownership through `user_id`. The legacy `owner_id` column remains for backward compatibility with earlier records, while new calendar connections are bound to the authenticated Supabase user.

Calendar, Schedule, Task, and Finance resources should continue to use the authenticated Supabase `user_id` ownership chain. Do not reintroduce browser-session ownership for new records.

### Required environment

Backend:

```env
PORT=8787
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback
SUPABASE_URL=
SUPABASE_SECRET_KEY=
TOKEN_ENCRYPTION_KEY_B64=
```

Generate the 32-byte encryption key with:

```bash
openssl rand -base64 32
```

Never commit the resulting key.

### Local setup

1. Create a Supabase project.
2. Apply the migration under `supabase/migrations/`.
3. Ensure Supabase Auth is configured for the deployment and leaked-password protection is enabled in the Auth settings.
4. Copy `backend/.env.example` to `backend/.env`.
5. Fill the Google OAuth credentials and Supabase values.
6. Generate `TOKEN_ENCRYPTION_KEY_B64`.
7. Add `http://localhost:8787/auth/google/callback` as the Google OAuth redirect URI.
8. Run the backend with `npm install` and `npm run dev`.
9. Run the frontend with `npm install` and `npm run dev.

### Production setup (Cloudflare Workers)

Use a dedicated **Web application** OAuth client for Calendar in the same Google Cloud project or a dedicated project. Enable the Google Calendar API, configure Google Auth Platform branding/audience, and add the account(s) used for testing under **Audience → Test users** when the app is External. Google requires verification for many public apps using sensitive Calendar scopes; keep the app in testing while validating the integration.

Production OAuth redirect URI:

https://api.mid-manager.xyz/auth/google/callback

Cloudflare Worker configuration:

- `GOOGLE_CLIENT_ID` — OAuth client ID
- `GOOGLE_CLIENT_SECRET` — OAuth client secret (keep as a Worker secret)
- `GOOGLE_REDIRECT_URI` — already wired as a non-secret Worker variable in `backend/wrangler.jsonc`
- `TOKEN_ENCRYPTION_KEY_B64` — existing 32-byte encryption key used to encrypt stored Google tokens

MiD-Daily currently requests `https://www.googleapis.com/auth/calendar.events`, which allows viewing and editing events across the user's calendars. This is the current scope required by the create/update/delete feature, but it is a user-data scope and can require Google verification for a public app.

The storage design is persistent across process restarts because token records live in Supabase. Calendar connections are user-scoped through authenticated `user_id`; the connection table is RLS-enabled and client roles have no SELECT privilege.

### Deployment note

The storage design is persistent across process restarts because token records live in Supabase. Calendar connections are now user-scoped through authenticated `user_id`; service-role access remains backend-only.

### Domain cutover

After `mid-manager.xyz` is Active in Cloudflare, register `https://api.mid-manager.xyz/auth/google/callback` as the exact Authorized redirect URI in the Google OAuth Web application client. Keep the `workers.dev` URI only while it is intentionally used by an older deployment.

### Next step

M2.6.5 should add authenticated user ownership and calendar selection, then Schedule sync can become fully user-scoped. Two-way synchronization remains later because it requires external-change detection and conflict resolution.
