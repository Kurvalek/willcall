require('dotenv').config();
console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO');
console.log('Setlist.fm Key loaded:', process.env.SETLISTFM_API_KEY ? 'YES' : 'NO');
console.log('Ticketmaster loaded:', process.env.TICKETMASTER_API_KEY ? 'YES' : 'NO');
console.log('Google Client ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
console.log('Last.fm API Key loaded:', process.env.LASTFM_API_KEY ? 'YES' : 'NO');
console.log('Supabase loaded:', process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? 'YES' : 'NO');

const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/components.css', (req, res) => res.sendFile(path.join(__dirname, 'components.css')));
app.get('/components.js', (req, res) => res.sendFile(path.join(__dirname, 'components.js')));

// Session middleware for OAuth
app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false
}));

// Page routes registered first so they always work
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});
app.get('/dev', (req, res) => {
  const base = `http://${req.get('host') || 'localhost:3000'}`;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Concert Search POC — Dev</title></head>
    <body style="font-family:sans-serif; max-width:600px; margin:40px auto; padding:20px;">
      <h1>Concert Search POC</h1>
      <p>Server is running. Use one of these pages:</p>
      <ul>
        <li><a href="/app">willcall app</a> (main 4-tab app)</li>
        <li><a href="/test">Concert search</a> (natural language + Setlist.fm)</li>
        <li><a href="/gmail-parser">Gmail parser</a> (find concerts from ticket emails)</li>
      </ul>
      <p><small>If you get 404, restart the server: <code>node server.js</code></small></p>
    </body>
    </html>
  `);
});
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});
app.get('/gmail-parser', (req, res) => {
  res.sendFile(path.join(__dirname, 'gmail-parser.html'));
});
app.get('/api/supabase-config', (req, res) => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_KEY;
  if (!url || !anonKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  res.json({ url, anonKey });
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Supabase client — prefer service role key (bypasses RLS) for server-side ops
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = process.env.SUPABASE_URL && SUPABASE_SERVER_KEY
  ? createClient(process.env.SUPABASE_URL, SUPABASE_SERVER_KEY)
  : null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Supabase: using service role key (RLS bypassed)');
} else if (process.env.SUPABASE_KEY) {
  console.warn('Supabase: using anon key — add SUPABASE_SERVICE_ROLE_KEY for full access');
}

// OAuth2 client for Gmail
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth/callback'
);

// Helper function to normalize venue names
function normalizeVenueName(venueName) {
  if (!venueName) return null;
  
  let normalized = venueName.trim();
  
  // Remove common prefixes that might cause mismatches
  normalized = normalized.replace(/^(the|a|an)\s+/i, '');
  
  // Normalize common abbreviations
  normalized = normalized.replace(/\bSt\b/gi, 'Street');
  normalized = normalized.replace(/\bAve\b/gi, 'Avenue');
  normalized = normalized.replace(/\bBlvd\b/gi, 'Boulevard');
  normalized = normalized.replace(/\bRd\b/gi, 'Road');
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Helper function to convert date to Setlist.fm format (DD-MM-YYYY)
function formatDateForSetlist(dateString) {
  if (!dateString) return null;
  
  try {
    // Try to parse various date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (e) {
    return null;
  }
}

// Rate limit: one Setlist.fm request at a time, with delay between requests to avoid 429
const SETLISTFM_DELAY_MS = 1100;
let setlistFmLastCall = 0;
async function setlistFmRateLimit() {
  const now = Date.now();
  const elapsed = now - setlistFmLastCall;
  if (elapsed < SETLISTFM_DELAY_MS) {
    await new Promise(r => setTimeout(r, SETLISTFM_DELAY_MS - elapsed));
  }
  setlistFmLastCall = Date.now();
}

async function setlistFmRequest(url, options, retries = 3) {
  await setlistFmRateLimit();
  try {
    const response = await axios.get(url, options);
    return response;
  } catch (err) {
    if (retries > 0 && err.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after'];
      const waitMs = retryAfter
        ? (parseInt(retryAfter, 10) || 30) * 1000
        : Math.min(30000, 5000 * (4 - retries));
      console.warn(`Setlist.fm rate limited (429). Waiting ${Math.round(waitMs / 1000)}s before retry (${retries} left)...`);
      await new Promise(r => setTimeout(r, waitMs));
      return setlistFmRequest(url, options, retries - 1);
    }
    throw err;
  }
}

// Helper function to get artist MBID from Setlist.fm
async function getArtistMBID(artistName) {
  if (!process.env.SETLISTFM_API_KEY || !artistName) return null;
  
  try {
    const response = await setlistFmRequest(
      `https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(artistName)}&sort=relevance`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': process.env.SETLISTFM_API_KEY
        }
      }
    );
    
    const artists = response.data?.artist || [];
    if (artists.length > 0) {
      // Return the first (most relevant) artist's MBID
      return artists[0].mbid || null;
    }
    return null;
  } catch (error) {
    console.log(`Could not get MBID for artist "${artistName}":`, error.message);
    return null;
  }
}

// Function to search Setlist.fm with fallback strategies
async function searchSetlistFm(parsedData) {
  const { artist, openingAct, location, venue, dateRange, year, formattedDate } = parsedData;
  
  // Check if API key is set
  if (!process.env.SETLISTFM_API_KEY) {
    console.error('SETLISTFM_API_KEY is not set!');
    throw new Error('Setlist.fm API key is missing');
  }
  
  // Try to get artist MBID for more reliable matching
  let artistMBID = null;
  if (artist) {
    artistMBID = await getArtistMBID(artist);
    if (artistMBID) {
      console.log(`Found MBID for "${artist}": ${artistMBID}`);
    }
  }
  
  // Normalize venue name
  const normalizedVenue = venue ? normalizeVenueName(venue) : null;
  
  // Build all possible parameter combinations for fallback
  const searchStrategies = [];
  
  // Strategy 1: Full search with all parameters (most specific)
  // Use MBID if available, otherwise use artist name
  if (artist || normalizedVenue || location || year) {
    const params = new URLSearchParams();
    if (artistMBID) {
      params.append('artistMbid', artistMBID);
    } else if (artist) {
      params.append('artistName', artist.trim());
    }
    if (normalizedVenue) {
      params.append('venueName', normalizedVenue);
    } else if (venue) {
      params.append('venueName', venue.trim());
    }
    if (location) {
      const city = location.split(',')[0].trim();
      params.append('cityName', city);
    }
    // Use specific date if available (more precise than year)
    if (formattedDate) {
      params.append('date', formattedDate);
    } else if (year) {
      params.append('year', year.toString());
    } else if (dateRange?.start) {
      params.append('year', dateRange.start.toString());
    }
    if (params.toString().length > 0) {
      searchStrategies.push({ params, description: 'full search (with MBID if available)' });
    }
  }
  
  // Strategy 2: Artist (MBID) + Venue (if both available)
  if (artistMBID && normalizedVenue) {
    const params = new URLSearchParams();
    params.append('artistMbid', artistMBID);
    params.append('venueName', normalizedVenue);
    searchStrategies.push({ params, description: 'artist MBID + venue' });
  }
  
  // Strategy 3: Artist + Venue (if both available, using names)
  if (artist && normalizedVenue && !artistMBID) {
    const params = new URLSearchParams();
    params.append('artistName', artist.trim());
    params.append('venueName', normalizedVenue);
    searchStrategies.push({ params, description: 'artist + venue (normalized)' });
  }
  
  // Strategy 4: Artist (MBID) + Location (if both available)
  if (artistMBID && location) {
    const params = new URLSearchParams();
    params.append('artistMbid', artistMBID);
    const city = location.split(',')[0].trim();
    params.append('cityName', city);
    if (year) params.append('year', year.toString());
    searchStrategies.push({ params, description: 'artist MBID + location' });
  }
  
  // Strategy 5: Artist + Location (if both available, using names)
  if (artist && location && !artistMBID) {
    const params = new URLSearchParams();
    params.append('artistName', artist.trim());
    const city = location.split(',')[0].trim();
    params.append('cityName', city);
    if (year) params.append('year', year.toString());
    searchStrategies.push({ params, description: 'artist + location' });
  }
  
  // Strategy 6: Artist (MBID) + Year only
  if (artistMBID && (year || dateRange?.start)) {
    const params = new URLSearchParams();
    params.append('artistMbid', artistMBID);
    if (year) {
      params.append('year', year.toString());
    } else if (dateRange?.start) {
      params.append('year', dateRange.start.toString());
    }
    searchStrategies.push({ params, description: 'artist MBID + year' });
  }
  
  // Strategy 7: Artist + Year only (using name)
  if (artist && (year || dateRange?.start) && !artistMBID) {
    const params = new URLSearchParams();
    params.append('artistName', artist.trim());
    if (year) {
      params.append('year', year.toString());
    } else if (dateRange?.start) {
      params.append('year', dateRange.start.toString());
    }
    searchStrategies.push({ params, description: 'artist + year' });
  }
  
  // Strategy 8: Artist only (MBID if available, otherwise name)
  if (artist) {
    const params = new URLSearchParams();
    if (artistMBID) {
      params.append('artistMbid', artistMBID);
      searchStrategies.push({ params, description: 'artist MBID only' });
    } else {
      params.append('artistName', artist.trim());
      searchStrategies.push({ params, description: 'artist only' });
    }
  }
  
  // Try each strategy until one succeeds (rate-limited, one request at a time)
  for (const strategy of searchStrategies) {
    try {
      const url = `https://api.setlist.fm/rest/1.0/search/setlists?${strategy.params.toString()}`;
      console.log(`Trying Setlist.fm search (${strategy.description}):`, url);
      
      const response = await setlistFmRequest(url, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': process.env.SETLISTFM_API_KEY
        }
      });
      
      const data = response.data;
      
      // If we got results, return them (even if it's a broader search)
      if (data.setlist && data.setlist.length > 0) {
        console.log(`✓ Found ${data.total} results with ${strategy.description}`);
        return data;
      }
      
      // If no results but not a 404, continue to next strategy
      console.log(`No results with ${strategy.description}, trying next strategy...`);
      
    } catch (error) {
      // If 404, try next strategy
      if (error.response?.status === 404) {
        console.log(`404 with ${strategy.description}, trying next strategy...`);
        continue;
      }
      
      // For other errors, log and continue
      if (error.response) {
        console.error(`Setlist.fm API error (${strategy.description}):`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else {
        console.error(`Setlist.fm error (${strategy.description}):`, error.message);
      }
      
      // Continue to next strategy unless it's the last one
      if (strategy !== searchStrategies[searchStrategies.length - 1]) {
        continue;
      }
      
      // If this is the last strategy, throw the error
      throw error;
    }
  }
  
  // If all strategies failed, return empty results
  console.warn('All search strategies failed, returning empty results');
  return { setlist: [], total: 0 };
}

