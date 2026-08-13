# DATABASE.md

## Engine
SQLite via SQLAlchemy ORM. File: `zoom_clone.db`

## Schema

### `users`
```sql
CREATE TABLE users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    avatar_url   TEXT,
    personal_meeting_id TEXT UNIQUE NOT NULL,  -- 9-digit, e.g. "554269989"
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
> One default user seeded (id=1). personal_meeting_id maps to their PMI visible in Meetings tab.

---

### `meetings`
```sql
CREATE TABLE meetings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id      TEXT UNIQUE NOT NULL,      -- 9-digit formatted ID
    title           TEXT NOT NULL,
    description     TEXT,
    host_id         INTEGER NOT NULL REFERENCES users(id),
    meeting_type    TEXT NOT NULL CHECK(meeting_type IN ('instant', 'scheduled', 'personal')),
    status          TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'active', 'ended')),
    scheduled_at    DATETIME,                  -- NULL for instant meetings
    duration_mins   INTEGER DEFAULT 60,
    invite_link     TEXT NOT NULL,
    passcode        TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at        DATETIME
);
```
> Core entity. `meeting_type` distinguishes instant from scheduled from PMI meetings.
> `status` drives upcoming vs recent split in UI.

---

### `participants`
```sql
CREATE TABLE participants (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id   TEXT NOT NULL REFERENCES meetings(meeting_id),
    user_id      INTEGER REFERENCES users(id),  -- NULL for guest participants
    display_name TEXT NOT NULL,
    joined_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at      DATETIME,
    is_host      BOOLEAN NOT NULL DEFAULT FALSE
);
```
> Tracks who joined each meeting. Supports both registered users and named guests.
> `is_host` flag enables future host-control features.

---

## Relationships
```
users ──< meetings        (one user hosts many meetings)
meetings ──< participants (one meeting has many participants)
users ──< participants    (one user joins many meetings, nullable for guests)
```

## Indexes
```sql
CREATE INDEX idx_meetings_host ON meetings(host_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_participants_meeting ON participants(meeting_id);
```

## Seed Data (`seed.py`)
- 1 default user: `id=1, name="Shrayash Awasthi", personal_meeting_id="554269989"`
- 3 upcoming scheduled meetings (next 7 days)
- 4 recent/ended meetings (past 14 days)
- Participants seeded for ended meetings

## Design Rationale
- **`meeting_id` as TEXT**: Matches Zoom's formatted ID pattern; easier to handle display formatting in app layer
- **Separate `participants` table**: Enables per-meeting attendance history and future host-control features
- **`user_id` nullable in participants**: Allows guests to join with just a display name (no auth required)
- **`status` field**: Clean way to split upcoming vs recent without complex date queries
- **`personal_meeting_id` on user**: Each user has a persistent PMI, matching real Zoom behavior
