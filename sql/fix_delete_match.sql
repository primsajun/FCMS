-- Run this script in your Supabase SQL Editor to allow matches to be deleted

create policy "Admins can delete local matches."
  on local_matches for delete
  using ( true );
