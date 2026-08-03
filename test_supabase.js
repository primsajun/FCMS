import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rdnknccsktshnnucmsej.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmtuY2Nza3RzaG5udWNtc2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzgyNTksImV4cCI6MjEwMTE1NDI1OX0.gXGadWsEOqEXIwXeDOR_p8bT8jIcb8MaYkk38f1vmwM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing Select...');
  const { data, error } = await supabase.from('custom_standings').select('*');
  console.log('Select Data:', data);
  console.log('Select Error:', error);

  console.log('\nTesting Insert...');
  const { data: iData, error: iError } = await supabase.from('custom_standings').insert({
    league_id: 999,
    api_team_id: 999,
    team_name: 'Test Team',
    rank: 1
  }).select();
  console.log('Insert Data:', iData);
  console.log('Insert Error:', iError);
}

run();
