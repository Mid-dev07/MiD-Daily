# MiD-Daily — Instagram Analytics

## Scope
MiD-Daily exposes read-only analytics for an Instagram Professional account. Social metrics are isolated from the core Task, Finance, and Schedule write paths.

## Runtime
The backend uses the Instagram API with server-side credentials. The configured host defaults to `https://graph.instagram.com`, and the deployed API version is supplied by `INSTAGRAM_GRAPH_VERSION`.

Current account profile fields:
- id
- username
- name
- followers_count
- media_count

Current daily account insight fields:
- views
- reach
- accounts_engaged
- total_interactions

Meta documents Instagram Professional accounts, Instagram Login, `graph.instagram.com`, and the `instagram_business_basic` / `instagram_business_manage_insights` permissions for the current Instagram Login path. citeturn428431search0turn901055search2

## API
Authenticated frontend endpoint:
`GET /api/integrations/instagram/insights`

The endpoint returns normalized account data for the Social Analytics view. Provider access tokens remain backend-only.

## Environment
```env
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_GRAPH_VERSION=
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_GRAPH_HOST=https://graph.instagram.com
```

## Current production boundary
The analytics UI is operational and no longer hard-coded to placeholder metrics. Live values require the provider credentials and a Professional Instagram account with the required permissions. Consumer/personal Instagram accounts are not supported for these analytics APIs. citeturn901055search0turn428431search1

## Setup
Create/configure a Meta app, use an Instagram Professional account, grant the required permissions, and store the server-side access token, API version, and account ID in the backend deployment. The UI remains actionable when setup is incomplete rather than presenting a dead disabled control.