// Endpoint to parse natural language concert query AND search for concerts
app.post('/parse-concert-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Step 1: Parse with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract ALL concert searches from this query (there may be multiple): "${query}"
        
Return ONLY a JSON object with this shape:
{
  "events": [
    {
      "artist": string,        // main/headliner band/artist name
      "openingAct": string|null, // opening act/artist if mentioned (e.g., "I saw Modest Mouse open for Brand New")
      "location": string|null, // city and state like "Clifton Park, NY"
      "venue": string|null,    // venue name if mentioned
      "date": string|null,     // specific date if mentioned (format: YYYY-MM-DD or any parseable date format)
      "dateRange": { "start": string|null, "end": string|null }, // years (YYYY) if mentioned
      "year": string|null      // specific year if clearly mentioned
    }
  ]
}

Rules:
- If the query mentions an opening act (e.g., "I saw Modest Mouse open for Brand New"), set "openingAct" to the opener and "artist" to the headliner.
- If the query mentions multiple concerts, create one event per concert.
- If only one concert is mentioned, still return an object with an "events" array containing exactly one event.
- If some fields are not mentioned, use null for them.

Example queries:
1. "i saw jimmy eat world in clifton park, ny in the early 2000's"
2. "i saw modest mouse open for brand new at msg in 2006"
3. "bright eyes in miami around 2004 and death cab for cutie opened for them"

Example responses:
{
  "events": [
    {
      "artist": "Jimmy Eat World",
      "openingAct": null,
      "location": "Clifton Park, NY",
      "venue": null,
      "date": null,
      "dateRange": { "start": "2000", "end": "2009" },
      "year": null
    }
  ]
}

{
  "events": [
    {
      "artist": "Brand New",
      "openingAct": "Modest Mouse",
      "location": "New York, NY",
      "venue": "Madison Square Garden",
      "date": "2006-10-15",
      "dateRange": { "start": "2006", "end": "2006" },
      "year": "2006"
    }
  ]
}

{
  "events": [
    {
      "artist": "Bright Eyes",
      "openingAct": "Death Cab for Cutie",
      "location": "Miami, FL",
      "venue": null,
      "date": null,
      "dateRange": { "start": "2004", "end": "2004" },
      "year": "2004"
    }
  ]
}

Return ONLY the JSON, no other text.`
      }]
    });
    
    // Log what Claude returned
    console.log('Claude raw response:', message.content[0].text);

    // Try to clean it before parsing
    let cleanedText = message.content[0].text.trim();

    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    console.log('Cleaned text:', cleanedText);

    const parsedData = JSON.parse(cleanedText);
    console.log('Parsed data:', parsedData);
    
    // Normalize to an array of events
    let events = [];
    if (Array.isArray(parsedData?.events)) {
      events = parsedData.events;
    } else if (Array.isArray(parsedData)) {
      events = parsedData;
    } else if (parsedData) {
      events = [parsedData];
    }
    
    // Filter out completely empty events
    events = events.filter(e => e && (e.artist || e.location || e.venue));
    
    if (events.length === 0) {
      return res.json({
        parsed: null,
        parsedEvents: [],
        results: [],
        total: 0
      });
    }
    
    // Step 2: Search Setlist.fm for each event sequentially (rate limit)
    const searchResults = [];
    for (const event of events) {
      try {
        // If a specific date is provided, format it for Setlist.fm
        if (event.date) {
          const formattedDate = formatDateForSetlist(event.date);
          if (formattedDate) {
            event.formattedDate = formattedDate;
          }
        }
        const result = await searchSetlistFm(event);
        let setlists = result.setlist || [];
          
          // If opening act is mentioned, add it to the search context
          // The opening act info will be displayed from the search context
          // Note: Setlist.fm doesn't directly provide opening acts in the setlist response,
          // but we preserve the user's query information for display
          
        searchResults.push({ event, setlists, total: result.total || 0 });
      } catch (err) {
        console.error('Error searching Setlist.fm for event:', event, err.message);
        searchResults.push({ event, setlists: [], total: 0 });
      }
    }
    
    // Flatten results but keep basic event attribution
    const combinedSetlists = [];
    let combinedTotal = 0;
    
    searchResults.forEach(({ event, setlists, total }) => {
      combinedTotal += Number(total) || 0;
      setlists.forEach(s => {
          combinedSetlists.push({
            ...s,
            _searchContext: {
              artist: event.artist,
              openingAct: event.openingAct,
              location: event.location,
              venue: event.venue,
              year: event.year,
              dateRange: event.dateRange || null
            }
          });
      });
    });
    
    // Step 3: Return parsed events and combined results
    res.json({
      parsed: events.length === 1 ? events[0] : null,  // backwards-compatible single parsed view
      parsedEvents: events,                           // full list of parsed events
      results: combinedSetlists,
      total: combinedTotal
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gmail OAuth routes
app.get('/oauth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  res.redirect(authUrl);
});

app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens in session
    req.session.tokens = tokens;
    
    // Redirect back to gmail-parser page with success flag
    res.redirect('/gmail-parser?authenticated=true');
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/gmail-parser?error=auth_failed');
  }
});

// ── Last.fm API ──

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

async function getLastfmTopArtists(username, limit = 50) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;
  const res = await axios.get(url);
  const artists = res.data?.topartists?.artist || [];
  return artists.map(a => ({
    name: a.name,
    playcount: parseInt(a.playcount, 10) || 0,
    image: (a.image && a.image.find(i => i.size === 'large'))?.['#text'] || null
  }));
}

app.get('/api/lastfm/top-artists', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
  try {
    const artists = await getLastfmTopArtists(username, 50);
    res.json({ artists });
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    console.error('[lastfm] top-artists error:', msg);
    res.status(e.response?.status === 404 ? 404 : 500).json({ error: msg });
  }
});

app.get('/api/lastfm/validate', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ valid: false, error: 'username required' });
  if (!LASTFM_API_KEY) return res.status(500).json({ valid: false, error: 'Last.fm API key not configured' });
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json`;
    const r = await axios.get(url);
    const user = r.data?.user;
    res.json({ valid: !!user, username: user?.name || username });
  } catch (e) {
    res.json({ valid: false, error: 'User not found on Last.fm' });
  }
});


