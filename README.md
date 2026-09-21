# MiD-Daily

Lightweight daily management workspace built around schedule, tasks, finance, and connected assistants.

## Product
MiD-Daily is designed as a calm, nature-led daily workspace.

Core:
- Dashboard
- Schedule / Agenda
- Tasks
- Finance
- Authentication

Connected:
- Browser/device reminders
- Google Calendar
- Telegram
- WhatsApp
- Assistant
- Instagram analytics foundation

The optional provider modules are designed to fail gracefully when credentials or provider permissions are not configured.

## Visual direction
Nature Cinematic + Natural Luxury:
- cinematic forest atmosphere
- moss, sage, stone, fog, and warm sunlight
- restrained dew-glass surfaces
- responsive feature landscape
- desktop sidebar and mobile bottom navigation
- reduced-motion support
- keyboard-friendly modal interactions

## Architecture
Browser → Cloudflare Workers frontend → Cloudflare Worker API → Supabase Auth/PostgreSQL

Optional providers are connected through the backend so provider secrets remain server-side.

Production:
- Frontend: https://mid-daily.e41262272.workers.dev
- Backend health: https://mid-daily-api.e41262272.workers.dev/health

## Local development

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm run dev
```

Copy the relevant `.env.example` files into local `.env` files and configure only the services you need.

## Data behavior
With Supabase Auth configured:
- Task, Finance, and Schedule data is owned by the authenticated user.
- Core CRUD is persisted in Supabase.
- LocalStorage is used as a local cache/demo compatibility layer.

Without Supabase Auth configuration:
- The frontend can run in demo mode with local persistence.

## Integrations

### Google Calendar
OAuth uses PKCE and server-side token encryption. Schedule items can be created, updated, and deleted in Google Calendar.

### Telegram
Account linking uses one-time codes. Webhooks verify a configured secret and deduplicate updates.

### WhatsApp
Account linking uses one-time codes. Webhooks verify Meta HMAC signatures and deduplicate updates.

### Assistant
The Assistant is backend-mediated. Read tools are available by default. Task/expense writes are only exposed after the user explicitly enables actions.

### Instagram
The analytics adapter and UI foundation are present, but live metrics remain disabled until an Instagram Professional connection and required provider permissions are configured.

## Quality gates
GitHub Actions verifies:
- frontend TypeScript + Vite build
- backend TypeScript build + tests
- Cloudflare Worker dry-run
- frontend deployment and smoke test
- backend deployment, secret presence, and health check

See:
- `docs/PRODUCT.md`
- `docs/UI_UX_UNREAL.md`
- `docs/DEPLOYMENT.md`
- `docs/RELEASE_CHECKLIST.md`
