import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rdnknccsktshnnucmsej.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmtuY2Nza3RzaG5udWNtc2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzgyNTksImV4cCI6MjEwMTE1NDI1OX0.gXGadWsEOqEXIwXeDOR_p8bT8jIcb8MaYkk38f1vmwM'
);

async function run() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'primsajun24@gmail.com',
    password: 'sajunsajun1234',
  });
  
  if (signInError) {
    console.log('SignIn Error:', signInError.message);
    return;
  }
  
  const user = signInData.user;
  console.log('User ID:', user.id);

  // Check if profile exists
  const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!existingProfile) {
    console.log('Profile does not exist. Inserting...');
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      name: 'Super Admin',
      email: 'primsajun24@gmail.com',
      role: 'super_admin',
      approval_status: 'approved'
    });
    
    if (insertError) {
      console.error('Insert Error:', insertError.message);
    } else {
      console.log('Inserted profile successfully!');
    }
  } else {
    console.log('Profile exists, updating role...');
    const { error: updateError } = await supabase.from('profiles').update({ role: 'super_admin', approval_status: 'approved' }).eq('id', user.id);
    if (updateError) {
      console.error('Update Error:', updateError.message);
    } else {
      console.log('Updated profile successfully!');
    }
  }
}

run();
