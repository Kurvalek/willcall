-- Run this SQL in your Supabase SQL Editor to create the setlist cache table.

CREATE TABLE IF NOT EXISTS setlist_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 0,
  results JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (artist_name, city_name, year)
);

-- Use year=0 when caching "all years" (Setlist.fm returns all, we filter in app)

-- Index for cache lookup by created_at (to check 30-day freshness)
CREATE INDEX IF NOT EXISTS idx_setlist_cache_created_at
  ON setlist_cache (created_at);

-- Enable RLS (required for public schema tables). Backend uses service role key which bypasses RLS.
-- With RLS enabled and no policies, anon key cannot access; only service role (backend) can.
ALTER TABLE setlist_cache ENABLE ROW LEVEL SECURITY;
