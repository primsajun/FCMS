-- Add live match tracking columns to local_matches table
alter table public.local_matches 
add column if not exists home_score integer default 0,
add column if not exists away_score integer default 0,
add column if not exists elapsed_time integer default 0,
add column if not exists events jsonb default '[]'::jsonb;
