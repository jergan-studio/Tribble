# Tribble

**Tribble** is Jergan Studio's browser-based 2D game creator. Build games with visual PESC blocks, sprites, and a live canvas preview.

## Stack

- Static HTML, CSS, and JavaScript frontend
- Blockly visual editor with Tribble/Eclipse-style blocks
- HTML5 Canvas preview
- Vercel serverless project API
- Supabase PostgreSQL for cloud project storage

## Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com/).
2. In the Supabase dashboard, open **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` in this repository, copy its contents into the SQL Editor, and run it. This creates the `tribble_projects` table.
4. Open **Project Settings** → **API** (or **API Keys**) and copy:
   - The project URL
   - The `service_role` secret key. Treat it like a password.

## Deploy to Vercel

1. Import `jergan-studio/Tribble` into Vercel.
2. Keep the project root at the repository root. No build command is required.
3. In Vercel Project Settings → Environment Variables, add:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service-role secret key
4. Redeploy the Vercel project after adding the variables.

**Security:** Never put the service-role key in `index.html`, `app.js`, or any other frontend file. Never commit it to GitHub. The key belongs only in Vercel's server-side environment variables. The database has Row Level Security enabled; the server API uses the secret key. Before opening Tribble to public users, add authentication, per-user project ownership, and API rate limiting.

Supabase's Free plan currently includes two active projects and 500 MB of database storage per project. Free projects may pause after one week of inactivity. Check [Supabase pricing](https://supabase.com/pricing) for current limits.

## Current MVP

- Visual Blockly workspace
- PESC generated code view
- Add, select, edit, and delete sprites
- Import image sprites (PNG, JPG, GIF, and other browser-supported image formats; 1.5 MB per image)
- Canvas stage preview
- Run basic movement, positioning, message, and color blocks
- Save projects to Supabase when configured
- Local browser fallback

## Important next steps

Add account authentication and per-user project ownership before opening cloud project storage to a public community. Expand PESC commands and connect the PESC runtime to the wider Eclipse toolchain as its API is finalized.


## PESC (Partial Eclipse)

Tribble uses **PESC**, a compact game-focused subset of Eclipse with Scratch-inspired visual commands. Projects can export generated scripts as `.pesc` files. The starter command set includes game-start events, keyboard events, sprite movement and positioning, turns, x/y changes, messages, visibility, color changes, waits, repeats, conditionals, and math/logic blocks. PESC is a Tribble subset; it is not the full Eclipse language or the existing `.esc` runtime.

## Tribble Hub

The Hub is the landing screen for creating a new game and reopening recent local projects. The editor and full project list remain available from the workspace navigation.
