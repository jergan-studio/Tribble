-- Run this once in Supabase Dashboard → SQL Editor.
create table if not exists public.tribble_projects (
  id text primary key,
  title text not null check (char_length(title) <= 80),
  sprites jsonb not null default '[]'::jsonb,
  blocks jsonb,
  updated_at timestamptz not null default now()
);

-- The Vercel API uses the secret service-role key server-side.
-- Keep RLS enabled and do not add public read/write policies.
alter table public.tribble_projects enable row level security;
