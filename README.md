# AI Content Generator

A full-stack AI-powered content generation app built with Next.js 14, Claude AI, and Supabase.

## Features

- **4 content types** — product descriptions, blog post outlines, email composer, social media captions
- **Streaming responses** — real-time text streaming via Vercel AI SDK
- **Auth** — email/password sign-up, login, forgot/reset password (Supabase Auth)
- **History** — every generation is saved per-user with full inputs and output
- **Settings** — user account management
- **Responsive UI** — mobile-first layout with hamburger sidebar navigation

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Claude via `@ai-sdk/anthropic` + Vercel AI SDK |
| Auth & DB | Supabase (Auth + Postgres + RLS) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Deploy | Vercel |

## Project Structure

```
app/
  (auth)/           # login, signup, forgot-password, reset-password
  (dashboard)/      # generate, history, settings (all protected)
  api/
    generate/       # streaming Claude generation endpoint
    history/        # CRUD for saved generations
  auth/callback/    # Supabase OAuth callback
components/
  generate/         # GenerateForm, ResultDisplay, TagInput
  auth/             # auth form components
  layout/           # sidebar, header
lib/
  supabase/         # server + browser Supabase clients
middleware.ts       # auth-based route protection
database.sql        # Supabase schema + RLS policies
```

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd ai-content-generator
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `database.sql` in the Supabase SQL editor to create the `generations` table and RLS policies
3. Enable Email auth in **Authentication → Providers**

### 3. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

> **Note:** `NEXT_PUBLIC_SUPABASE_URL` must be a full `https://` URL, not just the project key.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`; authenticated users go straight to `/generate`.

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the three environment variables above in **Project → Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js

## Database Schema

```sql
-- generations table (see database.sql for full RLS policies)
create table public.generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  content_type text not null,   -- product_description | blog_post_outline | email_composer | social_media_caption
  inputs      jsonb not null,   -- form inputs for this generation
  result      text not null,    -- full generated text
  created_at  timestamptz default now()
);
```

Row-Level Security ensures users can only read, insert, and delete their own rows.

## Content Types

| Type | Description |
|---|---|
| `product_description` | E-commerce product copy with tone/keywords |
| `blog_post_outline` | Structured blog outline with sections |
| `email_composer` | Professional email drafts |
| `social_media_caption` | Short-form captions for any platform |

## License

MIT
