import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const FD_API_KEY = '69496527988c45de869d3b71017aff59';
const FD_BASE_URL = 'https://api.football-data.org/v4';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// We will fetch the 2026 season stats to get the most up-to-date data for leagues that have started!
const SEASON = '2026';

const LEAGUES = [
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'CL', name: 'Champions League' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'FL1', name: 'Ligue 1' }
];

async function syncLeagueStats(leagueCode, leagueName) {
  console.log(`\nFetching top scorers for ${leagueName} (Season ${SEASON})...`);
  
  try {
    const res = await fetch(`${FD_BASE_URL}/competitions/${leagueCode}/scorers?season=${SEASON}&limit=10`, {
      headers: { 'X-Auth-Token': FD_API_KEY }
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

async function runSync() {
  console.log('--- STARTING FOOTBALL-DATA.ORG PLAYER STATS SYNC ---');
  
  // 1. Fetch all records to insert
  let allRecords = [];
  for (const league of LEAGUES) {
    const records = await syncLeagueStats(league.code, league.name);
    allRecords = allRecords.concat(records);
  }

  if (allRecords.length === 0) {
    console.log('No stats found to insert.');
    return;
  }

  console.log(`\nInserting ${allRecords.length} total stat records into Supabase...`);

  // 2. Clear old stats (we just wipe and replace to keep it simple)
  console.log('Clearing old player_stats...');
  const { error: deleteError } = await supabase
    .from('player_stats')
    .delete()
    .not('id', 'is', null);

  if (deleteError) {
    console.error('Error clearing old stats:', deleteError);
    return;
  }

  // 3. Insert new stats
  const { error: insertError } = await supabase
    .from('player_stats')
    .insert(allRecords);

  if (insertError) {
    console.error('Error inserting new stats:', insertError);
  } else {
    console.log('✅ Successfully synced all player stats to Supabase!');
  }
}

runSync();
