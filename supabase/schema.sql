-- Run in Supabase SQL Editor. Existing Tribble projects table remains unchanged.
create table if not exists public.tribble_shares (
  id uuid primary key,
  mode text not null check (mode in ('game','project')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.tribble_shares enable row level security;
-- Access is through the Vercel API using the service-role key. Do not expose that key.