// Last.fm concert suggestions: top artists → Setlist.fm search
app.post('/api/lastfm/concerts-suggestions', async (req, res) => {
  try {
    let { username, cities, yearStart, yearEnd, artistLimit } = req.body;
    if (!username) return res.status(400).json({ error: 'Last.fm username required' });
    if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
    if (!cities || !Array.isArray(cities)) {
      cities = typeof req.body.cities === 'string' ? req.body.cities.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
    if (cities.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one city.' });
    }
    let maxArtists = 20;
    if (artistLimit != null) {
      const n = parseInt(String(artistLimit), 10);
      if (!isNaN(n)) maxArtists = Math.min(50, Math.max(1, n));
    }

    let artists = await getLastfmTopArtists(username, 50);
    console.log(`[concerts-suggestions] Got ${artists.length} top artists from Last.fm for ${username}`);
    if (artists.length === 0) {
      return res.json({ concerts: [], message: 'No top artists found on Last.fm for this user.' });
    }

    const maxCities = 6;
    const artistsToUse = artists.slice(0, maxArtists);
    const citiesToUse = cities.slice(0, maxCities);

    const yearStartNum = yearStart != null ? parseInt(String(yearStart), 10) : null;
    const yearEndNum = yearEnd != null ? parseInt(String(yearEnd), 10) : null;
    const results = [];
    const seen = new Set();
    const startYear = yearStartNum ?? 0;
    const endYear = yearEndNum ?? 9999;

    console.log(`[concerts-suggestions] Searching ${artistsToUse.length} artists × ${citiesToUse.length} cities`);

    let consecutive429s = 0;
    const MAX_CONSECUTIVE_429S = 3;

    for (const artist of artistsToUse) {
      if (consecutive429s >= MAX_CONSECUTIVE_429S) {
        console.warn('[concerts-suggestions] Too many rate limits, stopping early');
        break;
      }
      const artistName = artist.name;
      for (const city of citiesToUse) {
        try {
          const data = await searchSetlistWithCache(artistName, city, 0);
          consecutive429s = 0;
          const setlists = data.setlist || [];
          for (const s of setlists) {
            const key = `${s.artist?.name}-${s.eventDate}-${s.venue?.name}`;
            if (seen.has(key)) continue;
            const setlistYear = s.eventDate ? parseInt(String(s.eventDate).split('-')[2], 10) : null;
            if (setlistYear != null && (yearStartNum != null || yearEndNum != null) && (setlistYear < startYear || setlistYear > endYear)) continue;
            seen.add(key);
            results.push({ ...s, _sourceArtist: artistName, _sourceArtistImage: artist.image || null });
          }
        } catch (err) {
          if (err.response?.status === 429) {
            consecutive429s++;
          }
        }
      }
    }

    results.sort((a, b) => {
      const dA = a.eventDate ? parseSetlistDate(a.eventDate) : 0;
      const dB = b.eventDate ? parseSetlistDate(b.eventDate) : 0;
      return dB - dA;
    });
    res.json({ concerts: results.slice(0, 100), artistsUsed: artistsToUse.map(a => a.name) });
  } catch (error) {
    console.error('Last.fm concerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Strip state/country suffix from city strings like "Albany, NY" or "New York, NY, USA"
function parseCityInput(raw) {
  const str = String(raw || '').trim();
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  const city = parts[0] || str;
  const state = parts.length >= 2 ? parts[1] : null;
  return { city, state };
}

// Fast Setlist.fm search: ONE request, artist + city only. No MBID, no fallbacks.
async function searchSetlistFmSimple(artistName, cityName) {
  if (!process.env.SETLISTFM_API_KEY || !artistName || !cityName) return { setlist: [], total: 0 };
  const { city, state } = parseCityInput(cityName);
  const params = new URLSearchParams({ artistName: String(artistName).trim(), cityName: city });
  if (state) params.set('stateCode', state);
  const url = `https://api.setlist.fm/rest/1.0/search/setlists?${params}`;
  try {
    const response = await setlistFmRequest(url, {
      headers: { Accept: 'application/json', 'x-api-key': process.env.SETLISTFM_API_KEY }
    });
    return response.data || { setlist: [], total: 0 };
  } catch (err) {
    if (err.response?.status === 404) return { setlist: [], total: 0 };
    throw err;
  }
}

const CACHE_TTL_DAYS = 30;

// Search Setlist.fm with Supabase cache. Use year=0 for "all years" (API returns all, filter in code).
async function searchSetlistWithCache(artistName, cityName, year = 0) {
  const artist = String(artistName || '').trim();
  const rawCity = String(cityName || '').trim();
  const { city } = parseCityInput(rawCity);
  const yearNum = year != null ? parseInt(String(year), 10) : 0;
  if (!artist || !city) return { setlist: [], total: 0 };

  if (supabase) {
    try {
      const { data: row, error } = await supabase
        .from('setlist_cache')
        .select('results, created_at')
        .eq('artist_name', artist)
        .eq('city_name', city)
        .eq('year', isNaN(yearNum) ? 0 : yearNum)
        .maybeSingle();

      if (!error && row?.results) {
        const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
        const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
        if (ageDays < CACHE_TTL_DAYS) {
          return Array.isArray(row.results) ? { setlist: row.results, total: row.results.length } : row.results;
        }
      }
    } catch (e) {
      console.warn('Setlist cache read error:', e.message);
    }
  }

  let result;
  try {
    result = await searchSetlistFmSimple(artist, rawCity);
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('Setlist.fm rate limit hit for', artist, rawCity);
    }
    throw err;
  }

  const payload = result?.setlist || [];
  if (supabase && payload) {
    try {
      await supabase.from('setlist_cache').upsert(
        {
          artist_name: artist,
          city_name: city,
          year: isNaN(yearNum) ? 0 : yearNum,
          results: payload,
          created_at: new Date().toISOString()
        },
        { onConflict: 'artist_name,city_name,year' }
      );
    } catch (e) {
      console.warn('Setlist cache write error:', e.message);
    }
  }

  return result;
}

function parseSetlistDate(str) {
  if (!str) return 0;
  const [d, m, y] = str.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d).getTime();
  return 0;
}

// Helper function to extract text from email parts recursively
function extractEmailBody(parts, preferPlainText = true) {
  let plainText = '';
  let htmlText = '';
  
  if (!parts) return { plainText: '', htmlText: '' };
  
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      plainText += Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      htmlText += Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.parts) {
      // Recursively process nested parts
      const nested = extractEmailBody(part.parts, preferPlainText);
      plainText += nested.plainText;
      htmlText += nested.htmlText;
    }
  }
  
  return { plainText, htmlText };
}

// Helper function to strip HTML tags and decode HTML entities
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

// Scan Gmail for concert tickets
app.get('/scan-gmail', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Expanded search query with more ticket vendors
    const queries = [
      'from:ticketmaster.com (ticket OR confirmation OR order)',
      'from:stubhub.com (ticket OR confirmation OR order)',
      'from:livenation.com (ticket OR confirmation OR order)',
      'from:axs.com (ticket OR confirmation OR order)',
      'from:eventbrite.com (ticket OR confirmation OR order)',
      'from:seatgeek.com (ticket OR confirmation OR order)',
      'from:vivid-seats.com OR from:vividseats.com (ticket OR confirmation)',
      'from:ticketfly.com (ticket OR confirmation)',
      'from:etix.com (ticket OR confirmation)',
      'from:ticketweb.com (ticket OR confirmation)',
      'from:bandsintown.com (ticket OR confirmation)',
      'from:universe.com (ticket OR confirmation)'
    ];
    
    console.log('Searching Gmail for ticket emails...');
    
    // Search all queries in parallel for much faster results
    const searchPromises = queries.map(query => 
      gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 30 // Reduced from 50 for faster processing
      }).then(response => response.data.messages || [])
        .catch(error => {
          console.error(`Error searching with query "${query}":`, error.message);
          return [];
        })
    );
    
    const searchResults = await Promise.all(searchPromises);
    const allMessages = searchResults.flat();
    
    // Remove duplicate message IDs
    const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
    
    console.log(`Found ${uniqueMessages.length} unique ticket emails`);
    
    if (uniqueMessages.length === 0) {
      return res.json({ concerts: [] });
    }
    
    // Process emails (limit to 20 for faster processing)
    const messagesToProcess = uniqueMessages.slice(0, 20);
    const concerts = [];
    const seenConcerts = new Set(); // For deduplication
    
    console.log(`Fetching ${messagesToProcess.length} emails in parallel...`);
    
    // Helper function to process a single email
    const processEmail = async (message) => {
      try {
        // Fetch email
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        // Get email headers
        const headers = email.data.payload.headers || [];
        const getHeader = (name) => {
          const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
          return header ? header.value : '';
        };
        
        const emailSubject = getHeader('subject');
        const from = getHeader('from');
        const date = getHeader('date');
        
        // Extract email body
        let emailBody = '';
        if (email.data.payload.body?.data) {
          emailBody = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
        } else if (email.data.payload.parts) {
          const extracted = extractEmailBody(email.data.payload.parts);
          emailBody = extracted.plainText || stripHtml(extracted.htmlText);
        }
        
        // Limit email body size
        const emailContent = emailBody.substring(0, 5000);
        
        // Build full content with context
        const fullContent = `Email Subject: ${emailSubject}
Email Date: ${date}
Email From: ${from}

Email Body:
${emailContent}`;
        
        // Parse email with Claude
        const claudeResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are extracting concert information from a ticket confirmation email. 

IMPORTANT: Only extract MUSIC CONCERTS. Ignore sports events, theater shows, comedy shows, or other non-music events unless they are clearly music concerts.

Extract the following information from this email:

${fullContent}

Return ONLY a JSON object with these exact fields:
- artist: the main artist/band name (string, just the name - remove "featuring", "with", opening acts, etc.)
- date: the concert date in YYYY-MM-DD format if possible, or the best date format you can extract (string)
- venue: the venue name (string)
- location: city and state/country (string, e.g., "New York, NY" or "Los Angeles, CA")
- isConcert: true if this is a music concert, false if it's not a music event (boolean)

Examples of GOOD concerts to extract:
- Rock concerts, pop concerts, hip-hop shows, jazz concerts, country concerts
- Music festivals
- Any live music performance

Examples of things to SKIP (set isConcert: false):
- Sports games (baseball, football, basketball, etc.)
- Theater shows (plays, musicals)
- Comedy shows
- Non-music events

If you cannot find clear concert information, return: {"isConcert": false}

Return ONLY the JSON object, no other text or explanation.`
          }]
        });
        
        let cleanedText = claudeResponse.content[0].text.trim();
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        const parsed = JSON.parse(cleanedText);
        
        if (parsed.isConcert === true && parsed.artist) {
          // Normalize date format
          let normalizedDate = parsed.date;
          if (normalizedDate) {
            try {
              const dateObj = new Date(normalizedDate);
              if (!isNaN(dateObj.getTime())) {
                normalizedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
              }
            } catch (e) {
              // Keep original format if parsing fails
            }
          }
          
          // Create a unique key for deduplication
          const concertKey = `${(parsed.artist || '').toLowerCase().trim()}-${normalizedDate || ''}-${(parsed.venue || '').toLowerCase().trim()}`;
          
          return {
            key: concertKey,
            concert: {
              artist: parsed.artist.trim(),
              date: normalizedDate || parsed.date,
              venue: parsed.venue ? parsed.venue.trim() : null,
              location: parsed.location ? parsed.location.trim() : null,
              from: from.includes('<') ? from.split('<')[1].replace('>', '') : from
            }
          };
        }
        
        return null;
      } catch (error) {
        console.error(`Error parsing email ${message.id}:`, error.message);
        return null;
      }
    };
    
    // Process all emails in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 5; // Process 5 emails at a time to avoid rate limits
    const results = [];
    
    for (let i = 0; i < messagesToProcess.length; i += CONCURRENCY_LIMIT) {
      const batch = messagesToProcess.slice(i, i + CONCURRENCY_LIMIT);
      console.log(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(messagesToProcess.length / CONCURRENCY_LIMIT)}...`);
      
      const batchResults = await Promise.all(batch.map(processEmail));
      results.push(...batchResults.filter(r => r !== null));
    }
    
    // Deduplicate and collect concerts
    for (const result of results) {
      if (result && !seenConcerts.has(result.key)) {
        seenConcerts.add(result.key);
        concerts.push(result.concert);
        console.log(`✓ Extracted: ${result.concert.artist} - ${result.concert.date}`);
      }
    }
    
    // Sort by date (most recent first, then by artist name)
    concerts.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
        return (a.artist || '').localeCompare(b.artist || '');
      }
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB - dateA; // Most recent first
    });
    
    console.log(`\n✓ Successfully parsed ${concerts.length} unique concerts from ${messagesToProcess.length} emails`);
    
    res.json({ concerts });
    
  } catch (error) {
    console.error('Gmail scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check – returns JSON so you can verify the API is reachable
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const publicBase = (process.env.PUBLIC_BASE_URL || process.env.WILLCALL_PUBLIC_URL || '').trim().replace(/\/$/, '');
  res.json({
    ok: true,
    message: 'API is running',
    publicBaseUrl: publicBase || null,
    configured: {
      supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),
      lastfm: !!process.env.LASTFM_API_KEY,
      ticketmaster: !!process.env.TICKETMASTER_API_KEY,
      setlistfm: !!process.env.SETLISTFM_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  });
});

