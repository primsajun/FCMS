import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PREDEFINED_TEAMS } from '../src/predefinedTeams.js';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const API_SPORTS_KEY = process.env.VITE_API_SPORTS_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_SPORTS_KEY) {
  console.error("Missing environment variables. Please check your .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to fetch from API-Sports
async function fetchApiSports(endpoint) {
  const response = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_SPORTS_KEY,
    }
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      console.warn("API Rate Limit Hit! Pausing for 60 seconds...");
      await delay(60000); // Wait a full minute if rate limited
      return fetchApiSports(endpoint); // Retry
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function syncTeamDetails() {
  console.log('Starting full Team Details sync from API-Sports to Supabase...\n');

  // Find out which teams are already synced
  const { data: existingTeams } = await supabase.from('team_details').select('api_team_id');
  const existingIds = new Set(existingTeams?.map(t => t.api_team_id) || []);

  const TEAMS_TO_SYNC = PREDEFINED_TEAMS.map(t => t.api_team_id).filter(id => !existingIds.has(id));

  console.log(`Found ${PREDEFINED_TEAMS.length} total teams. ${existingIds.size} already synced.`);
  console.log(`${TEAMS_TO_SYNC.length} teams left to sync.`);

  if (TEAMS_TO_SYNC.length === 0) {
    console.log("All teams are already synced! Exiting.");
    return;
  }

  for (const teamId of TEAMS_TO_SYNC) {
    try {
      console.log(`\nFetching data for team ID: ${teamId}...`);
      
      // 1. Fetch Team & Venue Info
      const teamRes = await fetchApiSports(`/teams?id=${teamId}`);
      const teamData = teamRes.response[0];
      if (!teamData) {
        console.warn(`No team data found for ID ${teamId}`);
        continue;
      }
      
      // Wait to respect rate limits
      await delay(1500);

      // 2. Fetch Coach Info
      const coachRes = await fetchApiSports(`/coachs?team=${teamId}`);
      let coachName = "Unknown Coach";
      let coachPhoto = "";
      if (coachRes.response && coachRes.response.length > 0) {
        // Find current coach
        const currentCoach = coachRes.response.find(c => c.career && c.career.length > 0 && c.career[0].end === null) || coachRes.response[0];
        coachName = currentCoach.name;
        coachPhoto = currentCoach.photo;
      }

      await delay(1500);

      // 3. Fetch Squad Info
      const squadRes = await fetchApiSports(`/players/squads?team=${teamId}`);
      let squad = [];
      if (squadRes.response && squadRes.response.length > 0 && squadRes.response[0].players) {
        squad = squadRes.response[0].players.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          number: p.number,
          position: p.position,
          photo: p.photo
        }));
      }

      await delay(3000); // Wait longer before next team

      // 4. Upsert into Supabase
      const record = {
        api_team_id: teamId,
        name: teamData.team.name,
        country: teamData.team.country,
        founded: teamData.team.founded,
        logo: teamData.team.logo,
        venue_name: teamData.venue.name,
        venue_city: teamData.venue.city,
        venue_capacity: teamData.venue.capacity,
        venue_image: teamData.venue.image,
        coach_name: coachName,
        coach_photo: coachPhoto,
        squad: squad,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('team_details')
        .upsert(record, { onConflict: 'api_team_id' });

      if (error) {
        console.error(`Error saving team ${teamId} to Supabase:`, error);
      } else {
        console.log(`✅ Successfully synced ${teamData.team.name} (${squad.length} players)`);
      }

    } catch (err) {
      console.error(`Failed to process team ${teamId}:`, err);
    }
  }

  console.log('\nSync completed.');
}

syncTeamDetails();
