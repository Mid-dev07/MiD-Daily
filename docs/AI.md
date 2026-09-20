# MiD-Daily — Assistant

## Scope
MiD-Daily Assistant is a backend-mediated OpenAI Responses API integration. The model never receives direct database access.

## Authentication and ownership
`POST /api/ai/chat` requires a valid Supabase Bearer token. The backend derives the user ID from the verified session and passes that ID into scoped tool functions.

## Tools
Read tools: `get_today_schedule`, `get_open_tasks`, `get_expense_summary`.
Write tools: `create_task`, `create_expense`. These are exposed only when the request explicitly enables `allowWrites`.

## Safety boundary
Tool arguments are validated again by the backend. Finance writes reject non-positive/non-finite amounts and apply a maximum amount. The assistant is instructed to use only approved tools and not invent user data.

## Conversation boundary
The frontend sends at most the latest 10 messages. The backend caps tool rounds to avoid unbounded tool loops. OpenAI response storage is disabled for this flow.

## Environment
```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
```

`OPENAI_API_KEY` must remain server-side.

## Current boundary
The Assistant is implemented and CI-tested, but it is not production-certified until a real OpenAI key is configured and live authenticated read/write smoke tests pass.