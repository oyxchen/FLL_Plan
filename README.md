# FLL Plan

A light-green shared team hub for FIRST LEGO League Challenge team 75798, SharkBytes.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use the team passcode `75798`. With no cloud credentials, the app runs in local mode and saves data in that browser. Local uploads are limited to 1.25 MB per file so the browser can keep its backup safely.

## Shared Vercel + Supabase setup

1. Create a Supabase project and run this SQL in its SQL editor:

   ```sql
   create table if not exists public.fll_plan_state (
     id text primary key,
     payload jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.fll_plan_state enable row level security;
   grant all on public.fll_plan_state to service_role;

   insert into storage.buckets (id, name, public, file_size_limit)
   values ('fll-files', 'fll-files', false, 26214400)
   on conflict (id) do update set public = false, file_size_limit = 26214400;
   ```

2. Add these **server-side** environment variables in Vercel (and optionally `.env.local` for local shared-mode development):

   ```text
   TEAM_PASSWORD=75798
   SESSION_SECRET=<a long random secret>
   SUPABASE_URL=<your Supabase project URL>
   SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>
   SUPABASE_STORAGE_BUCKET=fll-files
   ```

   Never expose or commit the service-role key. The site password is checked on the server and stored in an HTTP-only, signed session cookie. The team uses one shared passcode; individual accounts and attribution are not enabled.

3. Connect this repository to Vercel and deploy. Set all environment variables before the first deployment. The site uses Supabase REST endpoints directly and does not need a browser-side Supabase key.

## Google Drive Picker (optional)

In Google Cloud Console, enable the Google Picker API and Drive API, create a browser OAuth client and API key, and configure the allowed origins for the local and deployed site. Add:

```text
NEXT_PUBLIC_GOOGLE_API_KEY=<picker API key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<browser OAuth client ID>
NEXT_PUBLIC_GOOGLE_APP_ID=<Google Cloud project number>
```

When Picker is not configured, add a Google Drive/Docs/Slides/Sheets URL with the resource form. Google editing embeds depend on the file permissions and Google’s embed behavior; each viewer also has an **Open in Google** fallback.

## App behavior and limits

- The Robot Game tab has editable mission-point cells, computed per-run score totals, separate time fields, the average of entered runs, and a view-only embedded BIOGLOW Robot Game Rulebook.
- Browser notifications are checked while FLL Plan is open. The browser must grant notification permission; reminders are shown in the site and use the visitor’s local date.
- The rulebook is linked from FIRST’s 2026–27 BIOGLOW season materials.
- Team data is one shared workspace protected by the requested `75798` passcode. No lockout or individual member accounts are enabled.
