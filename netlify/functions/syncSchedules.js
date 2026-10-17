import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const FD_TOKEN = '69496527988c45de869d3b71017aff59';



const TEAM_ID_MAP = {
  "Bournemouth": 35,
  "Arsenal": 42,
  "Aston Villa": 66,
  "Brentford": 55,
  "Brighton": 51,
  "Chelsea": 49,
  "Coventry": 1346,
  "Crystal Palace": 52,
  "Everton": 45,
  "Fulham": 36,
  "Hull": 64,
  "Ipswich Town": 57,
  "Leeds": 63,
  "Liverpool": 40,
  "Man City": 50,
  "Man United": 33,
  "Newcastle": 34,
  "Nottm Forest": 65,
  "Sunderland": 746,
  "Spurs": 47,
  "Real Madrid": 541,
  "Barcelona": 529,
  "Atletico Madrid": 530,
  "Real Sociedad": 548,
  "Athletic Club": 531,
  "Real Betis": 543,
  "Sevilla": 536,
  "Valencia": 532,
  "Villarreal": 533,
  "Alaves": 542,
  "Celta Vigo": 538,
  "Espanyol": 540,
  "Getafe": 546,
  "Osasuna": 79,
  "Rayo Vallecano": 728,
  "Bayern Munich": 157,
  "PSG": 85,
  "Inter Milan": 505,
  "Juventus": 496,
  "AC Milan": 489,
  "Real Madrid (UCL)": 541,
  "Man City (UCL)": 50,
  "Arsenal (UCL)": 42,
  "Liverpool (UCL)": 40,
  "Aston Villa (UCL)": 66,
  "Barcelona (UCL)": 529,
  "Atletico Madrid (UCL)": 530,
  "Bayer Leverkusen": 168,
  "RB Leipzig": 173,
  "B. Dortmund": 165,
  "Napoli": 492,
  "AS Roma": 497,
  "Porto": 503,
  "Benfica": 211,
  "Sporting CP": 228,
  "PSV": 197,
  "Feyenoord": 209,
  "Ajax": 194,
  "Club Brugge": 569,
  "Celtic": 99061,
  "Rangers": 99062,
  "Galatasaray": 645,
  "Fenerbahce": 99643,
  "Shakhtar": 550,
  "RB Salzburg": 571,
  "Monaco": 91,
  "Lille": 99079,
  "Malaga": 84,
  "Levante": 88,
  "Elche": 285,
  "Deportivo La Coruna": 560,
  "Racing Santander": 5335,
  "1. FC Köln": 1,
  "TSG 1899 Hoffenheim": 167,
  "Bayer 04 Leverkusen": 168,
  "Borussia Dortmund": 165,
  "FC Bayern München": 157,
  "FC Schalke 04": 6,
  "Hamburger SV": 7,
  "VfB Stuttgart": 172,
  "SV Werder Bremen": 162,
  "1. FSV Mainz 05": 164,
  "FC Augsburg": 170,
  "SC Freiburg": 160,
  "Borussia Mönchengladbach": 163,
  "Eintracht Frankfurt": 169,
  "1. FC Union Berlin": 182,
  "SC Paderborn 07": 29,
  "SV 07 Elversberg": 719,
  "ACF Fiorentina": 502,
  "Atalanta BC": 499,
  "Bologna FC 1909": 500,
  "Cagliari Calcio": 490,
  "Genoa CFC": 495,
  "FC Internazionale Milano": 505,
  "Juventus FC": 496,
  "SS Lazio": 487,
  "Parma Calcio 1913": 99112,
  "SSC Napoli": 492,
  "Udinese Calcio": 494,
  "Venezia FC": 517,
  "Frosinone Calcio": 470,
  "US Sassuolo Calcio": 471,
  "Torino FC": 99586,
  "US Lecce": 867,
  "AC Monza": 1579,
  "Como 1907": 895,
  "Toulouse FC": 96,
  "Stade Brestois 29": 106,
  "Olympique de Marseille": 99516,
  "AJ Auxerre": 99519,
  "Lille OSC": 99521,
  "OGC Nice": 99522,
  "Olympique Lyonnais": 523,
  "Paris Saint-Germain FC": 85,
  "FC Lorient": 525,
  "Stade Rennais FC 1901": 94,
  "ES Troyes AC": 110,
  "Angers SCO": 77,
  "Le Havre AC": 111,
  "Le Mans FC": 535,
  "Racing Club de Lens": 116,
  "AS Monaco FC": 91,
  "RC Strasbourg Alsace": 99576,
  "Paris FC": 1045
};
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
    return;
  }
  
  const data = await res.json();
  const matches = data.matches;
  
  const recordsToInsert = [];
  
  for (const match of matches) {
    // Skip cancelled matches
    if (match.status === 'CANCELLED') continue;
    const fdHomeName = match.homeTeam.name;
    const fdAwayName = match.awayTeam.name;
    
    const ourHomeName = TEAM_MAP[fdHomeName] || fdHomeName;
    const ourAwayName = TEAM_MAP[fdAwayName] || fdAwayName;
    
    const homeTeamLogo = match.homeTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
    const awayTeamLogo = match.awayTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
    
    const utcDate = new Date(match.utcDate);
    const matchDateStr = utcDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const matchTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5); // HH:MM
    
    let homeGoals = null;
    let awayGoals = null;
    
    if (['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status) && match.score && match.score.fullTime) {
      homeGoals = match.score.fullTime.home !== null ? match.score.fullTime.home : null;
      awayGoals = match.score.fullTime.away !== null ? match.score.fullTime.away : null;
    }
    
    recordsToInsert.push({
      league_id: leagueId,
      match_date: matchDateStr,
      match_time: matchTimeStr,
      home_team_id: TEAM_ID_MAP[ourHomeName] || match.homeTeam.id,
      home_team_name: ourHomeName,
      home_team_logo: homeTeamLogo,
      away_team_id: TEAM_ID_MAP[ourAwayName] || match.awayTeam.id,
      away_team_name: ourAwayName,
      away_team_logo: awayTeamLogo,
      home_goals: homeGoals,
      away_goals: awayGoals
    });
  }
  
  if (recordsToInsert.length > 0) {
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
    }
  }
}

let supabase;
export const handler = async (event, context) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing Supabase env vars" }) };
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
    try {
      const leagueParam = event.queryStringParameters && event.queryStringParameters.league;
      
      const ALL_LEAGUES = [
        { code: 'PL', id: 39, name: 'Premier League' },
        { code: 'PD', id: 140, name: 'La Liga' },
        { code: 'CL', id: 2, name: 'Champions League' },
        { code: 'BL1', id: 78, name: 'Bundesliga' },
        { code: 'SA', id: 135, name: 'Serie A' },
        { code: 'FL1', id: 61, name: 'Ligue 1' }
      ];

      const leaguesToSync = leagueParam 
        ? ALL_LEAGUES.filter(l => l.code === leagueParam || l.id.toString() === leagueParam)
        : ALL_LEAGUES;

      for (const league of leaguesToSync) {
        await syncFootballDataSchedules(league.code, league.id, league.name);
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Schedules sync successful" }) };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: "Function execution error" };
  }
};
