# MiD-Daily — Assistant

## Scope
MiD-Daily Assistant is a backend-mediated Cloudflare Workers AI integration. The model never receives direct database access.

## Authentication and ownership
`POST /api/ai/chat` requires a valid Supabase Bearer token. The backend derives the user ID from the verified session and passes that ID into scoped tool functions.

## Tools
Read tools cover today's schedule, schedule ranges, active budgets, open tasks, and today's expense summary.
Write tools cover Tasks, Expenses, Activities, and Budgets. They are exposed only when the user explicitly enables actions, and provider-channel writes also require explicit write intent.

## Safety boundary
Tool arguments are validated again by the backend. Finance writes reject non-positive/non-finite amounts and apply backend limits. The assistant is instructed to use only approved tools and not invent user data or identifiers.

## Conversation boundary
The frontend sends at most the latest 10 messages. The backend caps tool rounds to avoid unbounded tool loops. AI requests are not stored by the application.

## Runtime
Production runs through the Cloudflare Workers AI binding named `AI`.

Current model:
`@cf/zai-org/glm-4.7-flash`

The deployment config must keep the Workers AI binding enabled in `backend/wrangler.jsonc`.

## Production validation
The backend test suite contains an HTTP-level E2E harness for the `/api/ai/chat` route. It verifies:
- read-only tool execution
- write tool exposure only when actions are enabled
- authenticated route handling
- tool-call round trips
- final response delivery back to the UI contract
