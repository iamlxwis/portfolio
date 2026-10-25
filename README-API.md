# LXWIS API

A free developer API built into the lxwis.site portfolio repository.

## Stack

- Node.js 20+
- Express
- Vercel serverless deployment
- Plain HTML, CSS, and JavaScript for the docs

## Local development

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000/api` for the docs, or `http://localhost:3000/api/health` to check the API.

## Current API routes

### Utilities
- `GET /api/health`
- `GET /api/v1`
- `GET /api/v1/utils/uuid`
- `GET /api/v1/utils/random?min=1&max=100`
- `GET /api/v1/utils/password?length=16`
- `GET /api/v1/utils/timestamp`
- `GET /api/v1/utils/qr?text=hello`

### Text
- `POST /api/v1/text/count` with JSON `{"text":"hello world"}`
- `POST /api/v1/text/case` with JSON `{"text":"hello world","mode":"upper"}`
- `POST /api/v1/text/slug` with JSON `{"text":"Hello World"}`
- `POST /api/v1/text/reverse` with JSON `{"text":"hello"}`
- `POST /api/v1/text/encode` with JSON `{"text":"hello world","mode":"url-encode"}`
- `POST /api/v1/text/lorem` with JSON `{"count":2}`

### Developer
- `POST /api/v1/dev/json/format` with JSON `{"json":"{\"hello\":\"world\"}"}`
- `POST /api/v1/dev/json/validate` with JSON `{"json":"{\"hello\":\"world\"}"}`
- `POST /api/v1/dev/hash` with JSON `{"text":"hello","algorithm":"sha256"}`

### Fun
- `GET /api/v1/fun/joke`
- `GET /api/v1/fun/fact`
- `GET /api/v1/fun/quote`

Image and AI endpoints currently return `501 FEATURE_NOT_READY` until their required processing pipeline or provider is configured.

## Response format

Success:
```json
{"success":true,"data":{"example":"value"}}
```

Error:
```json
{"success":false,"error":{"code":"INVALID_INPUT","message":"Explain the problem."}}
```

## Security notes

- All routes are public and rate-limited. The initial limit is 60 requests per minute per IP.
- Request body size is limited.
- Do not add secrets to frontend code or commit real provider keys.
- AI features should remain disabled until a provider, budget, and usage caps are configured.
- Review Vercel's current runtime and plan limits before launching.