// Ticketmaster Discovery API – events near a location
app.get('/api/ticketmaster/events', async (req, res) => {
  console.log('[Ticketmaster] Request received for city:', req.query.city || 'New York');
  res.setHeader('Content-Type', 'application/json');
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Ticketmaster API key not configured. Add TICKETMASTER_API_KEY to .env' });
  }
  const city = req.query.city || 'New York';
  const countryCode = req.query.countryCode || 'US';
  const stateCode = req.query.stateCode || '';
  const size = Math.min(parseInt(req.query.size, 10) || 20, 50);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      city: city,
      countryCode: countryCode,
      classificationName: 'music',
      startDateTime: today + 'T00:00:00Z',
      sort: 'date,asc',
      size: String(size)
    });
    if (stateCode) params.set('stateCode', stateCode);
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
    const response = await axios.get(url, { timeout: 10000 });
    const events = response.data?._embedded?.events || [];
    const normalized = events.map((e) => {
      const venue = e._embedded?.venues?.[0];
      const attraction = e._embedded?.attractions?.[0];
      const artist = attraction?.name || e.name || 'Unknown';
      const images = e.images || [];
      const img = images.find((i) => i.ratio === '16_9') || images.find((i) => i.ratio === '4_3') || images[0];
      const imageUrl = img?.url || null;
      return {
        id: e.id,
        name: e.name,
        artist: { name: artist },
        eventDate: e.dates?.start?.localDate || '',
        imageUrl,
        venue: venue ? {
          name: venue.name,
          city: venue.city ? {
            name: venue.city.name,
            country: venue.country ? { name: venue.country.countryCode || venue.country } : null
          } : null
        } : null,
        url: e.url,
        _source: 'ticketmaster'
      };
    });
    res.json({ events: normalized });
  } catch (err) {
    console.error('Ticketmaster API error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.fault?.faultstring || err.message || 'Failed to fetch events';
    res.status(status).json({ error: msg });
  }
});

