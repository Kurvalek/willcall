# Spotify concert discovery – setup guide

This feature uses your **Spotify listening history** (top artists + recently played) and **cities / date ranges** you enter to suggest **concerts you may have attended** via Setlist.fm.

## 1. Create a Spotify app

1. Go to **[Spotify for Developers](https://developer.spotify.com/)** and log in with your Spotify account.
2. Open the **[Dashboard](https://developer.spotify.com/dashboard)**.
3. Click **Create app**.
4. Fill in:
   - **App name:** e.g. `Concert Search POC`
   - **App description:** optional (e.g. “Find concerts based on my listening”)
   - **Redirect URI:** `http://127.0.0.1:3000/oauth/spotify/callback`
   - Check the box to agree to the terms.
5. Click **Save**.
6. On the app’s page, click **Settings**.
7. Under **Redirect URIs**, confirm `http://127.0.0.1:3000/oauth/spotify/callback` is listed (add it if not). Spotify now requires `127.0.0.1` instead of `localhost` for local apps.
8. Copy the **Client ID** and **Client Secret** (click “View client secret” if needed).

## 2. Add env vars

In your project root, edit `.env` and add:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

Optional (defaults to localhost):

```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/oauth/spotify/callback
```

Use the exact Client ID and Client Secret from the Spotify dashboard.

## 3. Run the app

```bash
cd /Users/kathleenstone/Desktop/concert-search-poc
npm install
node server.js
```

You should see in the console:

- `Spotify Client ID loaded: YES`
- `Spotify concerts: http://localhost:3000/spotify-concerts`

## 4. Use the test page

1. Open **http://127.0.0.1:3000/spotify-concerts** in your browser (use `127.0.0.1`, not `localhost`, so the session cookie works after Spotify redirects back).
2. Click **Connect Spotify** and authorize the app (top artists + recently played).
3. After redirect back, enter:
   - **Cities:** comma-separated, e.g. `New York, Brooklyn, Miami, Los Angeles`.
   - **Year range (optional):** e.g. start `2015`, end `2024`. Leave blank to search all years.
4. Click **Find concerts I may have attended**.
5. Results are Setlist.fm shows for your top/recent artists in those cities (and years). Each card shows “Based on your listening to [Artist]”.

## 5. How it works

- **OAuth:** Authorization Code flow; we only request `user-top-read` and `user-read-recently-played`. No playback control.
- **Data used:** Top artists (medium-term) and artists from recently played tracks. No raw listening history is stored.
- **Concerts:** For each of those artists and each city (and each year in the range), the server calls the Setlist.fm search API and merges results. Results are deduplicated and sorted by date.

## Troubleshooting

- **“Spotify not configured”**  
  Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are in `.env` and the server was restarted.

- **Redirect URI mismatch**  
  In the Spotify Dashboard → your app → Settings, set **Redirect URI** to exactly:  
  `http://127.0.0.1:3000/oauth/spotify/callback`  
  (use `127.0.0.1`, not `localhost`; no trailing slash; port 3000). Save and try again.

- **“Login failed” or “state_mismatch” after clicking Connect Spotify**  
  1. Open the app at **http://127.0.0.1:3000/spotify-concerts** (not `http://localhost:3000`).  
  2. Click Connect Spotify again.  
  3. If it still fails, check the terminal where `node server.js` is running for the exact error (e.g. token exchange error or invalid redirect_uri).

- **401 / session expired when finding concerts**  
  Disconnect and connect Spotify again. Make sure you’re on `http://127.0.0.1:3000/spotify-concerts`.

- **No concerts**  
  Try more cities, a wider year range, or use Spotify for a while so you have top/recent artists.
