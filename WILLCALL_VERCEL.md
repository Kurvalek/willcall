# Production URL: willcall on Vercel

Vercel’s default host is **`https://<project-slug>.vercel.app`** (not `vercel.com`).

## 1. Point traffic at `willcall.vercel.app`

Either:

- **Rename the Vercel project** to `willcall` (Dashboard → Project → Settings → General → Project Name), **or**
- Add **`willcall.vercel.app`** under **Settings → Domains** if that hostname is available for your team.

Use **`https://willcall.vercel.app`** as the URL you share and bookmark.

## 2. Canonical base URL (Spotify + redirects)

In Vercel → **Settings → Environment Variables** (Production), add:

| Variable | Example value |
|----------|----------------|
| `PUBLIC_BASE_URL` | `https://willcall.vercel.app` |

(No trailing slash.)

This makes Spotify OAuth use **`https://willcall.vercel.app/oauth/spotify/callback`** even if someone opens an older `*.vercel.app` deployment URL, so it matches what you register in Spotify.

**Optional override:** set `SPOTIFY_REDIRECT_URI` to the full callback URL instead (same as `PUBLIC_BASE_URL` + `/oauth/spotify/callback`).

After changing env vars, **Redeploy** (or push to `main`).

## 3. Spotify Developer Dashboard

Under your app → **Redirect URIs**, include **exactly**:

```
https://willcall.vercel.app/oauth/spotify/callback
```

Remove old URLs you no longer use (e.g. `concert-search-poc.vercel.app`) if you want to avoid confusion.

## 4. Supabase Auth

**Authentication → URL Configuration**

- **Site URL:** `https://willcall.vercel.app`
- **Redirect URLs:** include  
  `https://willcall.vercel.app/`  
  `https://willcall.vercel.app/app`

See also `SUPABASE_AUTH_SETUP.md`.

## 5. Verify

- Open `https://willcall.vercel.app/api/health` — `publicBaseUrl` should show your canonical URL when `PUBLIC_BASE_URL` is set.
- Connect Spotify from the app on **willcall.vercel.app**.
