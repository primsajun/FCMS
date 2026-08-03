-- Create a table for audit logs
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  team_name text not null,
  action_type text not null,
  description text not null,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.audit_logs enable row level security;

-- Audit Logs Policies
create policy "Audit logs are viewable by everyone."
  on audit_logs for select
  using ( true );

create policy "Coaches can insert audit logs."
  on audit_logs for insert
  with check ( true );

create policy "Admins can delete audit logs."
  on audit_logs for delete
  using ( true );
