# Supabase Auth Setup for willcall

The app uses Supabase for authentication (magic link / OTP email).

## 1. Environment variables

### Local development

Ensure your `.env` has:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

Use the **anon** (public) key from Supabase Dashboard → Settings → API, not the service_role key.

### Vercel (production)

In your Vercel project dashboard → **Settings** → **Environment Variables**, add these at minimum:

| Variable | Value | Required for |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Auth / sign-in |
| `SUPABASE_KEY` | Your Supabase anon key | Auth / sign-in |
| `TICKETMASTER_API_KEY` | Your Ticketmaster key | Upcoming shows tab |
| `SETLISTFM_API_KEY` | Your Setlist.fm key | Concert search |
| `ANTHROPIC_API_KEY` | Your Anthropic key | Concert search |
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | Spotify features |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app secret | Spotify features |
| `SPOTIFY_REDIRECT_URI` | *(optional)* Full callback URL if not using `PUBLIC_BASE_URL` | Spotify OAuth |
| `PUBLIC_BASE_URL` | **`https://willcall.vercel.app`** (no trailing slash) | Canonical URL for Spotify OAuth + post-login redirects |

Production should live at **`https://willcall.vercel.app`** (Vercel uses **`.vercel.app`**, not `vercel.com`). See **`WILLCALL_VERCEL.md`** for domain + Spotify steps.

After adding env vars, **redeploy** the project (Vercel → Deployments → Redeploy).

## 2. Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

- `http://127.0.0.1:3000/app` (local dev)
- `http://localhost:3000/app` (local dev)
- `https://willcall.vercel.app/app` (production)
- `https://willcall.vercel.app/` (production)

## 3. Email (Magic Link / OTP)

- **Authentication** → **Providers** → **Email**: Enable "Confirm email" if you want users to verify.
- Magic links and OTP codes work by default; no extra config needed.

## 4. Site URL

In **Authentication** → **URL Configuration** → **Site URL**, set:
- Development: `http://127.0.0.1:3000`
- Production: `https://willcall.vercel.app`

When deploying to production, update the Site URL to your Vercel URL so magic link emails redirect to the right place.
