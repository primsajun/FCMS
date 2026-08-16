import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const FD_TOKEN = '69496527988c45de869d3b71017aff59';


const SEASON = '2026';

const LEAGUES = [
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'CL', name: 'Champions League' }
];

async function syncLeagueStats(leagueCode, leagueName) {
  console.log(`\nFetching top scorers for ${leagueName} (Season ${SEASON})...`);
  
  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/scorers?season=${SEASON}&limit=10`, {
      headers: { 'X-Auth-Token': FD_TOKEN }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch ${leagueName} stats: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const scorers = data.scorers || [];
    console.log(`Found ${scorers.length} top players in ${leagueName}.`);

    const recordsToInsert = [];

    scorers.forEach(scorerData => {
      const playerName = scorerData.player.name;
      const goals = scorerData.goals || 0;
      const assists = scorerData.assists || 0;

      if (goals > 0) {
        recordsToInsert.push({
          league: leagueName,
          stat_type: 'goals',
          player_name: playerName,
          stat_value: goals
        });
      }

      if (assists > 0) {
        recordsToInsert.push({
          league: leagueName,
          stat_type: 'assists',
          player_name: playerName,
          stat_value: assists
        });
      }
    });

    return recordsToInsert;

  } catch (err) {
    console.error(`Error fetching ${leagueName} stats:`, err);
    return [];
  }
}

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
  console.log('--- STARTING FOOTBALL-DATA.ORG PLAYER STATS SYNC ---');
  
  try {
    let allRecords = [];
    for (const league of LEAGUES) {
      const records = await syncLeagueStats(league.code, league.name);
      allRecords = allRecords.concat(records);
    }

    if (allRecords.length === 0) {
      console.log('No stats found to insert.');
      return { statusCode: 200, body: JSON.stringify({ message: "No stats found" }) };
    }

    console.log(`\nInserting ${allRecords.length} total stat records into Supabase...`);

    const { error: deleteError } = await supabase
      .from('player_stats')
      .delete()
      .not('id', 'is', null);

    if (deleteError) {
      console.error('Error clearing old stats:', deleteError);
      return { statusCode: 500, body: 'Error clearing stats' };
    }

    const { error: insertError } = await supabase
      .from('player_stats')
      .insert(allRecords);

    if (insertError) {
      console.error('Error inserting new stats:', insertError);
      return { statusCode: 500, body: 'Error inserting stats' };
    }

    console.log('✅ Successfully synced all player stats to Supabase!');
    return { statusCode: 200, body: JSON.stringify({ message: "Stats sync successful", count: allRecords.length }) };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: "Function execution error" };
  }
};
