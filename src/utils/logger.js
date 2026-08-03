import { supabase } from '../supabaseClient';

export const logAction = async (team_name, action_type, description, created_by) => {
  try {
    await supabase.from('audit_logs').insert({
      team_name,
      action_type,
      description,
      created_by
    });
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
};
