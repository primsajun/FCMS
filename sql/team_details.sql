-- Table for Team Details
CREATE TABLE IF NOT EXISTS public.team_details (
    api_team_id INT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    founded INT,
    logo TEXT,
    venue_name TEXT,
    venue_city TEXT,
    venue_capacity INT,
    venue_image TEXT,
    coach_name TEXT,
    coach_photo TEXT,
    squad JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable Row Level Security so anyone can read/write (for development)
ALTER TABLE public.team_details DISABLE ROW LEVEL SECURITY;
