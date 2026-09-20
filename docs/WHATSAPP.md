# MiD-Daily — WhatsApp Integration

## M10 scope

WhatsApp uses a separate Cloud API adapter. It is intentionally not coupled to the Telegram command implementation.

### Current capabilities
- Authenticated MiD-Daily users can generate a one-time WhatsApp linking code.
- The UI generates a `wa.me` click-to-chat link containing `link <code>`.
- The webhook verifies Meta's HMAC signature before processing.
- Only incoming text messages are handled.
- A linked WhatsApp `wa_id` maps to one authenticated MiD-Daily user.
- Supported commands mirror the Telegram interface:
`/task <title>`, `/expense <amount> <category> <title>`, `/expenses`, `/schedule`, `/schedule tomorrow`, `/disconnect`, `/help`.

Meta's Cloud API sends messages through `/{Phone-Number-ID}/messages` using a Bearer access token; Meta's published API collection also documents WABA subscription for receiving webhook notifications. citeturn214943search0turn214943search1

### Webhook

Verification endpoint:
`GET /webhooks/whatsapp`

Incoming updates:
`POST /webhooks/whatsapp`

The verification token is checked against `hub.verify_token` and the returned challenge. Incoming POST bodies are checked against the `X-Hub-Signature-256` HMAC signature.

### Environment
```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_BUSINESS_PHONE_NUMBER=
```

The application intentionally requires `WHATSAPP_GRAPH_VERSION` instead of hard-coding a Graph API version, because Meta version selection is controlled by the deployed app.

### Meta setup
1. Create/configure a Meta app with WhatsApp Business Platform access.
2. Obtain the WhatsApp Business phone number ID.
3. Create a server-side access token with the WhatsApp messaging permission required by the deployment.
4. Configure the Meta webhook callback to `https://<backend-url>/webhooks/whatsapp`.
5. Use the same `WHATSAPP_VERIFY_TOKEN` in Meta's verification form.
6. Subscribe the app to the target WhatsApp Business Account (WABA) so phone-number webhook events are delivered.

Meta's current published collection shows the phone-number ID used for message sending and the WABA `subscribed_apps` step used to receive webhook events. citeturn214943search0turn214943search1

### Security
- App secret and access token stay backend-only.
- Link codes are stored hashed and expire after 10 minutes.
- Webhook signatures are compared with a timing-safe equality check.
- Connections are scoped by authenticated `user_id`.
- Webhook updates are deduplicated.

### Current boundary
WhatsApp is a foundation, not yet a production certification. Actual sending/receiving depends on the Meta app, WABA, phone number, permissions, webhook configuration, and platform review state.

### Next step
Once the Meta account is connected, add confirmation UX for financial writes and richer templates. Social analytics will remain a separate read-oriented module.