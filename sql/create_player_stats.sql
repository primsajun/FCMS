-- Create the league_player_stats table
CREATE TABLE IF NOT EXISTS public.league_player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league TEXT NOT NULL, -- e.g., 'Premier League', 'La Liga', 'Champions League'
    stat_type TEXT NOT NULL, -- 'goals' or 'assists'
    player_name TEXT NOT NULL,
    stat_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.league_player_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the stats
CREATE POLICY "Allow public read access to league_player_stats" ON public.league_player_stats
    FOR SELECT USING (true);

-- Allow authenticated users (super admin) to insert/update/delete
CREATE POLICY "Allow authenticated users to insert league_player_stats" ON public.league_player_stats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update league_player_stats" ON public.league_player_stats
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete league_player_stats" ON public.league_player_stats
    FOR DELETE USING (auth.role() = 'authenticated');
