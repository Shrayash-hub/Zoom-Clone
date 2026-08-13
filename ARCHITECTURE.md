# ARCHITECTURE.md

## Stack
- **Frontend**: Next.js 16.3.0 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLite via SQLAlchemy
- **Communication**: REST API, JSON
- **Deployment**: Frontend → Vercel, Backend → Render

## Folder Structure

### Frontend (`/frontend`)
```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   └── (main)/
│       ├── layout.tsx          # Main layout (sidebar + topbar)
│       ├── page.tsx            # Home dashboard
│       ├── meetings/
│       │   └── page.tsx        # Meetings list view
│       ├── schedule/
│       │   └── page.tsx        # Schedule meeting form
│       ├── join/
│       │   └── page.tsx        # Join meeting page
│       └── room/
│           └── [meetingId]/
│               └── page.tsx    # Meeting room
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── home/
│   │   ├── ActionButtons.tsx   # New Meeting / Join / Schedule
│   │   ├── DailyAgenda.tsx
│   │   ├── DateNavigationBar.tsx
│   │   ├── RecentMeetings.tsx
│   │   └── UpcomingMeetings.tsx
│   ├── modals/
│   │   ├── InviteModal.tsx
│   │   └── NewMeetingModal.tsx
│   └── common/
│       └── ComingSoonToast.tsx # Shared disabled state toast
├── hooks/
│   ├── useHomeData.ts          # Fetches upcoming/recent meetings
│   └── useRoomSocket.ts        # Manages WebSocket connection
├── lib/
│   └── api.ts                  # All fetch calls to backend REST API
├── types/
│   └── index.ts                # Shared TypeScript types
└── styles/
    └── globals.css             # CSS variables from DESIGN.md
```

### Backend (`/backend`)
```
backend/
├── main.py                     # FastAPI app entry point
├── database.py                 # SQLAlchemy setup, DB connection
├── models.py                   # ORM models
├── schemas.py                  # Pydantic request/response schemas
├── seed.py                     # Database seeding script
└── routers/
    ├── meetings.py             # Meeting CRUD endpoints
    ├── participants.py         # Participant endpoints
    └── users.py                # User details endpoints
```

## API Contract

### Base URL
- Dev: `http://localhost:8000/api`
- Prod: env variable `NEXT_PUBLIC_API_URL`

### Endpoints
```
GET    /api/meetings              # All meetings (upcoming + recent)
POST   /api/meetings              # Create instant or scheduled meeting
GET    /api/meetings/:id          # Single meeting detail
DELETE /api/meetings/:id          # End a meeting (soft — sets status to ended, does not delete the row)
POST   /api/meetings/pmi/start    # Start or resume the host's PMI meeting
POST   /api/meetings/:id/join     # Join meeting (register participant)
GET    /api/meetings/:id/participants  # List participants
POST   /api/meetings/:id/participants/:participant_id/remove  # Remove a participant
GET    /api/users/me              # Return the default user details
```

## Key Design Decisions
- **No auth**: Default user seeded in DB (`user_id=1`). All actions assume this user.
- **Meeting ID format**: 9-digit numeric string formatted as `XXX XXX XXXX` (e.g. `554 269 9869`)
- **Invite link format**: `{FRONTEND_URL}/join?id={meeting_id}`
- **Instant meetings**: `meeting_type=instant`, scheduled at creation time
- **Scheduled meetings**: `meeting_type=scheduled`, future `scheduled_at` datetime
- **Recent meetings**: meetings with `status=ended` or `scheduled_at` in the past

## Frontend ↔ Backend Data Flow

### REST API Flow (Database-Backed)
1. UI component calls hook (`useHomeData`, etc.) or `lib/api.ts` directly.
2. `api.ts` fetches from FastAPI endpoint.
3. Response typed via `types/index.ts`.
4. UI renders from hook/component state.

### WebSocket Flow (In-Memory / Live Presence)
1. The meeting room UI uses `useRoomSocket` to connect to `ws://.../ws/room/{meeting_id}`.
2. Backend `main.py` manages connections in-memory via `ConnectionManager.rooms` (a dictionary mapping meeting IDs to active sockets/participants). **This live participant list is NOT database-backed.**
3. On connect, disconnect, or host actions (like `mute_all` or `remove_participant`), the `ConnectionManager` broadcasts JSON messages (`participants_update`, `mute_all`, `removed`).
4. The frontend hook receives the messages and updates React state, triggering immediate UI re-renders for live presence.

## Environment Variables
```
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Backend (.env)
DATABASE_URL=sqlite:///./zoom_clone.db
FRONTEND_URL=http://localhost:3000
```
