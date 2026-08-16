import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

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

async function syncFootballDataStandings(compCode, leagueId, leagueName) {
  console.log(`Fetching 2026 ${leagueName} standings from Football-Data.org...`);
  
  const res = await fetch(`https://api.football-data.org/v4/competitions/${compCode}/standings?season=2026`, {
    headers: { 'X-Auth-Token': FD_TOKEN }
  });
  
  if (!res.ok) {
    console.error(`Failed to fetch ${leagueName} standings:`, res.status, res.statusText);
    return;
  }
  
  const data = await res.json();
  
  const standingsInfo = data.standings && data.standings.find(s => s.type === 'TOTAL');
  if (!standingsInfo || !standingsInfo.table) {
    console.error(`No TOTAL standings table found for ${leagueName}`);
    return;
  }
  
  const table = standingsInfo.table;
  const recordsToInsert = [];
  
  for (const row of table) {
    const fdName = row.team.name;
    const ourName = TEAM_MAP[fdName] || fdName;
    const teamLogo = row.team.crest || 'https://media.api-sports.io/football/teams/0.png';
    
    recordsToInsert.push({
      league_id: leagueId,
      api_team_id: row.team.id,
      rank: row.position,
      team_name: ourName,
      team_logo: teamLogo,
      played: row.playedGames,
      win: row.won,
      draw: row.draw,
      lose: row.lost,
      goals_diff: row.goalDifference,
      points: row.points,
      last_updated: new Date().toISOString()
    });
  }
  
  if (recordsToInsert.length > 0) {
    const { error: deleteError } = await supabase
      .from('custom_standings')
      .delete()
      .eq('league_id', leagueId);
      
    if (deleteError) {
      console.error(`Error clearing old standings for ${leagueName}:`, deleteError);
    }
    
    const { error: insertError } = await supabase
      .from('custom_standings')
      .insert(recordsToInsert);
      
    if (insertError) {
      console.error(`Error inserting new standings for ${leagueName}:`, insertError);
    }
  }
}

export const handler = async (event, context) => {
  try {
    await syncFootballDataStandings('PL', 39, 'Premier League');
    await syncFootballDataStandings('PD', 140, 'La Liga');
    return { statusCode: 200, body: JSON.stringify({ message: "Standings sync successful" }) };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: "Function execution error" };
  }
};
