# TASKS.md

## Status Key
`[ ]` Not started | `[~]` In progress | `[x]` Done

---

## Phase 1 — Project Setup
- [x] Init Next.js 14 project with TypeScript + Tailwind
- [x] Set up FastAPI project structure
- [x] Configure CORS, env variables
- [x] Set up SQLAlchemy + SQLite connection
- [x] Define ORM models (users, meetings, participants)
- [x] Write and run seed script
- [x] Set up global CSS variables from DESIGN.md
- [x] Build Sidebar component
- [x] Build Topbar component
- [x] Wire root layout (Sidebar + Topbar + content area)

## Phase 2 — Home Dashboard
- [x] Home page layout (clock, date, action buttons)
- [x] ActionButtons component (New Meeting, Join, Schedule)
- [x] UpcomingMeetings section (fetch from API)
- [x] RecentMeetings section (fetch from API)
- [x] GET /api/meetings endpoint (filtered by status + host)

## Phase 3 — Instant Meeting
- [x] Route group restructure (moved Home and Meetings under `app/(main)`)
- [x] NewMeetingModal (with start options)
- [x] POST /api/meetings endpoint (instant type)
- [x] Meeting ID generation (9-digit unique)
- [x] Invite link generation
- [x] Redirect to /room/[meetingId] on creation

## Phase 4 — Join Meeting
- [x] Join page (/join) with Meeting ID input + display name
- [x] Meeting ID validation against DB
- [x] POST /api/meetings/:id/join endpoint
- [x] Redirect to /room/[meetingId] on success

## Phase 5 — Schedule Meeting
- [x] Schedule page (/schedule) with full form
- [x] Title, description, date/time picker, duration fields
- [x] POST /api/meetings endpoint (scheduled type)
- [x] Meeting appears in Upcoming Meetings on home

## Phase 6 — Meetings Tab
- [x] Meetings page (/meetings)
- [x] PMI card (personal meeting ID + Start/Copy/Edit buttons)
- [x] Upcoming meetings list with detail panel
- [x] GET /api/meetings/:id endpoint

## Phase 7 — Meeting Room
- [x] Room page (/room/[meetingId])
- [x] Participant list UI (panel slides in/out from right)
- [x] Meeting controls bar (mute toggle, video toggle, leave)
- [x] Copy invite link button (Invite modal)
- [x] End meeting → update status to 'ended'
- [x] Participants polled every 10 seconds
- [x] Remove participant (host control, hover-visible)
- [x] GET/POST /api/meetings/{id}/participants endpoints

## Phase 8 — Polish + Empty States (Final)
- [x] Loading skeletons across all data fetching views
- [x] Empty states (icons + messages) for no meetings
- [x] Error boundary / redirects for invalid meeting room
- [x] Topbar border rendering correctly
- [x] `README.md`
- [x] Build passes with 0 errors

## Phase 9 — WebSocket Real-Time Presence
- [x] Backend WebSocket manager and endpoint
- [x] Frontend `useRoomSocket` hook
- [x] Integrate WebSocket into room page
- [x] Pass display name dynamically
- [x] Update connection dot indicator
- [x] Test live connection updates
- [x] Zero TypeScript errors

## Phase 10 — Responsive Design
- [x] Sidebar bottom nav on mobile
- [x] Root layout adjustments
- [x] Topbar responsive search/buttons
- [x] Home page typography and spacing
- [x] Join page full-width card
- [x] Schedule page stacked layout
- [x] Meetings single-panel toggling
- [x] Room panel drawer overlay

---

## Build Order Rationale
Setup → Layout shell → Home → Core meeting flows (create, join, schedule) → Meetings tab → Room → Polish.
Each phase is independently demoable and evaluatable.

## Phase 11 — Functionality Maximization
- [x] Mute All — backend WS broadcast, frontend hook isMuted/muteAll, Mute All button (host only)
- [x] Meeting Passcode — stored in DB, validated on join, shown in Invite modal, input on Join page
- [x] PMI Consistency — POST /meetings/pmi/start endpoint, startPmiMeeting() in api.ts, used in Meetings tab
- [x] Zero TypeScript errors (npm run build passes)

## Phase 12 — Disabled States & Host Controls
- [x] Remove Participant (host control) migrated to WebSocket for real-time removal
- [x] Coming Soon pattern implemented (opacity: 0.5, cursor: not-allowed, aria-disabled="true")
- [x] Coming Soon toast applied to Chat, React, Share, Host Tools, and Zoom AI in room
- [x] Coming Soon toast applied to Profile, About, Help, Language, Sign Out, and App Download in Topbar
- [x] Coming Soon toast applied to Edit/Show Invitation in Meetings tab and Connect Calendar in Dashboard
