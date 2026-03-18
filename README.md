# Concert Search POC

## Run the server

**Start (keep this terminal open):**
```bash
npm start
```
Or: `node server.js`

You should see the "YES" lines and the URLs. **Leave that terminal window open.** The server runs in the foreground. When you close the terminal or press **Ctrl+C**, the server stops.

**If the server won’t stay running or you get "address already in use":**

1. Stop anything using port 3000:
   ```bash
   npx kill-port 3000
   ```
   Or on Mac/Linux:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```
2. Start again:
   ```bash
   npm start
   ```

**Open the app:**  
http://127.0.0.1:3000/

- Concert search (natural language): `/test`
- Gmail concert parser: `/gmail-parser`
- Spotify concerts: `/spotify-concerts`
