-- Ludu Online — run ALL of this once in Supabase → SQL Editor
-- Project: sqpwybdcccvthbmelesb

create extension if not exists "pgcrypto";

-- ── Rooms ──────────────────────────────────────────────
create table if not exists public.ludu_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  host_id text not null,
  host_name text not null,
  guest_id text,
  guest_name text,
  current_turn text not null default 'red'
    check (current_turn in ('red', 'yellow')),
  dice_value integer,
  dice_rolled boolean not null default false,
  consecutive_sixes integer not null default 0,
  winner text check (winner is null or winner in ('red', 'yellow')),
  pieces jsonb not null default '{
    "red": [-1, -1, -1, -1],
    "yellow": [-1, -1, -1, -1]
  }'::jsonb,
  last_action text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ludu_rooms_code_idx on public.ludu_rooms (code);

alter table public.ludu_rooms enable row level security;

drop policy if exists "Anyone can read rooms" on public.ludu_rooms;
drop policy if exists "Anyone can create rooms" on public.ludu_rooms;
drop policy if exists "Anyone can update rooms" on public.ludu_rooms;

create policy "Anyone can read rooms"
  on public.ludu_rooms for select using (true);

create policy "Anyone can create rooms"
  on public.ludu_rooms for insert with check (true);

create policy "Anyone can update rooms"
  on public.ludu_rooms for update using (true);

-- ── Chat + reactions ───────────────────────────────────
create table if not exists public.ludu_chat (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.ludu_rooms (id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  color text not null check (color in ('red', 'yellow')),
  kind text not null default 'chat' check (kind in ('chat', 'reaction')),
  body text not null check (char_length(body) > 0 and char_length(body) <= 280),
  created_at timestamptz not null default now()
);

create index if not exists ludu_chat_room_created_idx
  on public.ludu_chat (room_id, created_at desc);

alter table public.ludu_chat enable row level security;

drop policy if exists "Anyone can read chat" on public.ludu_chat;
drop policy if exists "Anyone can send chat" on public.ludu_chat;

create policy "Anyone can read chat"
  on public.ludu_chat for select using (true);

create policy "Anyone can send chat"
  on public.ludu_chat for insert with check (true);

-- ── Realtime ───────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.ludu_rooms;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ludu_chat;
exception when duplicate_object then null;
end $$;
