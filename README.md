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

## NexHack 2.0 and first-edition archive

The organizer dashboard at `/admin` reads the All Data Google workbook. Choose a worksheet, search, select an editable cell, and save. Open dashboards refresh every 30 seconds and when the tab regains focus. Registration uses the current Teams Data roster and stores private check-in details in MongoDB. The current workbook has no columns for identity checks or emergency contacts.

The original Minecraft edition starts at `/archive-nexhack-one`. Its Devfolio statistics use the bundled first-edition exports. Its registration, status changes, participant lookup, and check-in recovery use the separate MongoDB collection `teams_nexhack_one`. Original attendance reads the surviving Team Members worksheet. Its registration form syncs attendance and check-in flags back to that worksheet. If the sheet write fails, retry the same registration after correcting workbook access.

### Run on the configured Mac

Install the locked dependencies with `npm ci`, then run `npm run dev:local`. The launcher binds to loopback and uses the existing Google Cloud CLI sign-in, macOS Keychain, and local MongoDB database `nexstats_2`. Organizer sign-in uses the project’s `.env` values for `NEXSTATS_ORGANIZERS` and `ADMINS`. The launcher reads **NexStats Session** and **NexStats Local** from Keychain. Set `PORT` to override the default port 3000.

### Hosted runtime

Configure server-side `NEXSTATS_SPREADSHEET_ID`, `NEXSTATS_ARCHIVE_SPREADSHEET_ID`, `MONGO_DB_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMINS`, and `NEXSTATS_ORGANIZERS`. Organizers are a JSON array of email/password objects, and admins are email addresses. Optional `REGISTERERS` have registration-only access. Supply a Google identity with Sheets scope through application default credentials, or configure `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` in the hosting secret store. The principal needs edit access to the workbooks. A hosted instance needs a MongoDB endpoint reachable from the hosting service.

On Vercel production, the Atlas integration supplies `MONGODB_URI`. The app uses the `nexstats_2` database. Google Sheets uses Vercel OIDC with `NEXSTATS_GOOGLE_PROVIDER` (the Google workload identity provider audience) and `GOOGLE_CLIENT_EMAIL`. Git pushes to the connected production branch trigger deployments.

The castle artwork is the [official NexHack 2.0 event poster](https://nexhack.geetauniversity.edu.in/images/home/hero_poster.webp).
