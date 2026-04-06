-- Run this in your Supabase SQL editor

create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (
    content_type in (
      'product_description',
      'blog_post_outline',
      'email_subject_lines',
      'social_media_caption'
    )
  ),
  inputs jsonb not null default '{}',
  result text not null default '',
  created_at timestamptz default now() not null
);

alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);
