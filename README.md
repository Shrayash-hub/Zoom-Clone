# Zoom Workplace Clone

A functional, full-stack clone of the Zoom Workplace web app — built for the **Scaler SDE Fullstack Assignment**. It replicates Zoom's dashboard, meeting-creation workflows, join flow, scheduling, and a real-time meeting room with host controls, closely matching the look, feel, and interaction patterns of the original product.

**Live App:** https://zoom-clone-puce-omega.vercel.app

**Backend API:** https://zoom-clone-bit6.onrender.com

**Repository:** https://github.com/Shrayash-hub/Zoom-Clone

> **Note on cold starts:** the backend runs on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after a period of idleness can take 30–60 seconds to wake up — subsequent requests are fast. This is a hosting-tier characteristic, not an application bug.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Functionality](#key-functionality)
- [Meeting Room & Real-Time Functionality](#meeting-room--real-time-functionality)
- [UI/UX — Zoom-Inspired Design](#uiux--zoom-inspired-design)
- [Responsive Design](#responsive-design)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Key Technical Decisions](#key-technical-decisions)
- [Security & Error Handling](#security--error-handling)
- [Testing & Verification](#testing--verification)
- [Scope Limitations (Intentional)](#scope-limitations-intentional)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [Assumptions](#assumptions)

---

## Project Overview

This project reimplements the core meeting-management workflows of Zoom Workplace — creating, joining, scheduling, and running meetings — as a modern web application. The goal was to make the experience feel like using the real product: the same visual language, the same interaction patterns, and functionally correct meeting workflows underneath, rather than a generic video-call demo with a different coat of paint.

The build deliberately separates two concerns:
1. **The meeting *management* layer** — dashboard, meeting creation, scheduling, joining, participant/host controls — which is fully implemented and functionally correct.
2. **Real-time *media* transport** (actual video/audio streaming via WebRTC) — which is explicitly out of scope (see [Scope Limitations](#scope-limitations-intentional)), so effort could go toward the workflows and UI fidelity the assignment brief asks to be evaluated on.

## Key Functionality

### Landing Dashboard
- Zoom-styled navbar with logo, search bar, upgrade button, and a profile menu (avatar dropdown with status options and profile/settings entries)
- Sidebar navigation (Home / Meetings / Chat / More) with an active-state indicator matching Zoom's card-style highlight
- **New meeting**, **Join**, and **Schedule** action buttons
- A "Today" date-navigation bar with day-by-day agenda browsing (previous/next/Today), showing scheduled meetings for the selected day, with an empty-state illustration when nothing is scheduled
- Calendar-connect banner (visual, matches Zoom's own "connect your calendar" prompt — not backed by a real calendar integration, see [Scope Limitations](#scope-limitations-intentional))

### Instant Meeting Creation
- Creates a meeting instantly with one click
- Generates a unique, Zoom-formatted 9-digit meeting ID (`XXX XXX XXXX`)
- Generates a shareable invite link
- Supports an optional **passcode** at creation time
- Supports starting a meeting on the host's **Personal Meeting ID (PMI)** instead of a random ID
- Redirects directly into the meeting room on creation

### Join Meeting
- Join by meeting ID or by pasting an invite link
- Requires a display name before joining
- Validates the meeting actually exists (404 for unknown IDs, clear error messaging)
- Enforces passcode validation when a meeting has one set (403 with specific error copy for missing/incorrect passcode)

### Schedule Meetings
- Title, description, date & time picker, duration
- Auto-generates a meeting link and passcode support, same as instant meetings
- Persisted to the database and surfaced in the dashboard's daily agenda on the scheduled date
- Cosmetic "Recurring meeting" checkbox included to match Zoom's scheduling form (not wired to real recurrence logic — see [Scope Limitations](#scope-limitations-intentional))

## Meeting Room & Real-Time Functionality

The meeting room is a **real-time presence and control shell** — it does not transmit actual video/audio (see [Scope Limitations](#scope-limitations-intentional)), but everything around that layer is functionally real and backed by a live WebSocket connection per participant:

- **Live participant presence** — participants list updates in real time as people join/leave, broadcast via WebSocket
- **Host controls, fully real-time**:
  - **Mute All / Unmute All** — mutes/unmutes every *other* participant in the room; the host's own microphone is never affected by this bulk action, matching real Zoom host behavior
  - **Individual participant mute/unmute** — the host can mute or unmute one specific participant from the participants panel without affecting anyone else
  - **Remove Participant** — host can remove a specific participant from the meeting
- **Waiting-for-host state** — a non-host participant who joins before the host sees a "waiting for the host" screen instead of the live room, matching Zoom's behavior for scheduled meetings
- **Invite modal** — shareable link and passcode, accessible from within the room
- **Connection-state handling** (keepalive pings, reconnect-safe state)
- Non-functional but visually present controls — **Chat, Share, React, Host tools, Zoom AI** (and the Sidebar's Chat link) — styled to match Zoom exactly; clicking any of them shows a "Coming soon" toast rather than a dead click or a 404, so the UI never feels broken during a walkthrough. (The **More** button is present but is a dead click).

## UI/UX — Zoom-Inspired Design

A significant portion of this project's effort went into matching Zoom's actual UI, not just "a" video-conferencing UI. This included:

- Iterative, screenshot-driven comparison against the real Zoom Workplace app — topbar, sidebar, dashboard card framing, action button icon set, the "New meeting" popover, the meeting room header/controls bar, and the participants panel were all individually compared against reference screenshots and corrected for pixel-level fidelity (icon choices, casing/weight of labels, spacing, colors, and control ordering)
- A card-based dashboard layout (light-gray page background with an inset white content card, rounded corners, subtle shadow) matching Zoom's actual dashboard framing, rather than a flat full-bleed layout
- A design-token system (CSS variables for color, spacing, radius, shadow, typography) so the whole app stays visually consistent instead of ad hoc per-component styling
- Every non-functional Zoom UI element (profile dropdown items, Host tools, Zoom AI, Share, calendar connect, etc.) is *visually present and styled correctly* rather than omitted, since visual completeness was part of what was being evaluated — but each is explicitly and honestly non-functional, communicated via a consistent "Coming soon" toast rather than a silent no-op or a broken link

## Responsive Design

The app is responsive across mobile, tablet, and desktop breakpoints:
- Sidebar collapses to a horizontal bottom-style nav pattern on narrow viewports
- The meeting room's bottom controls bar — which holds up to 9 controls — uses horizontal scrolling on mobile widths rather than letting icons compress into an unusable, overlapping row, so every control stays tappable regardless of screen width
- Modals, the dashboard card, and the participants panel all have verified mobile-width layouts (tested at ~375px, ~768px, ~1440px)

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, CSS Modules |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Database | SQLite |
| Real-time | Native WebSockets (FastAPI's `WebSocket`, no external pub/sub broker — single-instance in-memory connection registry) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Architecture

```
Zoom-Clone/
├── backend/
│   ├── main.py            # FastAPI app entry, CORS, WebSocket room handler, ConnectionManager
│   ├── database.py        # SQLAlchemy engine/session setup
│   ├── models.py          # ORM models (User, Meeting, Participant)
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── seed.py            # Idempotent database seeding (safe to run on every startup)
│   └── routers/
│       ├── meetings.py    # Meeting CRUD, join, PMI start
│       ├── participants.py
│       └── users.py
└── frontend/
    ├── app/
    │   └── (main)/         # Route group sharing the Topbar + Sidebar shell
    │       ├── page.tsx           # Dashboard
    │       ├── meetings/          # Meetings tab
    │       ├── schedule/          # Schedule meeting form
    │       ├── join/              # Join meeting flow
    │       └── room/[meetingId]/  # Meeting room (inherits the app shell)
    ├── components/
    │   ├── layout/          # Topbar, Sidebar
    │   ├── home/             # ActionButtons, DateNavigationBar, DailyAgenda
    │   └── modals/            # NewMeetingModal, InviteModal
    ├── hooks/
    │   ├── useHomeData.ts     # Dashboard data fetching/polling
    │   └── useRoomSocket.ts   # WebSocket connection, participants, host-control actions
    ├── lib/api.ts           # Centralized REST client
    ├── types/index.ts       # Shared TypeScript types
    └── styles/globals.css   # Design tokens (colors, spacing, radius, shadow, type scale)
```

**Why the meeting room lives inside the `(main)` route group:** early in development the room page rendered as a bare full-viewport page with no app shell. It was intentionally relocated into the same route group as every other page so it inherits the shared Topbar/Sidebar layout, matching how the real Zoom Workplace app keeps its navigation chrome visible even inside an active meeting.

### API Overview

```
GET    /api/meetings                    # Upcoming + recent meetings
POST   /api/meetings                    # Create instant or scheduled meeting
GET    /api/meetings/:id                # Meeting detail
DELETE /api/meetings/:id                # Soft-end a meeting (see Key Technical Decisions)
POST   /api/meetings/:id/join            # Join meeting (validates existence + passcode)
POST   /api/meetings/pmi/start           # Start/resume the host's Personal Meeting ID meeting
GET    /api/meetings/:id/participants    # List participants
POST   /api/meetings/:id/participants/:id/remove # Soft-delete a participant

WS     /ws/room/{meeting_id}             # Real-time room connection
```

**WebSocket message types:** `participants_update`, `mute_all` / `unmute_all`, `mute_participant` / `unmute_participant`, `remove_participant` / `removed` — all host-initiated actions are broadcast server-side to the relevant connections only (targeted, not blindly room-wide, for individual actions).

## Database Schema

Three tables, designed for the actual workflows this app supports rather than a generic over-normalized schema:

```sql
CREATE TABLE users (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT NOT NULL,
    email                TEXT UNIQUE NOT NULL,
    avatar_url           TEXT,
    personal_meeting_id  TEXT UNIQUE NOT NULL,   -- persistent 9-digit PMI
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id      TEXT UNIQUE NOT NULL,        -- 9-digit formatted ID
    title           TEXT NOT NULL,
    description     TEXT,
    host_id         INTEGER NOT NULL REFERENCES users(id),
    meeting_type    TEXT NOT NULL CHECK (meeting_type IN ('instant','scheduled','personal')),
    status          TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','ended')),
    scheduled_at    DATETIME,                    -- NULL for instant meetings
    duration_mins   INTEGER DEFAULT 60,
    invite_link     TEXT NOT NULL,
    passcode        TEXT,                        -- NULL = no passcode required
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at        DATETIME
);

CREATE TABLE participants (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id    TEXT NOT NULL REFERENCES meetings(meeting_id),
    user_id       INTEGER REFERENCES users(id),  -- NULL for unauthenticated guests
    display_name  TEXT NOT NULL,
    joined_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at       DATETIME,
    is_host       BOOLEAN DEFAULT FALSE
);
```

**Relationships:** `users ──< meetings` (one host, many meetings) · `meetings ──< participants` (one meeting, many participants) · `users ──< participants` (nullable — supports guest attendance without an account, per the "No Login Required" requirement).

**Indexes:** `meetings(host_id)`, `meetings(status)`, `meetings(scheduled_at)`, `participants(meeting_id)` — chosen to match the app's actual query patterns (dashboard's upcoming/recent split, per-meeting participant lookups).

> **Note:** in-room, session-scoped state — live mute status, WebSocket connection identity, who's currently "in" a room right now — is intentionally kept in an in-memory `ConnectionManager` on the backend rather than persisted to these tables. That state is meaningful only while a meeting is live and a process restart or a participant leaving legitimately clears it; persisting it would add write load and complexity for data with no value once a meeting ends. Meeting *records* (who scheduled what, when, with what settings) are what's durably stored.

## Setup & Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload
```

Runs at `http://localhost:8000`. Seeding is idempotent — safe to re-run.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Runs at `http://localhost:3000`.

## Environment Variables

### Backend
| Variable | Purpose | Example |
|---|---|---|
| `FRONTEND_URL` | Used to construct invite links server-side | `http://localhost:3000` |
| `PYTHON_VERSION` | Pins the Python version on Render (see [Key Technical Decisions](#key-technical-decisions)) | `3.11.9` |

### Frontend
| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST base URL (note the `/api` suffix) | `http://localhost:8000/api` |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket base URL — **must be `wss://` in production**, not `ws://`, or browsers will block it as mixed content on an HTTPS page | `ws://localhost:8000` |

These are `NEXT_PUBLIC_*` variables, which Next.js bakes into the build at build time — they must be set *before* deploying, not added after the fact without triggering a rebuild.

## Deployment

- **Frontend** — deployed on Vercel, root directory `frontend`, auto-deploys on every push to `main`
- **Backend** — deployed on Render (free tier), root directory `backend`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`, auto-deploys on every push to `main`
- **CORS** — configured to allow all origins with credentials; FastAPI's `CORSMiddleware` correctly reflects the request's actual origin rather than a literal wildcard when combined with `allow_credentials=True`, so this works correctly with the Vercel frontend without needing a hardcoded origin
- End-to-end connectivity (REST + WebSocket, across both live deployments) was manually verified after deployment — see [Testing & Verification](#testing--verification)

## Key Technical Decisions

- **`meeting_id` stored as `TEXT`, not an integer** — matches Zoom's formatted display pattern (`XXX XXX XXXX`) and keeps display formatting a pure presentation concern rather than something computed from a numeric ID.
- **`DELETE /meetings/:id` performs a soft-end, not a row deletion** — it sets `status='ended'` and `ended_at`, rather than removing the record. This preserves meeting history for the "Recent Meetings" view, matching how Zoom itself never truly "deletes" a meeting a user has already had — it just ends.
- **Auto-seed-on-startup, made idempotent** — Render's free tier resets the container's local filesystem on every cold start (including waking from its 15-minute sleep), which would otherwise wipe the SQLite file's seeded data. The seed function checks for existing records before inserting each one, so it safely re-seeds an empty database and does nothing destructive if data already exists — this runs automatically in the FastAPI lifespan handler on every startup.
- **Pinned Python 3.11 on Render** — the pinned `pydantic==2.7.1` dependency has no precompiled wheel for newer Python versions on Render's build environment, which falls back to a Rust source build that fails there (read-only Cargo cache). Python 3.11 has stable precompiled wheels, avoiding the issue entirely.
- **Host-only actions never affect the host's own state** — Mute All, Unmute All, and individual participant mute all explicitly exclude the host from their own broadcast, matching real Zoom host-control semantics (a host muting "everyone" doesn't mute themselves).
- **Non-functional Zoom features are visible, styled, and explicitly stubbed** rather than removed — since UI/UX fidelity to Zoom is an explicit evaluation criterion, elements like Chat, Share, Host tools, and Zoom AI are rendered exactly as Zoom renders them, and clicking them gives honest, immediate feedback ("Coming soon") instead of either a broken route or silent nothing.

## Security & Error Handling

- **Passcode-protected meetings** — join requests are validated server-side; incorrect or missing passcodes return a `403` with a specific, user-facing error message rather than a generic failure.
- **Meeting-existence validation** — joining or fetching an unknown meeting ID returns a proper `404`, surfaced in the UI as a clear "meeting not found" state rather than a crash or blank screen.
- **Centralized API error handling** — the frontend's API client (`lib/api.ts`) has a single fetch wrapper that catches network failures (e.g. backend unreachable) and parses structured error responses (`{"detail": "..."}`) into user-facing messages, so every page gets consistent error behavior instead of each component handling fetch failures independently.
- **WebSocket resilience** — client-side keepalive pings every 20 seconds, `onclose`/`onerror` handlers update a `connected` state the UI can react to, and dead connections are cleaned up server-side in the `ConnectionManager` broadcast loop so one dropped client can't silently corrupt the room state for everyone else.
- **CORS** is intentionally permissive (`allow_origins=["*"]`) — appropriate here since the app has no authentication, no cookies, and no sensitive per-user data; nothing meaningful is protected by tightening it further for this assignment's scope, though a production system with real accounts would scope this to a specific origin.

## Testing & Verification

This project was manually verified end-to-end, both locally and against the live deployment:

- **Live backend data check** — confirmed the deployed Render instance returns real seeded meeting data (not empty/erroring) after a cold start, validating the auto-seed fix in production, not just locally
- **Full deployment smoke test** — on the live Vercel + Render pairing: dashboard loads real data (proves API connectivity + CORS), creating a meeting redirects into the room (proves the write path), the participant count updates live and a WebSocket connection shows `101 Switching Protocols` in DevTools (proves real-time connectivity over `wss://`), and a freshly generated invite link correctly points to the production domain and successfully lets a second browser session join
- **Host-control correctness testing** — Mute All → Unmute All cycle verified to persist its label correctly (no stale/reverting state) and confirmed *not* to affect the host's own mic; individual per-participant mute verified to stay consistent with subsequent bulk actions (e.g., a participant unmuted individually is still correctly re-muted by a later "Mute All")
- **Responsive verification** — meeting room controls bar and dashboard layout checked at ~375px, ~768px, and ~1440px viewport widths for overlap, clipping, and usability
- **Console-error audit** — verified no CORS errors, no failed WebSocket connections, and no application-level console errors on the deployed app (the only console noise present is an unrelated browser-extension artifact and a harmless Next.js route-prefetch 404 for a stubbed nav link, neither of which affects functionality)

## Scope Limitations (Intentional)

Per the assignment brief and deliberate architectural choices, the following are **intentionally not implemented**:

- **No login/authentication** — a single default user is pre-seeded and assumed logged in, per the assignment's explicit "No Login Required" instruction. All actions in the app act as this user.
- **No WebRTC / real video-audio streaming** — the focus of this project is the meeting *management* workflow (creation, scheduling, joining, host controls) and UI fidelity, not building a video codec/media pipeline. The meeting room is a real-time *presence and control* shell: WebSocket-backed, live, and functionally correct for everything except actually transmitting a camera/microphone feed.
- **Several Zoom UI elements are visually present but non-functional** — Chat, Share, React, Host tools, and Zoom AI in the meeting room; the Sidebar's Chat link; a few Topbar profile-menu items; "Edit"/"Show Meeting Invitation" in the Meetings tab; and the dashboard's "Connect your calendar" banner. Every one of these is styled to match Zoom exactly and gives honest "Coming soon" feedback on click rather than pretending to work or silently doing nothing. (The "More" button in the meeting room is present but is a dead click).
- **No real calendar integration** — the "Connect your calendar" banner is a static UI element matching Zoom's own dashboard prompt, not backed by a Google/Outlook calendar sync.
- **"Recurring meeting" checkbox is cosmetic** — present on the Schedule form to match Zoom's UI, not wired to actual recurrence logic (no recurrence rule is generated or stored).

## Known Limitations

- **Render free-tier cold starts** — the backend sleeps after ~15 minutes idle; the first request afterward is slow (30–60s) while the container spins back up. This is a hosting-tier limitation, not an application defect.
- **Pre-seeded meetings' invite links** — the meetings inserted by the initial seed script were generated before the production `FRONTEND_URL` was finalized, so their stored invite links point to `localhost:3000`. Any meeting created *after* deployment generates a correct production invite link; only the original seed data is affected.
- **In-memory room state is single-instance** — the WebSocket `ConnectionManager` holds room/participant/mute state in the backend process's memory rather than an external store (e.g. Redis). This is appropriate for this assignment's scale and Render's single-instance free-tier deployment, but wouldn't horizontally scale to multiple backend instances without moving that state out of process memory.
- **SQLite on an ephemeral filesystem** — Render's free tier doesn't persist the filesystem across restarts, so any *new* data created during a session (new meetings, new participants) is lost on the next cold start/restart, not just the original seed data. The auto-seed fix guarantees the *demo* data is always present, but it does not make the database durable across restarts on this hosting tier.

## Future Enhancements

- Real WebRTC media transport (camera/microphone/screen-share) for actual video calls
- Persistent, external session state (e.g. Redis) for the WebSocket room manager, enabling horizontal scaling
- Real authentication (login/signup) replacing the single default user
- A managed/persistent database (e.g. Postgres) instead of ephemeral SQLite, for true data durability in production
- Real calendar integration behind the existing "Connect your calendar" UI
- Functional versions of the currently-stubbed features (Chat, Screen Share, Host tools panel, Zoom AI)
- Real recurring-meeting logic behind the existing checkbox

## Assumptions

- No authentication: a default user (Shrayash Awasthi) is pre-seeded and assumed logged in for every action
- Meeting IDs are 9-digit numeric strings, formatted for display as `XXX XXX XXXX`
- Instant meetings are set to `active` status immediately on creation; scheduled meetings remain `waiting` until the host starts them
- "Recent meetings" are derived from meetings with `status='ended'` or a `scheduled_at` in the past
- The meeting room is a real-time UI/control shell — no actual video/audio is transmitted (see [Scope Limitations](#scope-limitations-intentional))
