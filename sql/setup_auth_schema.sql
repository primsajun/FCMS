-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  role text not null check (role in ('coach', 'player', 'super_admin')),
  name text not null,
  email text not null,
  mobile text,
  age integer,
  country text,
  position text,
  team_name text not null,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for custom teams
create table if not exists public.custom_teams (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  coach_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.custom_teams enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Admins and coaches can update profiles"
  on profiles for update
  using ( true );

-- Custom Teams Policies
create policy "Custom teams are viewable by everyone."
  on custom_teams for select
  using ( true );

create policy "Coaches can insert custom teams."
  on custom_teams for insert
  with check ( true );
