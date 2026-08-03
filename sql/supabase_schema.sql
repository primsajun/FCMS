-- Run this script in your Supabase SQL Editor

-- 1. Create the custom_standings table
CREATE TABLE IF NOT EXISTS public.custom_standings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id INTEGER NOT NULL,
  api_team_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  played INTEGER DEFAULT 0,
  win INTEGER DEFAULT 0,
  draw INTEGER DEFAULT 0,
  lose INTEGER DEFAULT 0,
  goals_diff INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  custom_points INTEGER DEFAULT 0, -- Here is where you can assign custom table points!
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the live_fixtures table
CREATE TABLE IF NOT EXISTS public.live_fixtures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_fixture_id INTEGER UNIQUE NOT NULL,
  league_id INTEGER,
  league_name TEXT,
  status TEXT,
  elapsed INTEGER,
  home_team_name TEXT,
  home_team_logo TEXT,
  away_team_name TEXT,
  away_team_logo TEXT,
  home_goals INTEGER DEFAULT 0,
  away_goals INTEGER DEFAULT 0,
  home_winner BOOLEAN,
  away_winner BOOLEAN,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. To make it easy for our Node.js sync script to write data without needing a Service Role Key right now, 
-- we will temporarily disable Row Level Security (RLS) on these tables.
-- In a production environment, you would enable RLS and strictly control write access.
ALTER TABLE public.custom_standings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_fixtures DISABLE ROW LEVEL SECURITY;

-- 4. Enable Supabase Realtime for the live_fixtures table so the React app updates instantly!
alter publication supabase_realtime add table public.live_fixtures;
