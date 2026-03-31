# Production URL: willcall on Vercel

The app is deployed on Vercel with a custom domain via Cloudflare: **`https://go.willcall.app`**.

## 1. Custom domain

The custom domain `go.willcall.app` is configured in Vercel under **Settings → Domains** with Cloudflare as the DNS/proxy layer.

Use **`https://go.willcall.app`** as the URL you share and bookmark.

## 2. Canonical base URL (OAuth + redirects)

In Vercel → **Settings → Environment Variables** (Production), add:

| Variable | Example value |
|----------|----------------|
| `PUBLIC_BASE_URL` | `https://go.willcall.app` |
| `GOOGLE_REDIRECT_URI` | `https://go.willcall.app/oauth/callback` |

(No trailing slash on `PUBLIC_BASE_URL`.)

After changing env vars, **Redeploy** (or push to `main`).

## 3. Google Cloud Console

Under your OAuth 2.0 Client ID:

- **Authorized JavaScript origins:** `https://go.willcall.app`
- **Authorized redirect URIs:** `https://go.willcall.app/oauth/callback`

## 4. Supabase Auth

**Authentication → URL Configuration**

- **Site URL:** `https://go.willcall.app`
- **Redirect URLs:** include
  `https://go.willcall.app/`
  `https://go.willcall.app/app`

See also `SUPABASE_AUTH_SETUP.md`.

## 5. Verify

- Open `https://go.willcall.app/api/health` — `publicBaseUrl` should show your canonical URL when `PUBLIC_BASE_URL` is set.
- Test Google Calendar connect from the app on **go.willcall.app**.
