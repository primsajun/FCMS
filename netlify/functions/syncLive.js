import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const FD_TOKEN = '69496527988c45de869d3b71017aff59';


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

const LEAGUE_ID_MAP = {
  'PL': 39,
  'PD': 140,
  'CL': 2,
  'BL1': 78,
  'SA': 135,
  'FL1': 61
};

export const handler = async (event, context) => {
  let supabase;
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing Supabase env vars" }) };
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
  console.log('Fetching live scores from Football-Data.org...');
  
  try {
    const res = await fetch('https://api.football-data.org/v4/matches?status=IN_PLAY,PAUSED,LIVE', {
      headers: { 'X-Auth-Token': FD_TOKEN }
    });
    
    if (!res.ok) {
      console.error('Failed to fetch live scores:', res.status, res.statusText);
      return { statusCode: 200, body: 'Rate limited, skipping' };
    }
    
    const data = await res.json();
    const liveMatches = data.matches || [];
    
    console.log(`Found ${liveMatches.length} live matches.`);
    
    const filteredMatches = liveMatches.filter(m => LEAGUE_MAP[m.competition.code]);
    
    const recordsToInsert = [];
    
    for (const match of filteredMatches) {
      const fdHomeName = match.homeTeam.name;
      const fdAwayName = match.awayTeam.name;
      const leagueName = LEAGUE_MAP[match.competition.code];
      
      const ourHomeName = TEAM_MAP[fdHomeName] || fdHomeName;
      const ourAwayName = TEAM_MAP[fdAwayName] || fdAwayName;
      
      const homeLogo = match.homeTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
      const awayLogo = match.awayTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
      
      let elapsed = 1;
      if (match.status === 'PAUSED') elapsed = 45;
      else if (match.utcDate) {
        const startTime = new Date(match.utcDate).getTime();
        const now = new Date().getTime();
        const diffMins = Math.floor((now - startTime) / 60000);
        if (diffMins > 0 && diffMins <= 120) elapsed = diffMins;
      }
      
      recordsToInsert.push({
        api_fixture_id: match.id,
        league_id: LEAGUE_ID_MAP[match.competition.code],
        league_name: leagueName,
        elapsed: elapsed,
        home_team_name: ourHomeName,
        home_team_logo: homeLogo,
        home_goals: match.score.fullTime.home !== null ? match.score.fullTime.home : 0,
        away_goals: match.score.fullTime.away !== null ? match.score.fullTime.away : 0,
        away_team_name: ourAwayName,
        away_team_logo: awayLogo
      });
    }
    
    const { error: deleteError } = await supabase
      .from('live_fixtures')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) {
      console.error('Error clearing old live fixtures:', deleteError);
      return { statusCode: 500, body: 'DB Delete Error' };
    }
    
    if (recordsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('live_fixtures')
        .insert(recordsToInsert);
        
      if (insertError) {
        console.error('Error inserting new live fixtures:', insertError);
        return { statusCode: 500, body: 'DB Insert Error' };
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Live sync successful", count: recordsToInsert.length })
    };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: "Function execution error" };
  }
};