// Ticketmaster keyword search – for check-in flow
app.get('/api/ticketmaster/search', async (req, res) => {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Ticketmaster API key not configured.' });
  const keyword = (req.query.keyword || '').trim();
  if (!keyword) return res.status(400).json({ error: 'keyword is required' });
  const size = Math.min(parseInt(req.query.size, 10) || 20, 50);
  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      keyword,
      classificationName: 'music',
      sort: 'date,asc',
      size: String(size)
    });
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
    const response = await axios.get(url, { timeout: 10000 });
    const events = response.data?._embedded?.events || [];
    const normalized = events.map((e) => {
      const venue = e._embedded?.venues?.[0];
      const attraction = e._embedded?.attractions?.[0];
      const artist = attraction?.name || e.name || 'Unknown';
      const images = e.images || [];
      const img = images.find((i) => i.ratio === '16_9') || images.find((i) => i.ratio === '4_3') || images[0];
      return {
        id: e.id,
        name: e.name,
        artist: { name: artist },
        eventDate: e.dates?.start?.localDate || '',
        imageUrl: img?.url || null,
        venue: venue ? {
          name: venue.name,
          city: venue.city ? {
            name: venue.city.name,
            country: venue.country ? { name: venue.country.countryCode || venue.country } : null
          } : null
        } : null,
        url: e.url,
        _source: 'ticketmaster'
      };
    });
    res.json({ events: normalized });
  } catch (err) {
    console.error('Ticketmaster search error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.fault?.faultstring || err.message });
  }
});

