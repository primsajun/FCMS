import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PREDEFINED_TEAMS } from '../src/predefinedTeams.js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const FD_TOKEN = '69496527988c45de869d3b71017aff59';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEAM_MAP = {
  // Premier League
  'Arsenal FC': 'Arsenal',
  'Aston Villa FC': 'Aston Villa',
  'Chelsea FC': 'Chelsea',
  'Everton FC': 'Everton',
  'Fulham FC': 'Fulham',
  'Liverpool FC': 'Liverpool',
  'Manchester City FC': 'Man City',
  'Manchester United FC': 'Man United',
  'Newcastle United FC': 'Newcastle',
  'Sunderland AFC': 'Sunderland',
  'Tottenham Hotspur FC': 'Spurs',
  'Hull City AFC': 'Hull',
  'Leeds United FC': 'Leeds',
  'Ipswich Town FC': 'Ipswich Town',
  'Nottingham Forest FC': 'Nottm Forest',
  'Crystal Palace FC': 'Crystal Palace',
  'Brighton & Hove Albion FC': 'Brighton',
  'Brentford FC': 'Brentford',
  'AFC Bournemouth': 'Bournemouth',
  'Coventry City FC': 'Coventry',

  // La Liga
  'Athletic Club': 'Athletic Club',
  'Club Atlético de Madrid': 'Atletico Madrid',
  'CA Osasuna': 'Osasuna',
  'RCD Espanyol de Barcelona': 'Espanyol',
  'FC Barcelona': 'Barcelona',
  'Getafe CF': 'Getafe',
  'Málaga CF': 'Malaga',
  'Real Madrid CF': 'Real Madrid',
  'Rayo Vallecano de Madrid': 'Rayo Vallecano',
  'Levante UD': 'Levante',
  'Real Betis Balompié': 'Real Betis',
  'Real Sociedad de Fútbol': 'Real Sociedad',
  'Villarreal CF': 'Villarreal',
  'Valencia CF': 'Valencia',
  'Deportivo Alavés': 'Alaves',
  'Elche CF': 'Elche',
  'RC Celta de Vigo': 'Celta Vigo',
  'Sevilla FC': 'Sevilla',
  'RC Deportivo La Coruña': 'Deportivo La Coruna',
  'Real Racing Club de Santander': 'Racing Santander'
};

async function syncFootballDataSchedules(compCode, leagueId, leagueName) {
  console.log(`Fetching 2026 ${leagueName} schedules from Football-Data.org...`);
  
  const res = await fetch(`https://api.football-data.org/v4/competitions/${compCode}/matches?season=2026`, {
    headers: { 'X-Auth-Token': FD_TOKEN }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch from Football-Data.org:', res.status, res.statusText);
    process.exit(1);
  }
  
  const data = await res.json();
  const matches = data.matches;
  
  console.log(`Found ${matches.length} matches. Processing and mapping to API-Sports IDs...`);
  
  const recordsToInsert = [];
  
  for (const match of matches) {
    const fdHomeName = match.homeTeam.name;
    const fdAwayName = match.awayTeam.name;
    
    const ourHomeName = TEAM_MAP[fdHomeName] || fdHomeName;
    const ourAwayName = TEAM_MAP[fdAwayName] || fdAwayName;
    
    if (!ourHomeName || !ourAwayName) {
      console.warn(`WARNING: Could not map teams: ${fdHomeName} vs ${fdAwayName}`);
      continue;
    }
    
    const homeTeamDetails = PREDEFINED_TEAMS.find(t => t.team_name === ourHomeName) || { api_team_id: 0, team_logo: match.homeTeam.crest || 'https://media.api-sports.io/football/teams/0.png' };
    const awayTeamDetails = PREDEFINED_TEAMS.find(t => t.team_name === ourAwayName) || { api_team_id: 0, team_logo: match.awayTeam.crest || 'https://media.api-sports.io/football/teams/0.png' };
    
    const utcDate = new Date(match.utcDate);
    const matchDateStr = utcDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const matchTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5); // HH:MM
    
    let homeGoals = null;
    let awayGoals = null;
    
    if (match.status === 'FINISHED' && match.score && match.score.fullTime) {
      homeGoals = match.score.fullTime.home !== null ? match.score.fullTime.home : null;
      awayGoals = match.score.fullTime.away !== null ? match.score.fullTime.away : null;
    }
    
    recordsToInsert.push({
      league_id: leagueId,
      match_date: matchDateStr,
      match_time: matchTimeStr,
      home_team_id: homeTeamDetails.api_team_id, home_team_name: ourHomeName,
      home_team_logo: homeTeamDetails.team_logo,
      away_team_id: awayTeamDetails.api_team_id, away_team_name: ourAwayName,
      away_team_logo: awayTeamDetails.team_logo,
      home_goals: homeGoals,
      away_goals: awayGoals
    });
  }
  
  console.log(`Successfully mapped ${recordsToInsert.length} matches.`);
  
  if (recordsToInsert.length > 0) {
    console.log('Inserting into Supabase custom_fixtures table...');
    
    const { error: deleteError } = await supabase
      .from('custom_fixtures')
      .delete()
      .eq('league_id', leagueId);
      
    if (deleteError) {
      console.error('Error clearing old fixtures:', deleteError);
    }
    
    const { error: insertError } = await supabase
      .from('custom_fixtures')
      .insert(recordsToInsert);
      
    if (insertError) {
      console.error('Error inserting new fixtures:', insertError);
    } else {
      console.log(`✅ Successfully inserted all ${leagueName} fixtures into Supabase!`);
    }
  }
}

async function run() {
  await syncFootballDataSchedules('PL', 39, 'Premier League');
  await syncFootballDataSchedules('PD', 140, 'La Liga');
  await syncFootballDataSchedules('BL1', 78, 'Bundesliga');
  await syncFootballDataSchedules('SA', 135, 'Serie A');
  await syncFootballDataSchedules('FL1', 61, 'Ligue 1');
  await syncFootballDataSchedules('CL', 2, 'Champions League');
}

run();
