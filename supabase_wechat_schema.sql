-- WeChat MVP — Supabase sync schema
-- Run in Supabase SQL Editor after main supabase_schema.sql (or standalone).
-- Enables multi-device / multi-user message sync via Realtime.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles (public directory by wechat_id)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.wechat_profiles (
  id uuid primary key default gen_random_uuid(),
  wechat_id text not null unique,
  display_name text not null default '',
  avatar text not null default '👤',
  status text not null default '',
  region text not null default '',
  wallet_balance numeric not null default 0,
  auth_user_id uuid,
  updated_at timestamptz not null default now(),
  constraint wechat_profiles_wechat_id_format_chk
    check (wechat_id ~ '^[a-zA-Z0-9_.-]{3,32}$')
);

create index if not exists wechat_profiles_auth_user_idx
  on public.wechat_profiles (auth_user_id);

comment on table public.wechat_profiles is
  'WeChat MVP public profiles keyed by wechat_id. No PHI — display names and avatars only.';

-- ─────────────────────────────────────────────────────────────────────────
-- Messages (synced chat threads)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.wechat_messages (
  id text primary key,
  chat_id text not null,
  sender_wechat_id text not null,
  content text not null,
  msg_type text not null default 'text',
  created_at timestamptz not null default now(),
  constraint wechat_messages_content_len_chk check (char_length(content) <= 4000)
);

create index if not exists wechat_messages_chat_id_idx
  on public.wechat_messages (chat_id, created_at);

create index if not exists wechat_messages_sender_idx
  on public.wechat_messages (sender_wechat_id);

comment on table public.wechat_messages is
  'WeChat MVP messages. chat_id for direct chats: direct:<id_a>:<id_b> (sorted, lowercased).';

-- ─────────────────────────────────────────────────────────────────────────
-- Moments (optional social feed sync)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.wechat_moments (
  id text primary key,
  author_wechat_id text not null,
  content text not null default '',
  images jsonb not null default '[]'::jsonb,
  likes jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wechat_moments_author_idx
  on public.wechat_moments (author_wechat_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.wechat_messages;
alter publication supabase_realtime add table public.wechat_moments;
alter publication supabase_realtime add table public.wechat_profiles;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — MVP demo: open to anon + authenticated (tighten before production)
-- ─────────────────────────────────────────────────────────────────────────

alter table public.wechat_profiles enable row level security;
alter table public.wechat_messages enable row level security;
alter table public.wechat_moments enable row level security;

drop policy if exists wechat_profiles_read_all on public.wechat_profiles;
create policy wechat_profiles_read_all
  on public.wechat_profiles for select to anon, authenticated using (true);

drop policy if exists wechat_profiles_upsert_all on public.wechat_profiles;
create policy wechat_profiles_upsert_all
  on public.wechat_profiles for insert to anon, authenticated with check (true);

drop policy if exists wechat_profiles_update_all on public.wechat_profiles;
create policy wechat_profiles_update_all
  on public.wechat_profiles for update to anon, authenticated using (true);

drop policy if exists wechat_messages_read_all on public.wechat_messages;
create policy wechat_messages_read_all
  on public.wechat_messages for select to anon, authenticated using (true);

drop policy if exists wechat_messages_insert_all on public.wechat_messages;
create policy wechat_messages_insert_all
  on public.wechat_messages for insert to anon, authenticated with check (true);

drop policy if exists wechat_moments_read_all on public.wechat_moments;
create policy wechat_moments_read_all
  on public.wechat_moments for select to anon, authenticated using (true);

drop policy if exists wechat_moments_insert_all on public.wechat_moments;
create policy wechat_moments_insert_all
  on public.wechat_moments for insert to anon, authenticated with check (true);

drop policy if exists wechat_moments_update_all on public.wechat_moments;
create policy wechat_moments_update_all
  on public.wechat_moments for update to anon, authenticated using (true);