// Waitlist email collection
app.post('/api/waitlist', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured.' });
  }
  try {
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return res.json({ ok: true, message: 'Already on the list.' });
    }
    const { error } = await supabase.from('waitlist').insert({ email });
    if (error) {
      console.error('Waitlist insert error:', error.message);
      return res.status(500).json({ error: 'Could not save. Try again.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Waitlist error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Check if an account exists for a given email
app.post('/api/auth/check-email', async (req, res) => {
  if (!supabase) return res.json({ exists: false });
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    res.json({ exists: !!data });
  } catch (err) {
    console.warn('check-email error:', err.message);
    res.json({ exists: false });
  }
});

// Get a single user's profile + follower/following counts
app.get('/api/users/:id/profile', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  try {
    const [profileRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, avatar_url, profile_color').eq('id', userId).maybeSingle(),
      supabase.from('follows').select('follower_id').eq('following_id', userId),
      supabase.from('follows').select('following_id').eq('follower_id', userId)
    ]);
    if (!profileRes.data) return res.status(404).json({ error: 'User not found' });
    const followerIds = (followersRes.data || []).map(r => r.follower_id);
    const followingIds = (followingRes.data || []).map(r => r.following_id);
    res.json({
      profile: profileRes.data,
      followerCount: followerIds.length,
      followingCount: followingIds.length,
      followerIds: followerIds,
      followingIds: followingIds
    });
  } catch (err) {
    console.error('User profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update profile color
app.post('/api/users/:id/profile-color', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  const color = (req.body && req.body.color) || '#F9F8F4';
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_color: color })
      .eq('id', userId);
    if (error) {
      console.warn('profile-color update error:', error.message);
      return res.json({ ok: true });
    }
    res.json({ ok: true });
  } catch (err) {
    console.warn('profile-color error:', err.message);
    res.json({ ok: true });
  }
});

