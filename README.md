# AI Content Generator

A full-stack AI-powered content generation app built with Next.js 14, Claude AI, and Supabase.

## Features

- **4 content types** — product descriptions, blog post outlines, email composer, social media captions
- **Streaming responses** — real-time text streaming via Vercel AI SDK
- **Variant history** — keep up to 5 generated variants in memory and navigate between them
- **Public demo** — 3 free generations per IP per 24 h, no sign-up required
- **Auth** — email/password sign-up, login, forgot/reset password (Supabase Auth)
- **Generation history** — every saved generation stored per-user with full inputs, output, and token count
- **Markdown rendering** — rich formatted output via `react-markdown` + GFM
- **Responsive UI** — mobile-first layout with hamburger sidebar navigation

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Claude via `@ai-sdk/anthropic` + Vercel AI SDK |
| Auth & DB | Supabase (Auth + Postgres + RLS) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Markdown | `react-markdown` + `remark-gfm` |
| Tests | Vitest + Testing Library |
| Deploy | Vercel |

## Project Structure

```
app/
  (auth)/             # login, signup, forgot-password, reset-password
  (dashboard)/        # generate, history, settings (all protected)
  api/
    generate/         # authenticated streaming Claude endpoint
    demo/             # public demo endpoint (rate-limited, 3/24h per IP)
    history/          # GET/POST saved generations
    history/[id]/     # DELETE a single generation
  auth/callback/      # Supabase OAuth callback handler
components/
  auth/               # AuthForm, ForgotPasswordForm, ResetPasswordForm
  generate/           # GenerateForm, ResultDisplay, TagInput
  history/            # HistoryList, HistoryItem
  landing/            # DemoWidget (public demo)
  layout/             # DashboardShell, Header, Sidebar
  shared/             # MarkdownContent
lib/
  prompts.ts          # buildPrompt() — all 4 content types + isValidContentType()
  utils.ts            # cn() classname helper
  supabase/           # server + browser Supabase clients
middleware.ts         # auth-based route protection
database.sql          # Supabase schema + RLS policies
__tests__/            # Vitest unit tests (112 tests)
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
2. Run `database.sql` in the Supabase SQL editor to create tables and RLS policies
3. Enable Email auth in **Authentication → Providers**

### 3. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Optional — used for password-reset redirect links
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors see the landing page with a live demo widget; authenticated users go straight to `/generate`.

## Testing

```bash
npm test          # run once
npm run test:watch  # watch mode
```

112 tests across 5 suites covering prompt building, input sanitization, rate-limit logic, pagination helpers, and the TagInput component.

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables above in **Project → Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js

## Database Schema

```sql
-- see database.sql for full RLS policies

create table public.generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  content_type text not null,        -- product_description | blog_post_outline | email_composer | social_media_caption
  inputs       jsonb not null,       -- form inputs snapshot
  result       text not null,        -- full generated text
  tokens_used  integer,              -- Claude token count (nullable)
  created_at   timestamptz default now()
);

create table public.demo_requests (
  id         bigint primary key generated always as identity,
  ip         text not null,
  created_at timestamptz default now()
);
```

Row-Level Security ensures users can only read, insert, and delete their own rows in `generations`. `demo_requests` is insert-only from the public API.

## Content Types

| Type | Model | Tones / Styles | Length options |
|---|---|---|---|
| `product_description` | claude-sonnet-4-6 | formal, casual, playful, authoritative, urgent, empathetic, minimalist | teaser (50–80w), standard (120–200w), extended (250–400w) |
| `blog_post_outline` | claude-sonnet-4-6 | — | short (~500w), medium (~1000w), long (~2000w) |
| `email_composer` | claude-sonnet-4-6 | formal, friendly, persuasive, direct, empathetic | brief, standard, detailed |
| `social_media_caption` | claude-sonnet-4-6 | professional, casual, fun | micro, short, medium, long |

Social media captions use platform-specific rules (Instagram: emojis + hashtags; LinkedIn: no emojis; Twitter: character limits + thread support; Facebook: conversational). The demo endpoint uses `claude-haiku-4-5-20251001` for cost efficiency.

## License

MIT
