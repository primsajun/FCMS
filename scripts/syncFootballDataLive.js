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

const LEAGUE_MAP = {
  'PL': 'Premier League',
  'PD': 'La Liga',
  'CL': 'Champions League',
  'BL1': 'Bundesliga',
  'SA': 'Serie A',
  'FL1': 'Ligue 1'
};

async function syncFootballDataLive() {
  console.log('Fetching live scores from Football-Data.org...');
  
  // Fetch matches that are IN_PLAY or PAUSED (halftime)
  const res = await fetch('https://api.football-data.org/v4/matches?status=IN_PLAY,PAUSED', {
    headers: { 'X-Auth-Token': FD_TOKEN }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch live scores:', res.status, res.statusText);
    return;
  }
  
  const data = await res.json();
  const liveMatches = data.matches || [];
  
  console.log(`Found ${liveMatches.length} live matches.`);
  
  // We only want to sync matches for leagues we track (PL, PD, CL)
  const filteredMatches = liveMatches.filter(m => LEAGUE_MAP[m.competition.code]);
  
  console.log(`Filtering to tracked leagues... ${filteredMatches.length} matches remain.`);
  
  const recordsToInsert = [];
  
  for (const match of filteredMatches) {
    const fdHomeName = match.homeTeam.name;
    const fdAwayName = match.awayTeam.name;
    const leagueName = LEAGUE_MAP[match.competition.code];
    
    // Fallback to the raw name if we haven't mapped it
    const ourHomeName = TEAM_MAP[fdHomeName] || fdHomeName;
    const ourAwayName = TEAM_MAP[fdAwayName] || fdAwayName;
    
    const homeTeamDetails = PREDEFINED_TEAMS.find(t => t.team_name === ourHomeName) || { api_team_id: 0, team_logo: match.homeTeam.crest || 'https://media.api-sports.io/football/teams/0.png' };
    const awayTeamDetails = PREDEFINED_TEAMS.find(t => t.team_name === ourAwayName) || { api_team_id: 0, team_logo: match.awayTeam.crest || 'https://media.api-sports.io/football/teams/0.png' };
    
    // Calculate elapsed time (rough estimate using start date since FD API doesn't always provide precise minute)
    let elapsed = 'Live';
    if (match.status === 'PAUSED') elapsed = 'HT';
    else if (match.utcDate) {
      const startTime = new Date(match.utcDate).getTime();
      const now = new Date().getTime();
      const diffMins = Math.floor((now - startTime) / 60000);
      if (diffMins > 0 && diffMins <= 120) elapsed = diffMins.toString();
    }
    
    recordsToInsert.push({
      league_name: leagueName,
      elapsed: elapsed,
      home_team_name: ourHomeName,
      home_team_logo: homeTeamDetails.team_logo,
      home_goals: match.score.fullTime.home !== null ? match.score.fullTime.home : 0,
      away_goals: match.score.fullTime.away !== null ? match.score.fullTime.away : 0,
      away_team_name: ourAwayName,
      away_team_logo: awayTeamDetails.team_logo
    });
  }
  
  // Update Supabase
  console.log('Clearing old live_fixtures and inserting new ones...');
  
  // First, delete all existing live fixtures so we have a fresh slate
  const { error: deleteError } = await supabase
    .from('live_fixtures')
    .delete()
    .not('id', 'is', null);
    
    
  if (deleteError) {
    console.error('Error clearing old live fixtures:', deleteError);
  }
  
  if (recordsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('live_fixtures')
      .insert(recordsToInsert);
      
    if (insertError) {
      console.error('Error inserting new live fixtures:', insertError);
    } else {
      console.log('✅ Successfully updated live scores in Supabase!');
    }
  } else {
    console.log('No live matches to insert at this moment.');
  }
}

syncFootballDataLive();
