# MiD-Daily — Authentication

## M6 scope

MiD-Daily now has a Supabase Auth boundary for the SPA.

### Supported flows

- Email/password sign in
- Email/password registration
- Google sign in through Supabase Auth
- Password reset email
- Password update after recovery
- Session restoration
- Automatic session/token refresh through the Supabase browser client
- Local sign out for the current browser session

Supabase recommends listening to auth events with `onAuthStateChange`. The browser client also supports automatic session persistence and refresh. For server-side identity checks, the backend uses the authenticated access token to resolve the current user. 

### Demo compatibility

When `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing, MiD-Daily intentionally stays in demo mode. This keeps the existing local development workflow functional.

When both values are configured, the app is gated by authentication.

### Local data isolation

Task, Finance, and Schedule localStorage keys are namespaced by authenticated `user.id`.

Example:

```
mid-daily.tasks:<user-id>
mid-daily.finance:<user-id>
mid-daily.schedule:<user-id>
```

When the first authenticated session is created on an existing demo browser, legacy unscoped data is migrated once into that user's scoped storage and the legacy key is removed.

### Calendar ownership

Calendar API calls send the Supabase access token as a Bearer token. The backend verifies the token and uses the verified Supabase user ID as the Calendar connection owner.

The pre-auth anonymous owner-cookie fallback remains only for demo mode and legacy compatibility.

### Frontend environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:8787
```

Configure Email, password recovery, and Google provider settings in the Supabase Auth dashboard. Configure the frontend redirect URL to the MiD-Daily origin used during development/deployment.

### Security rules

Never put the Supabase secret/service-role key in frontend environment variables.

The frontend receives only the publishable key. The backend may use the server-side secret key to verify incoming user tokens and access protected server operations.

### Next step

The next persistence milestone is to add authenticated `user_id` ownership to Task and Finance database tables, then move Schedule/Task/Finance off localStorage while retaining local cache support.
