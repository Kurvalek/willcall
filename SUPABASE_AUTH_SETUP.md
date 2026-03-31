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
| `LASTFM_API_KEY` | Your Last.fm key | Last.fm features |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | Google Calendar |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret | Google Calendar |
| `GOOGLE_REDIRECT_URI` | `https://go.willcall.app/oauth/callback` | Google Calendar OAuth |
| `PUBLIC_BASE_URL` | **`https://go.willcall.app`** (no trailing slash) | Canonical URL for OAuth + post-login redirects |

Production lives at **`https://go.willcall.app`** (custom domain via Cloudflare). See **`WILLCALL_VERCEL.md`** for domain setup.

After adding env vars, **redeploy** the project (Vercel → Deployments → Redeploy).

## 2. Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

- `http://127.0.0.1:3000/app` (local dev)
- `http://localhost:3000/app` (local dev)
- `https://go.willcall.app/app` (production)
- `https://go.willcall.app/` (production)

## 3. Email (Magic Link / OTP)

- **Authentication** → **Providers** → **Email**: Enable "Confirm email" if you want users to verify.
- Magic links and OTP codes work by default; no extra config needed.

## 4. Site URL

In **Authentication** → **URL Configuration** → **Site URL**, set:
- Development: `http://127.0.0.1:3000`
- Production: `https://go.willcall.app`

When deploying to production, update the Site URL to your Vercel URL so magic link emails redirect to the right place.
