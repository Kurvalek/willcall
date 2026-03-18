-- Fix: Enable RLS on setlist_cache (resolves Supabase security warning)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

ALTER TABLE setlist_cache ENABLE ROW LEVEL SECURITY;
