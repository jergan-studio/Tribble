-- Run in Supabase Dashboard → SQL Editor.
create table if not exists public.tribble_projects (
  id text primary key,
  title text not null check (char_length(title) <= 80),
  sprites jsonb not null default '[]'::jsonb,
  blocks jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tribble_shares (
  id uuid primary key,
  mode text not null check (mode in ('game','project')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Vercel accesses both tables using the service-role key, only on the server.
alter table public.tribble_projects enable row level security;
alter table public.tribble_shares enable row level security;
