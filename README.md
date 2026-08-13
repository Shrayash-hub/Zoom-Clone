# Zoom Workplace Clone

A functional clone of the Zoom Workplace web app built for the Scaler SDE Fullstack Assignment.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLAlchemy
- **Database**: SQLite
- **Deployment**: Vercel (frontend), Render (backend)

## Features
- Home dashboard with live clock, daily agenda, and date navigation
- Instant meeting creation with unique meeting ID and invite link
- Join meeting by ID or invite link with display name entry and passcode protection
- Schedule meetings with date, time, and duration picker
- Meetings tab with PMI and upcoming meeting management
- Meeting room with live timer, invite modal, and real-time participant view (WebSocket)
- Host controls: Mute All and Remove Participant (real-time via WebSocket)

## Scope Limitations (Intentional)
Per the assignment brief and architectural choices, the following are intentionally **not** implemented:
- **No Login/Auth**: A default user is pre-seeded and assumed logged in to fulfill the "No Login Required" constraint.
- **No WebRTC Media Transport**: The focus is on the meeting management workflow and UI. The meeting room is a shell for participant presence; it does not stream actual video or audio.
- **Disabled UI Elements**: The Chat, Screen Share, Reactions, Host Tools panel, and Zoom AI buttons are visually present in the meeting room but disabled. Clicking them triggers a "Coming soon" toast. The same applies to specific Topbar and Meeting tab elements.

## Database Schema
Three tables: `users`, `meetings`, `participants`.
- `users`: stores the default user with a personal meeting ID (PMI)
- `meetings`: core entity with type (instant/scheduled/personal), status, and invite link
- `participants`: tracks who joined each meeting, supports both registered users and guests

See `DATABASE.md` for full schema and design rationale.

## Setup Instructions

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py
# Set FRONTEND_URL=http://localhost:3000 (used for invite links)
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api
# Set NEXT_PUBLIC_WS_URL=ws://localhost:8000
# NOTE: Set NEXT_PUBLIC_WS_URL to wss://your-backend-url in production
npm run dev
```

## Assumptions
- No authentication: a default user (Shrayash Awasthi) is pre-seeded and assumed logged in
- Meeting IDs are 9-digit numeric strings formatted as XXX XXX XXXX
- Instant meetings are set to active status immediately on creation
- Scheduled meetings have waiting status until the host starts them
- The meeting room is a UI shell — no real WebRTC or video streaming

## Live Demo
- Frontend: [your Vercel URL]
- Backend API: [your Render URL]
