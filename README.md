# Tribble

**Tribble** is Jergan Studio's browser-based 2D game creator. Build games with visual Eclipse blocks, sprites, and a live canvas preview.

## Stack

- Static HTML, CSS, and JavaScript frontend
- Blockly visual editor with Tribble/Eclipse-style blocks
- HTML5 Canvas preview
- Vercel serverless project API
- Upstash Redis for cloud project storage

## Deploy to Vercel

1. Import `jergan-studio/Tribble` into Vercel.
2. Keep the project root at the repository root. No build command is required.
3. Add these Environment Variables in Vercel Project Settings → Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Redeploy after adding the variables.

Create a Redis database in Upstash and copy its REST URL and REST token. Never put the token in frontend JavaScript or commit it to GitHub.

Projects are stored under `tribble:project:<id>` and expire after 30 days. The browser also keeps a local copy so projects can be edited during initial setup.

## Current MVP

- Visual Blockly workspace
- Eclipse-style generated code view
- Add, select, edit, and delete sprites
- Canvas stage preview
- Run basic movement, positioning, message, and color blocks
- Save projects to Upstash when configured
- Local browser fallback

## Important next steps

Add account authentication and per-user project ownership before opening cloud project storage to a public community. Expand the Eclipse block set and connect the visual code generator to the official Eclipse compiler/runtime as its API is finalized.
