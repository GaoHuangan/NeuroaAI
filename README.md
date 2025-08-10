# NeuroaAI - AI Content Generation Platform

A full-stack AI-powered content generation platform built with React and Node.js.

## 🚀 Features
- Express.js backend with modular routing
- AI-powered content generation via Gemini (OpenAI-compatible API)
- User authentication and authorization with Clerk
- PostgreSQL database integration (Neon)
- Winston + Daily Rotate File logging (console + rotating files)
- Secure, auth-protected AI routes

## 🧩 Tech Stack
- Frontend: React, React Router, Clerk (client)
- Backend: Node.js, Express, Clerk (server), Winston
- AI: Google Gemini (OpenAI-compatible endpoint)
- DB: PostgreSQL (Neon), `postgres`/`neon` (via `sql` tagged template)

## 📁 Project Structure
```
NeuroaAI/
├── client/                     # React app
├── server/                     # Node.js server
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Auth and other middleware
│   ├── routes/                 # Express routers
│   ├── configs/
│   │   ├── db.js               # Database client (not shown here)
│   │   └── logger.js           # Winston logger
│   ├── logs/                   # Rotating log files (gitignored)
│   ├── server.js               # App entry
│   └── .env                    # Server env (gitignored)
├── README.md
└── package.json
```

## 🔑 Environment Variables (server/.env)
Required:
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- `GEMINI_API_KEY` — Google Generative Language API key

Optional:
- `NODE_ENV` — `development` | `production`
- `PORT` — default `3000`
- `LOG_LEVEL` — default `info` (dev elevates to `debug`)
- `MAX_FREE_USAGE` — default `10` (free plan requests limit)

Security notes:
- Do NOT store short-lived JWTs in `.env`.
- `.env` is server-only; keep it out of version control (already gitignored).

## ▶️ Run Locally
1) Install deps (from repo root or `server/` and `client/` respectively):
```
cd server && npm install
cd ../client && npm install
```
2) Start server (dev):
```
cd server
npm run dev
```
3) Start client:
```
cd ../client
npm run dev
```
Server default: http://localhost:3000  Client default: http://localhost:5173

## 🔐 Authentication
- Server uses Clerk middleware and protects `/api/ai/*` routes.
- Frontend should retrieve a token with `useAuth().getToken()` and send it as `Authorization: Bearer <token>`.

Minimal frontend example:
```jsx
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

function CallApi() {
  const { isSignedIn, getToken } = useAuth();
  const call = async () => {
    if (!isSignedIn) return alert('请先登录');
    const token = await getToken();
    const res = await fetch('http://localhost:3000/api/ai/generate-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: 'AI in healthcare', length: 300 })
    });
    console.log(await res.json());
  };
  return (
    <>
      <SignedIn><button onClick={call}>Call API</button></SignedIn>
      <SignedOut><SignInButton /></SignedOut>
    </>
  );
}
```

cURL testing with a JWT (Windows PowerShell):
```powershell
$TOKEN = "<YOUR_JWT>"
curl -i http://localhost:3000/api/ai/test -H "Authorization: Bearer $TOKEN"

curl -i -X POST http://localhost:3000/api/ai/generate-article `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"prompt":"AI in healthcare","length":300}'
```

Bash script (Git Bash/WSL) `test_ai.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
HOST="${HOST:-http://localhost:3000}"
TOKEN="<YOUR_JWT>"
[[ -z "$TOKEN" || "$TOKEN" == "<YOUR_JWT>" ]] && { echo "Set TOKEN"; exit 1; }

curl -i "$HOST/api/ai/test" -H "Authorization: Bearer $TOKEN"
```

## 📡 API Endpoints
Base: `/api/ai`
- `POST /generate-article`
  - body: `{ prompt: string, length: number }`
  - auth: required
  - returns: `{ success, data: { content, wordCount, usage } }`

- `POST /generate-blog-titles`
  - body: `{ prompt: string }`
  - auth: required
  - returns: `{ success, data: { content, usage } }`

- `POST /generate-image` (Premium only)
  - body: `{ prompt: string }`
  - auth: required (Premium)
  - returns: `{ success, data: { content, usage } }`

Notes:
- For free users, requests are limited by `MAX_FREE_USAGE`. Responses include usage info.

## 📝 Logging
- Using `winston` + `winston-daily-rotate-file`.
- Console logs in development; rotating files under `server/logs/`:
  - `app-YYYY-MM-DD.log` — general logs
  - `error-YYYY-MM-DD.log` — errors
  - `requests-YYYY-MM-DD.log` — request traces

## 🛡️ Security & Best Practices
- Never commit `.env` or JWTs to source control.
- Always send the Clerk token via `Authorization: Bearer <token>`.
- Remove or restrict any unauthenticated testing routes in production.

## ❗ Troubleshooting
- 401 Unauthorized with `x-clerk-auth-status: signed-out`:
  - Not logged in on client, or missing/invalid `Authorization` header.
- 403 on free plan routes:
  - Free usage limit reached; upgrade to premium or adjust `MAX_FREE_USAGE` for testing.
- AI 401/403:
  - Check `GEMINI_API_KEY` validity and quota.
- DB errors:
  - Verify `DATABASE_URL` and network connectivity.

## 📄 License
MIT