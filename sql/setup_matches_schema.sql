-- Create a table for local matches scheduled by coaches
create table if not exists public.local_matches (
  id uuid default gen_random_uuid() primary key,
  team_name text not null,
  opponent text not null,
  match_date timestamp with time zone not null,
  location text,
  status text default 'scheduled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.local_matches enable row level security;

-- Local Matches Policies
create policy "Local matches are viewable by everyone."
  on local_matches for select
  using ( true );

create policy "Coaches can insert local matches."
  on local_matches for insert
  with check ( true );

create policy "Coaches can update local matches."
  on local_matches for update
  using ( true );
