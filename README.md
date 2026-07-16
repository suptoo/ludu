# LUDU — Online 2-Player Ludo

Real-time Ludo for **2 players** with room codes, live board sync, chat, and emoji reactions. Built mobile-first, works on desktop too.

## Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://sqpwybdcccvthbmelesb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon public key |

Copy `.env.example` → `.env` for local development (`.env` is not committed).

## How players connect

1. Player 1 → **Create room & get code**
2. Share the **6-character room code**
3. Player 2 → **I have a room code** → enter code → Join
4. Play, chat, and send reactions live

## Setup

1. Run `supabase/schema.sql` in your Supabase SQL Editor
2. Set the env vars above
3. Install and run:

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
```

Or connect this GitHub repo to Vercel and set the two env vars.

## Stack

- React + Vite + TypeScript
- Supabase Postgres + Realtime (`ludu_rooms`, `ludu_chat`)
