# MiD-Daily — Instagram Analytics

## Scope
The current Instagram module is a read-oriented analytics foundation. It is separate from the core Task, Finance, and Schedule write paths.

## Current adapter
The backend adapter reads account insights using the configured Instagram account ID and Graph API version. The current foundation requests daily `follower_count`, `reach`, and `profile_views` metrics.

## Environment
```env
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_GRAPH_VERSION=
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_GRAPH_HOST=https://graph.instagram.com
```

Credentials remain backend-only.

## Current boundary
The repository contains the analytics adapter and UI foundation, but no production account OAuth connection flow or live certification. A deployed account must satisfy the provider's current Professional-account/API requirements and permissions.

## Next step
Implement provider-specific OAuth connection persistence, refresh/revocation handling, account ownership mapping, and a small read-only insights cache before expanding analytics coverage.