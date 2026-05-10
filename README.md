# NexStats

Internal dashboard for **NexHack** — a Minecraft-themed hackathon. Built with Next.js 14, MongoDB, and Google Sheets.

## What it does

**Participants** log in with their email and see their team's registration details: venue assignment (block, floor, room, desk), teammate profiles pulled from Devfolio, and organizer notes or status flags (active / eliminated / disqualified).

**Organizers** get a full stats dashboard: Devfolio registration funnel (RSVP → submit → accept → approve), donut charts for team status, member status, gender breakdown, and team size distribution.

**Registerers** (a limited role) can register teams on-site — search by name/email/phone from imported Devfolio data, fill member details, assign venue, verify IDs, record kit distribution, and save to MongoDB.

**Admin extras** include a live preview of all registered teams with gender-enriched member rows, and per-team status controls to disqualify, eliminate, or reinstate teams with a custom message.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v4 — credentials (organizer password / participant email lookup) |
| Database | MongoDB via Mongoose |
| Devfolio data | Static JSON (`src/data/teams.json`, `src/data/members.json`) |
| Sheets sync | Google Sheets API v4 (attendance / kit flags) |
| Styling | Tailwind CSS + custom Minecraft pixel-font theme |

## Roles

| Role | Access |
|---|---|
| `admin` | Everything |
| `registerer` | `/admin/register-team` only |
| `participant` | `/participants` only |

Roles are resolved from `ADMINS` and `REGISTERERS` env vars (comma-separated emails or JSON arrays). Any authenticated email not in those lists becomes a participant.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values below
npm run dev
```

### Required env vars

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

MONGO_DB_URL=

# JSON array: [{"email":"...","password":"..."}]
NEXSTATS_ORGANIZERS=

# Comma-separated or JSON array of emails
ADMINS=
REGISTERERS=

# Google service account for Sheets sync
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_PRIVATE_KEY_ID=
GOOGLE_PROJECT_ID=
```

## Routes

| Path | Who | What |
|---|---|---|
| `/` | All | Login (participant or organizer) |
| `/participants` | Participant | Team dashboard |
| `/admin` | Admin | Stats overview |
| `/admin/devfolio` | Admin | Browse Devfolio teams/members |
| `/admin/register-team` | Admin + Registerer | On-site team registration |
| `/admin/preview-team` | Admin | Live registered teams with status controls |

## Data flow

Devfolio exports (`teams.json`, `members.json`) live in `src/data/` and are imported as static JSON — no API call at runtime. The admin stats page computes all metrics client-side from these files via `useAdminStats`.

On-site registration writes to MongoDB. The participant dashboard reads from MongoDB via `/api/teams/by-email`. Google Sheets sync runs via `/api/getTeamData` (attendance + kit flags).
