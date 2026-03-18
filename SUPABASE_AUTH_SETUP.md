# Supabase Auth Setup for FANATIK

The app uses Supabase for authentication (magic link email + Google OAuth).

## 1. Environment variables

Ensure your `.env` has:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

Use the **anon** (public) key from Supabase Dashboard → Settings → API, not the service_role key.

## 2. Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

- `http://127.0.0.1:3000/app`
- `http://localhost:3000/app`

For production, add your production URL (e.g. `https://yourdomain.com/app`).

## 3. Email (Magic Link)

- **Authentication** → **Providers** → **Email**: Enable "Confirm email" if you want users to verify.
- Magic links work by default; no extra config needed.

## 4. Google OAuth

1. **Authentication** → **Providers** → **Google**: Enable.
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: Web application
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret into Supabase Google provider settings.

## 5. Site URL

In **Authentication** → **URL Configuration** → **Site URL**, set:
- Development: `http://127.0.0.1:3000`
- Or your production URL
