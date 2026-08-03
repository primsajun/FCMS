import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const API_SPORTS_KEY = process.env.VITE_API_SPORTS_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_SPORTS_KEY) {
  console.error("Missing environment variables. Please check your .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to fetch from API-Sports
async function fetchApiSports(endpoint) {
  const response = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
    headers: { 'x-apisports-key': API_SPORTS_KEY }
  });
  return response.json();
}

async function syncStandings() {
  console.log("Fetching standings...");
  const leagues = [39, 140, 2]; // PL, LaLiga, UCL
  
  for (const leagueId of leagues) {
    const data = await fetchApiSports(`/standings?season=2024&league=${leagueId}`);
    if (data.response && data.response.length > 0) {
      const standings = data.response[0].league.standings[0];
      
      console.log(`Syncing ${standings.length} teams for League ${leagueId}...`);
      
      for (const row of standings) {
        // Upsert into Supabase (if we had a unique constraint on api_team_id + league_id, upsert would be easier.
        // For simplicity, we'll just delete existing for this league and insert new).
      }
      
      // Delete old standings for this league
      await supabase.from('custom_standings').delete().eq('league_id', leagueId);
      
      // Insert new standings
      const insertData = standings.map(row => ({
        league_id: leagueId,
        api_team_id: row.team.id,
        rank: row.rank,
        team_name: row.team.name,
        team_logo: row.team.logo,
        played: row.all.played,
        win: row.all.win,
        draw: row.all.draw,
        lose: row.all.lose,
        goals_diff: row.goalsDiff,
        points: row.points,
        // custom_points: row.points // We can set this initially to equal real points
      }));
      
      const { error } = await supabase.from('custom_standings').insert(insertData);
      if (error) console.error(`Error inserting standings for league ${leagueId}:`, error);
    }
  }
  console.log("Standings sync complete.");
}

async function syncLiveFixtures() {
  console.log("Fetching live fixtures...");
  const data = await fetchApiSports(`/fixtures?live=all`);
  const allLive = data.response || [];
  
  // Filter for our preferred leagues (or just sync all and let frontend filter)
  const preferredIds = [39, 140, 2];
  const matchesToSync = allLive.filter(m => preferredIds.includes(m.league.id));
  
  // Clear old live fixtures
  await supabase.from('live_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  
  if (matchesToSync.length > 0) {
    console.log(`Syncing ${matchesToSync.length} live matches...`);
    
    const insertData = matchesToSync.map(match => ({
      api_fixture_id: match.fixture.id,
      league_id: match.league.id,
      league_name: match.league.name,
      status: match.fixture.status.short,
      elapsed: match.fixture.status.elapsed,
      home_team_name: match.teams.home.name,
      home_team_logo: match.teams.home.logo,
      away_team_name: match.teams.away.name,
      away_team_logo: match.teams.away.logo,
      home_goals: match.goals.home,
      away_goals: match.goals.away,
      home_winner: match.teams.home.winner,
      away_winner: match.teams.away.winner
    }));
    
    const { error } = await supabase.from('live_fixtures').insert(insertData);
    if (error) console.error("Error inserting live fixtures:", error);
  } else {
    console.log("No live matches to sync for top leagues.");
  }
}

async function run() {
  await syncStandings();
  await syncLiveFixtures();
  console.log("Sync process finished.");
}

run();
