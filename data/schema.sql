create table if not exists user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  skill_name text not null,
  proficiency text,
  years_experience numeric default 0,
  created_at timestamp with time zone default now()
);

alter table user_skills enable row level security;

create policy "Allow all access for user_skills (dev only)"
on user_skills
for all
using (true)
with check (true);