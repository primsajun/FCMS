CREATE TABLE custom_fixtures (
  id uuid default uuid_generate_v4() primary key,
  league_id int not null,
  home_team_id int not null,
  home_team_name text not null,
  home_team_logo text,
  away_team_id int not null,
  away_team_name text not null,
  away_team_logo text,
  match_date date not null,
  match_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn off RLS so the admin dashboard can insert freely with the anon key
ALTER TABLE custom_fixtures DISABLE ROW LEVEL SECURITY;
