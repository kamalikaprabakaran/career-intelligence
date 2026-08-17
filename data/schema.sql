-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> Run

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  education text,
  target_role text,
  experience text,
  created_at timestamp with time zone default now()
);

-- Optional but recommended: enable Row Level Security.
-- For now (Phase 1 testing) we allow all access via the API key.
-- We will tighten this once auth (Phase 3) is built.
alter table users enable row level security;

create policy "Allow all access for now (dev only)"
on users
for all
using (true)
with check (true);