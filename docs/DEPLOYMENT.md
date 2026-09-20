# MiD-Daily — Deployment

## Target architecture
Browser → Render Static Site (frontend) → Render Web Service (backend) → Supabase Auth/PostgreSQL → Google Calendar API.

## Render
`render.yaml` defines a static Vite frontend and a Node backend. The frontend uses rootDir `frontend`; the API uses rootDir `backend`.
Render requires web services to listen on `0.0.0.0` and use the provided `PORT` environment variable. citeturn697876search0turn697876search4turn212543search5

Set frontend variables:
```env
VITE_API_BASE_URL=https://<backend-url>
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Set backend variables:
```env
FRONTEND_URL=https://<frontend-url>
COOKIE_SECURE=true
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=https://<backend-url>/auth/google/callback
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<secret-key>
TOKEN_ENCRYPTION_KEY_B64=<generated-secret>
```

Static-site environment variables are build-time values, so frontend env changes require a rebuild. Render supports `sync: false` for secrets and `generateValue` for generated values. citeturn929801search9turn929801search0

## Supabase
Apply every migration in `supabase/migrations/` in timestamp order. Keep the secret key backend-only. Supabase documents that secret/service-role keys bypass RLS and must never be exposed in browser code. citeturn212543search1turn212543search2turn212543search3

Configure Supabase Auth for email/password, password recovery, and Google OAuth. Add the deployed frontend URL to the allowed redirect/site URLs.

## Google Calendar
Authorized redirect URI:
`https://<backend-url>/auth/google/callback`

After deploy: sign in → connect Google Calendar → create Schedule item → Sync to Google → verify the event → edit → Update Google → delete → verify remote deletion.

## External integrations

For Telegram:
```env
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_BOT_USERNAME=<bot-username>
TELEGRAM_WEBHOOK_SECRET=<secret>
TELEGRAM_WEBHOOK_URL=https://<backend-url>/webhooks/telegram
APP_TIMEZONE=Asia/Jakarta
```

For WhatsApp Cloud API:
```env
WHATSAPP_ACCESS_TOKEN=<access-token>
WHATSAPP_PHONE_NUMBER_ID=<phone-number-id>
WHATSAPP_GRAPH_VERSION=<graph-version>
WHATSAPP_APP_SECRET=<app-secret>
WHATSAPP_VERIFY_TOKEN=<verify-token>
WHATSAPP_BUSINESS_PHONE_NUMBER=<business-number>
```

For Instagram analytics foundation:
```env
INSTAGRAM_ACCESS_TOKEN=<access-token>
INSTAGRAM_GRAPH_VERSION=<graph-version>
INSTAGRAM_ACCOUNT_ID=<professional-account-id>
INSTAGRAM_GRAPH_HOST=https://graph.instagram.com
```

For MiD-Daily Assistant:
```env
OPENAI_API_KEY=<server-side-api-key>
OPENAI_MODEL=gpt-5.6
```

These credentials remain backend-only except the Supabase publishable key and Vite public variables described above. Configure each provider only after the deployed backend URL is known.

## Health
`GET /health` should return HTTP 200 and identify `mid-daily-backend`.

## Free-tier limitation
Render documents that Free web services spin down after 15 minutes of inactivity and are intended for hobby/testing rather than production. citeturn212543search0turn212543search6

## CI
GitHub Actions builds frontend and backend on pushes and pull requests to `main`.

## Production hardening
Before public production: domain-specific CORS, API rate limiting, structured audit logging, backup/restore verification, HTTPS-only cookies, and an always-on backend plan where required.