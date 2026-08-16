const fs = require('fs');
require('dotenv').config();

const API_SPORTS_KEY = process.env.VITE_API_SPORTS_KEY;

async function fetchTeams(leagueId) {
  const response = await fetch('https://v3.football.api-sports.io/teams?league=' + leagueId + '&season=2026', {
    headers: { 'x-apisports-key': API_SPORTS_KEY }
  });
  if (response.status === 429) {
     console.log('Rate limit! Waiting 60s...');
     await new Promise(r => setTimeout(r, 60000));
     return fetchTeams(leagueId);
  }
  const data = await response.json();
  if (data.response && data.response.length > 0) return data.response;
  
  const res24 = await fetch('https://v3.football.api-sports.io/teams?league=' + leagueId + '&season=2024', {
    headers: { 'x-apisports-key': API_SPORTS_KEY }
  });
  const data24 = await res24.json();
  return data24.response;
}

async function mapTeams() {
  const bundesliga = await fetchTeams(78);
  const serieA = await fetchTeams(135);
  const ligue1 = await fetchTeams(61);
  
  const allTeams = [...bundesliga, ...serieA, ...ligue1];
  
  const code = fs.readFileSync('src/predefinedTeams.js', 'utf8');
  const lines = code.split('\n');
  let newCode = '';
  let updatedCount = 0;
  
  for (const line of lines) {
    if ((line.includes('league_id: 78') || line.includes('league_id: 135') || line.includes('league_id: 61')) && line.includes('api_team_id')) {
      const nameMatch = line.match(/team_name:\s*'([^']+)'/);
      if (nameMatch) {
        let teamName = nameMatch[1].toLowerCase().replace('1. ', '').replace(' fc', '').replace('cf', '').trim();
        
        let bestMatch = allTeams.find(t => t.team.name.toLowerCase().includes(teamName) || teamName.includes(t.team.name.toLowerCase()));
        
        if (!bestMatch) {
             bestMatch = allTeams.find(t => t.team.name.toLowerCase().substring(0, 5) === teamName.substring(0, 5));
        }
        
        if (bestMatch) {
          const oldIdMatch = line.match(/api_team_id:\s*(\d+)/);
          if (oldIdMatch) {
            newCode += line.replace('api_team_id: ' + oldIdMatch[1], 'api_team_id: ' + bestMatch.team.id) + '\n';
            updatedCount++;
            continue;
          }
        } else {
            console.log('NO MATCH FOUND FOR:', nameMatch[1]);
        }
      }
    }
    newCode += line + '\n';
  }
  
  fs.writeFileSync('src/predefinedTeams.js', newCode);
  console.log('Updated ' + updatedCount + ' teams with API-Sports IDs!');
}
mapTeams();

