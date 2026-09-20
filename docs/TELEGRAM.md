# MiD-Daily — Telegram Integration

## M9 scope

Telegram is an external interface to the same authenticated MiD-Daily data domains.

### Account linking
1. Sign in to MiD-Daily.
2. Open the Telegram integration card.
3. Generate a one-time link.
4. Open the Telegram deep link.
5. Telegram sends `/start <token>` to the bot.
6. The backend verifies the token, links the private chat to the authenticated user, and expires the token.

Telegram documents bot deep links using a `start` parameter that can be used to connect a Telegram account to another platform. citeturn650976search0turn650976search2

### Commands
```text
/help
/task <title>
/expense <amount> <category> <title>
/expenses
/schedule
/schedule tomorrow
/disconnect
```

Examples:
```text
/task Review database schema
/expense 25000 Food Lunch
/expenses
/schedule tomorrow
```

The initial parser is intentionally explicit rather than natural-language to reduce accidental writes to Finance and Schedule.

### Security
The webhook endpoint is `POST /webhooks/telegram`.

Telegram's `setWebhook` supports `secret_token`, delivered through `X-Telegram-Bot-Api-Secret-Token`; MiD-Daily verifies this header before processing updates. citeturn650976search1

Only private Telegram chats are accepted. A chat maps to one authenticated MiD-Daily user. All Task/Finance/Schedule mutations reuse the existing user-owned backend stores.

Webhook updates are deduplicated with `telegram_updates.update_id` so webhook retries do not create duplicate task/expense writes.

### Bot setup
Backend environment:
```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=https://<backend-url>/webhooks/telegram
APP_TIMEZONE=Asia/Jakarta
```

Telegram webhook secret characters are limited to `A-Z`, `a-z`, `0-9`, `_`, `-`. Generate a compatible local secret with:
```bash
openssl rand -hex 32
```

After deployment:
```bash
cd backend
npm install
npm run telegram:set-webhook
```

The setup script calls Telegram `setWebhook` with `allowed_updates: ["message"]`.
Telegram's current Bot API documentation includes `setWebhook` with the secret-token header and `sendMessage`. Bot API 10.3 was released August 24, 2026. citeturn650976search1

### Free deployment note
Render Free web services can spin down after inactivity, which can add a cold-start delay to webhook handling. Use an always-on backend plan when Telegram reliability becomes important. citeturn212543search0turn212543search10

### Next step
Later Telegram improvements can add inline keyboards, confirmation steps for sensitive finance writes, richer schedule commands, and notification delivery. WhatsApp remains a separate adapter.