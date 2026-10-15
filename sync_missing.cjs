require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FD_TOKEN = '69496527988c45de869d3b71017aff59';

const TEAM_MAP = {
  // Serie A
  'Juventus FC': 'Juventus', 'AC Milan': 'AC Milan', 'FC Internazionale Milano': 'Inter Milan', 'AS Roma': 'AS Roma', 'SSC Napoli': 'Napoli', 'SS Lazio': 'Lazio', 'ACF Fiorentina': 'Fiorentina', 'Atalanta BC': 'Atalanta', 'Torino FC': 'Torino', 'US Sassuolo Calcio': 'Sassuolo', 'Bologna FC 1909': 'Bologna', 'Udinese Calcio': 'Udinese', 'Hellas Verona FC': 'Hellas Verona', 'Empoli FC': 'Empoli', 'US Salernitana 1919': 'Salernitana', 'US Lecce': 'Lecce', 'Frosinone Calcio': 'Frosinone', 'Genoa CFC': 'Genoa', 'Cagliari Calcio': 'Cagliari', 'AC Monza': 'Monza',
  // Ligue 1
  'Paris Saint-Germain FC': 'PSG', 'Olympique de Marseille': 'Marseille', 'Olympique Lyonnais': 'Lyon', 'AS Monaco FC': 'Monaco', 'Lille OSC': 'Lille', 'Stade Rennais FC 1901': 'Rennes', 'RC Lens': 'Lens', 'OGC Nice': 'Nice', 'Stade de Reims': 'Reims', 'RC Strasbourg Alsace': 'Strasbourg', 'Montpellier HSC': 'Montpellier', 'Toulouse FC': 'Toulouse', 'FC Nantes': 'Nantes', 'Le Havre AC': 'Le Havre', 'FC Metz': 'Metz', 'Clermont Foot 63': 'Clermont Foot', 'FC Lorient': 'Lorient', 'Stade Brestois 29': 'Brest'
};

async function syncLeague(compCode, leagueId, leagueName) {
  console.log('Fetching', leagueName);
  const res = await fetch(`https://api.football-data.org/v4/competitions/${compCode}/matches?season=2026`, { headers: { 'X-Auth-Token': FD_TOKEN } });
  if (!res.ok) { console.error('Failed', res.status); return; }
  const data = await res.json();
  const matches = data.matches;
  const recordsToInsert = [];
  for (const match of matches) {
    if (match.status === 'CANCELLED') continue;
    const fdHomeName = match.homeTeam.name;
    const fdAwayName = match.awayTeam.name;
    const ourHomeName = TEAM_MAP[fdHomeName] || fdHomeName;
    const ourAwayName = TEAM_MAP[fdAwayName] || fdAwayName;
    const homeTeamLogo = match.homeTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
    const awayTeamLogo = match.awayTeam.crest || 'https://media.api-sports.io/football/teams/0.png';
    const utcDate = new Date(match.utcDate);
    const matchDateStr = utcDate.toISOString().split('T')[0];
    const matchTimeStr = utcDate.toISOString().split('T')[1].substring(0, 5);
    let homeGoals = null, awayGoals = null;
    if (match.status === 'FINISHED' && match.score && match.score.fullTime) {
      homeGoals = match.score.fullTime.home !== null ? match.score.fullTime.home : null;
      awayGoals = match.score.fullTime.away !== null ? match.score.fullTime.away : null;
    }
    recordsToInsert.push({
      league_id: leagueId, match_date: matchDateStr, match_time: matchTimeStr,
      home_team_id: match.homeTeam.id, home_team_name: ourHomeName, home_team_logo: homeTeamLogo,
      away_team_id: match.awayTeam.id, away_team_name: ourAwayName, away_team_logo: awayTeamLogo,
      home_goals: homeGoals, away_goals: awayGoals
    });
  }
  if (recordsToInsert.length > 0) {
    await supabase.from('custom_fixtures').delete().eq('league_id', leagueId);
    const { error } = await supabase.from('custom_fixtures').insert(recordsToInsert);
    if (error) console.error('Insert error', error);
    else console.log('Successfully synced', leagueName);
  }
}

async function run() {
  await syncLeague('SA', 135, 'Serie A');
  await new Promise(r => setTimeout(r, 6000));
  await syncLeague('FL1', 61, 'Ligue 1');
}
run();
