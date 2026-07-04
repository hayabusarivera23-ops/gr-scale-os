# GR Scale OS — Setup Guide

## Quick Start (5 minutes)

### 1. Install dependencies
```bash
cd "gr-scale-os"
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → New project
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Run `supabase/seed.sql` to load your FL lead data

### 3. Environment variables
Copy `.env.local.example` to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run locally
```bash
npm run dev
```
Opens at http://localhost:3000

### 5. Deploy to Vercel
```bash
npx vercel
```
Add env vars in Vercel dashboard.

---

## Pages
| Route | Page |
|-------|------|
| / | Main dashboard |
| /leads | Lead CRM table |
| /leads/[id] | Lead detail + notes + tasks |
| /pipeline | Kanban pipeline board |
| /outreach | Outreach tracker + log |
| /projects | Active project tracker |
| /clients | Client management |
| /revenue | Revenue + invoices |
| /tasks | Task management |
| /demos | Demo site library |
| /proposals | Proposals + scripts + packages |
| /settings | Agency settings |

## Connect to Supabase (replace seed data)
The app currently uses in-file seed data. To connect live data, replace the seed arrays in each page with Supabase queries using the `supabase` client from `@/lib/supabase`.

Example:
```ts
const { data: leads } = await supabase.from('leads').select('*').order('lead_score', { ascending: false })
```
