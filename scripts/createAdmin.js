import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createSuperAdmin() {
  const email = "primsajun24@gmail.com";
  const password = "sajunsajun2004";

  console.log(`Attempting to create super admin: ${email}...`);

  try {
    // 1. Try to log in first (if user already exists)
    let userId;
    let authData;
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        console.log("User not found or invalid credentials. Attempting sign up...");
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        authData = signUpData;
        userId = signUpData.user.id;
      } else {
        throw loginError;
      }
    } else {
      authData = loginData;
      userId = loginData.user.id;
    }

    if (!userId) {
      throw new Error("Could not get User ID.");
    }

    console.log(`User Auth successful. ID: ${userId}`);

    // 2. Upsert profile as super_admin
    const session = authData?.session || (await supabase.auth.getSession()).data.session;
    
    if (!session?.access_token) {
      throw new Error("Could not retrieve access token for the user.");
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: userId,
        role: 'super_admin',
        name: 'Super Admin',
        email: email,
        team_name: 'System',
        approval_status: 'approved'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upsert profile: ${errorText}`);
    }

    console.log(`\nSUCCESS! 🎉`);
    console.log(`The account ${email} is now fully registered and set as a 'super_admin'.`);
    console.log(`You can now log in with this account in the app to access the Admin Dashboard!`);

  } catch (err) {
    console.error("Error creating super admin:", err.message);
  }
}

createSuperAdmin();