// Get user locations
app.get('/api/users/:id/locations', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const { data } = await supabase.from('profiles').select('locations').eq('id', req.params.id).maybeSingle();
    res.json({ locations: (data && data.locations) || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save user locations
app.post('/api/users/:id/locations', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const locations = req.body && req.body.locations;
  if (!Array.isArray(locations)) return res.status(400).json({ error: 'locations must be an array' });
  try {
    await supabase.from('profiles').update({ locations: locations }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update avatar
app.post('/api/users/:id/avatar', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  const avatarUrl = (req.body && req.body.avatar_url) || '';
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (error) {
      console.warn('avatar update error:', error.message);
      return res.json({ ok: true });
    }
    res.json({ ok: true });
  } catch (err) {
    console.warn('avatar error:', err.message);
    res.json({ ok: true });
  }
});

// ── User shows (attended + upcoming) ──

app.get('/api/users/:id/shows', async (req, res) => {
  if (!supabase) return res.json({ attended: [], upcoming: [] });
  const userId = req.params.id;
  try {
    const { data, error } = await supabase
      .from('user_shows')
      .select('id, type, show_data, show_key, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('user_shows select error:', error.message);
      return res.json({ attended: [], upcoming: [] });
    }
    const attended = [];
    const upcoming = [];
    (data || []).forEach(row => {
      if (row.type === 'attended') attended.push(row.show_data);
      else upcoming.push(row.show_data);
    });
    res.json({ attended, upcoming });
  } catch (err) {
    console.warn('user_shows error:', err.message);
    res.json({ attended: [], upcoming: [] });
  }
});

app.post('/api/users/:id/shows', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  const { type, show_data, show_key } = req.body || {};
  if (!type || !show_data) return res.status(400).json({ error: 'type and show_data required' });
  try {
    const { data, error } = await supabase
      .from('user_shows')
      .upsert({
        user_id: userId,
        type,
        show_data,
        show_key: show_key || '',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id,type,show_key' })
      .select('id')
      .maybeSingle();
    if (error) {
      console.warn('user_shows insert error:', error.message);
      return res.json({ ok: true });
    }
    res.json({ ok: true, id: data?.id });
  } catch (err) {
    console.warn('user_shows insert exception:', err.message);
    res.json({ ok: true });
  }
});

app.delete('/api/users/:id/shows', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  const { show_key, type } = req.body || {};
  if (!show_key || !type) return res.status(400).json({ error: 'show_key and type required' });
  try {
    const { error } = await supabase
      .from('user_shows')
      .delete()
      .eq('user_id', userId)
      .eq('type', type)
      .eq('show_key', show_key);
    if (error) console.warn('user_shows delete error:', error.message);
    res.json({ ok: true });
  } catch (err) {
    console.warn('user_shows delete exception:', err.message);
    res.json({ ok: true });
  }
});

app.post('/api/users/:id/shows/bulk', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const userId = req.params.id;
  const { shows } = req.body || {};
  if (!Array.isArray(shows) || shows.length === 0) return res.json({ ok: true, inserted: 0 });
  try {
    const rows = shows.map(s => ({
      user_id: userId,
      type: s.type,
      show_data: s.show_data,
      show_key: s.show_key || '',
      created_at: s.created_at || new Date().toISOString()
    }));
    const { error } = await supabase
      .from('user_shows')
      .upsert(rows, { onConflict: 'user_id,type,show_key', ignoreDuplicates: true });
    if (error) console.warn('user_shows bulk error:', error.message);
    res.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.warn('user_shows bulk exception:', err.message);
    res.json({ ok: true, inserted: 0 });
  }
});

// Search users in Supabase profiles
app.get('/api/users/search', async (req, res) => {
  if (!supabase) return res.json({ users: [] });
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, email, avatar_url')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(20);
    if (error) {
      console.warn('/api/users/search error:', error.message);
      return res.json({ users: [] });
    }
    res.json({ users: data || [] });
  } catch (err) {
    console.warn('/api/users/search error:', err.message);
    res.json({ users: [] });
  }
});

// List all users (for suggestions)
app.get('/api/users', async (req, res) => {
  if (!supabase) return res.json({ users: [] });
  const excludeId = req.query.exclude || '';
  try {
    let query = supabase.from('profiles').select('id, display_name, username, avatar_url').limit(20);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) {
      console.warn('/api/users query error:', error.message);
      return res.json({ users: [] });
    }
    res.json({ users: data || [] });
  } catch (err) {
    console.warn('/api/users error:', err.message);
    res.json({ users: [] });
  }
});

// Follow / unfollow
app.post('/api/users/follow', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { follower_id, following_id } = req.body;
  if (!follower_id || !following_id) return res.status(400).json({ error: 'Missing ids' });
  try {
    const { error } = await supabase.from('follows').upsert({ follower_id, following_id });
    if (error) {
      console.error('Follow error:', error.message);
      if (error.message.includes('follows') && error.message.includes('not found')) {
        return res.status(500).json({ error: 'The follows table has not been created yet. Please create it in Supabase.' });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Follow exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/unfollow', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { follower_id, following_id } = req.body;
  if (!follower_id || !following_id) return res.status(400).json({ error: 'Missing ids' });
  try {
    const { error } = await supabase.from('follows')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);
    if (error) {
      console.error('Unfollow error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Unfollow exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get followers and following for a user
app.get('/api/users/:id/connections', async (req, res) => {
  if (!supabase) return res.json({ followers: [], following: [] });
  const userId = req.params.id;
  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('following_id', userId),
      supabase.from('follows').select('following_id').eq('follower_id', userId)
    ]);
    if (followersRes.error || followingRes.error) {
      console.warn('Connections query error:', followersRes.error?.message || followingRes.error?.message);
      return res.json({ followers: [], following: [] });
    }
    const followerIds = (followersRes.data || []).map(r => r.follower_id);
    const followingIds = (followingRes.data || []).map(r => r.following_id);

    const allIds = [...new Set([...followerIds, ...followingIds])];
    let profiles = [];
    if (allIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', allIds);
      profiles = data || [];
    }
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.id] = p; });

    res.json({
      followers: followerIds.map(id => profileMap[id]).filter(Boolean),
      following: followingIds.map(id => profileMap[id]).filter(Boolean)
    });
  } catch (err) {
    console.warn('Connections exception:', err.message);
    res.json({ followers: [], following: [] });
  }
});

// 404 handler – so wrong URLs show what’s available
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>404 – Not found</title></head>
    <body style="font-family:sans-serif; max-width:600px; margin:40px auto; padding:20px;">
      <h1>404 – Page not found</h1>
      <p>This URL isn’t set up. Valid pages:</p>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/test">Concert search</a></li>
        <li><a href="/gmail-parser">Gmail parser</a></li>
      </ul>
    </body>
    </html>
  `);
});

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  console.log(`  App:     http://127.0.0.1:${PORT}/app`);
  console.log(`  API:     http://127.0.0.1:${PORT}/api/health`);
  console.log(`  Concert search: http://127.0.0.1:${PORT}/test`);
  console.log(`  Gmail parser:   http://127.0.0.1:${PORT}/gmail-parser`);
  console.log('');
  console.log('>>> Leave this terminal open. Press Ctrl+C to stop the server.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process first:`);
    console.error(`  Mac/Linux: lsof -i :${PORT}   then   kill -9 <PID>`);
    console.error(`  Or run: npx kill-port ${PORT}`);
    process.exit(1);
  }
  throw err;
});