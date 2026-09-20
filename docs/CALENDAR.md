# MiD-Daily — Google Calendar Integration

## M2.6 scope

M2.6 establishes the Calendar integration boundary and a safe first connection flow from MiD-Daily to Google Calendar.

### Current capabilities

- Schedule items now carry Google Calendar sync metadata.
- Legacy `googleCalendarConnected` data is migrated without claiming that an API sync actually occurred.
- A Schedule item can be opened in Google Calendar through a prefilled event template.
- The event mapping includes title, notes, location, local timezone, and a private MiD-Daily schedule ID for the future API adapter.
- The integration reads `VITE_GOOGLE_CLIENT_ID` only as configuration metadata; no client secret is stored in the frontend.

### Security decision

The API-backed connection should use OAuth authorization code flow with PKCE rather than the legacy implicit flow. Google currently recommends the authorization-code approach for browser applications, and server-side web apps can securely exchange the code for access and refresh tokens. The requested Calendar scope should stay narrow; `https://www.googleapis.com/auth/calendar.events` is intended for viewing and editing events on calendars the user can access.

### Current OAuth implementation

The backend now provides OAuth start, callback, connection status, and disconnect endpoints. Authorization uses PKCE, state is bound to an HttpOnly browser cookie, and access/refresh tokens remain server-side. The current connection store is in memory for local single-instance development only.

### Next step

M2.6.2 should introduce the application backend OAuth callback and token exchange, then M2.6.3 can implement:

1. create event
2. update event
3. delete event
4. persist the external Google event ID and sync status
5. retry and error handling

Two-way synchronization should remain later because it adds conflict resolution, external-change detection, and ownership rules.
