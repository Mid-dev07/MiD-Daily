# MiD-Daily — Authentication

## M6–M7 scope

MiD-Daily now has a Supabase Auth boundary for the SPA and authenticated server-side ownership for core data.

### Supported flows

- Email/password sign in
- Email/password registration
- Google sign in through Supabase Auth
- Password reset email
- Password update after recovery
- Session restoration
- Automatic session/token refresh through the Supabase browser client
- Local sign out for the current browser session

Supabase documents `onAuthStateChange` for reacting to auth events and supports automatic session persistence/refresh in the browser client. Server-side identity is verified from the access token rather than trusting client-provided user IDs. citeturn757768search4turn757768search1

### Data ownership

Task, Finance, and Schedule database records carry a `user_id` foreign key to `auth.users(id)`.

Their database policies enforce:

```text
authenticated user
      ↓
auth.uid()
      ↓
resource.user_id
      ↓
RLS
```

The backend additionally filters every data query by the verified authenticated user ID.

### Local cache isolation

Task, Finance, and Schedule localStorage keys are namespaced by authenticated `user.id`.

When the first authenticated session is created on an existing demo browser, legacy unscoped data is migrated once into that user's scoped storage.

### Backend token handling

The browser sends the current Supabase access token as a Bearer token for protected API calls.

The backend verifies the token and uses the verified user ID for Task/Finance/Schedule ownership and Google Calendar connection ownership.

The Supabase secret/service-role key is never exposed to the frontend.

### Demo compatibility

When Supabase frontend variables are missing, MiD-Daily runs in local demo mode.

When Supabase Auth is configured, the authenticated application becomes the source of truth and localStorage is treated as a cache.

### Frontend environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:8787
```

Configure Email/password and Google provider settings in the Supabase Auth dashboard. Configure the application redirect URL to the exact frontend origin used in development/deployment.

### Security notes

Use the publishable key only in the browser. Keep `SUPABASE_SECRET_KEY` server-side.

Password recovery uses Supabase Auth. The application never stores raw passwords.

### Free leaked-password protection fallback

Supabase's built-in leaked-password protection is a Pro Plan feature. MiD-Daily therefore uses a free fallback that checks new and recovery passwords against Have I Been Pwned's Pwned Passwords range API using k-anonymity.

The browser computes the SHA-1 hash locally and sends only the first 5 hash characters to the MiD-Daily API. The backend forwards that prefix to HIBP with a documented application user-agent and returns the suffix list; the browser compares the remaining hash locally. The full password and complete hash are never sent to HIBP.

The registration and password-recovery flows fail closed when this security check is unavailable, and compromised passwords are rejected before Supabase Auth receives them. This does not remove Supabase's platform-level security advisor warning; it is an application-level mitigation until the project uses a plan that supports Supabase's native setting.

The current backend is intentionally lightweight and does not implement application-level rate limiting yet; deployment should place the API behind a provider/CDN rate limiter before exposing it publicly.

### Next step

Deployment should move secrets to the platform secret manager, force HTTPS, set `COOKIE_SECURE=true`, configure production redirect URLs, and verify Auth/Calendar flows against the deployed origin.
