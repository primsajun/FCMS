import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PREDEFINED_TEAMS } from '../src/predefinedTeams.js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const FD_TOKEN = process.env.VITE_FOOTBALL_DATA_TOKEN || '69496527988c45de869d3b71017aff59';

if (!SUPABASE_URL || !SUPABASE_KEY || !FD_TOKEN) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const delay = ms => new Promise(res => setTimeout(res, ms));

function calculateAge(dob) {
  if (!dob) return null;
  const diff_ms = Date.now() - new Date(dob).getTime();
  const age_dt = new Date(diff_ms); 
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

async function syncTeamDetails() {
  console.log('Starting full Team Details sync from Football-Data.org...');

  const { data: existingTeams } = await supabase.from('team_details').select('api_team_id');
  const existingIds = new Set(existingTeams?.map(t => t.api_team_id) || []);
  const TEAMS_TO_SYNC = PREDEFINED_TEAMS.map(t => t.api_team_id).filter(id => !existingIds.has(id));

  console.log('Found ' + PREDEFINED_TEAMS.length + ' total teams. ' + existingIds.size + ' already synced.');
  if (TEAMS_TO_SYNC.length === 0) return;

  for (const teamId of TEAMS_TO_SYNC) {
    try {
      const res = await fetch('https://api.football-data.org/v4/teams/' + teamId, { headers: { 'X-Auth-Token': FD_TOKEN } });
      if (res.status === 429) {
        console.warn('Rate Limit Hit! Pausing 60s...');
        await delay(60000);
        continue;
      }
      if (!res.ok) continue;

      const teamData = await res.json();
      let coachName = 'Unknown Coach';
      if (teamData.coach && teamData.coach.name) coachName = teamData.coach.name;

      let squad = [];
      if (teamData.squad && teamData.squad.length > 0) {
        squad = teamData.squad.map(p => ({
          id: p.id,
          name: p.name,
          age: calculateAge(p.dateOfBirth),
          number: null,
          position: p.position,
          photo: null
        }));
      }

      const record = {
        api_team_id: teamId,
        name: teamData.name,
        country: teamData.area?.name || '',
        founded: teamData.founded,
        logo: teamData.crest,
        venue_name: teamData.venue,
        venue_city: teamData.address,
        venue_capacity: null,
        venue_image: null,
        coach_name: coachName,
        coach_photo: null,
        squad: squad,
        updated_at: new Date().toISOString()
      };

      await supabase.from('team_details').upsert(record, { onConflict: 'api_team_id' });
      console.log('Synced ' + teamData.name + ' (' + squad.length + ' players)');
      await delay(6100); 
    } catch (err) {
      console.error('Failed to process team ' + teamId + ':', err);
    }
  }
}
syncTeamDetails();

