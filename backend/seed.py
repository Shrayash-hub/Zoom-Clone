"""
Idempotent database seeder.
Run: python seed.py
Safe to run multiple times — checks for existing records before inserting.
"""

import os
import random
import string
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zoom_clone.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# Import models AFTER engine is set up
from models import Base, User, Meeting, Participant  # noqa: E402

Base.metadata.create_all(bind=engine)


def generate_meeting_id() -> str:
    """Generate a unique 9-digit numeric meeting ID."""
    return "".join(random.choices(string.digits, k=9))


def make_invite_link(meeting_id: str) -> str:
    return f"{FRONTEND_URL}/join?id={meeting_id}"


def seed():
    db = SessionLocal()
    try:
        # ── 1. Default user ───────────────────────────────────────────────────
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(
                id=1,
                name="Shrayash Awasthi",
                email="awasthishrayashofc@gmail.com",
                personal_meeting_id="554269989",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("[OK] Seeded default user")
        else:
            print("[--] User already exists, skipping")

        now = datetime.utcnow()

        # ── 2. Upcoming scheduled meetings (next 7 days) ──────────────────────
        upcoming_titles = [
            "Weekly Team Standup",
            "Product Roadmap Review",
            "Design System Sprint Planning",
        ]
        upcoming_offsets_days = [1, 3, 6]

        for title, offset in zip(upcoming_titles, upcoming_offsets_days):
            exists = db.query(Meeting).filter(Meeting.title == title).first()
            if exists:
                print(f"[--] Meeting '{title}' already exists, skipping")
                continue

            mid = generate_meeting_id()
            meeting = Meeting(
                meeting_id=mid,
                title=title,
                description=f"Scheduled meeting: {title}",
                host_id=1,
                meeting_type="scheduled",
                status="waiting",
                scheduled_at=now + timedelta(days=offset, hours=9),
                duration_mins=60,
                invite_link=make_invite_link(mid),
            )
            db.add(meeting)
            print(f"[OK] Seeded upcoming meeting: {title}")

        db.commit()

        # ── 3. Recent ended meetings (past 14 days) ───────────────────────────
        ended_meetings_meta = [
            ("Backend API Architecture Review", 2),
            ("Q2 Retrospective", 5),
            ("Investor Demo Prep", 9),
            ("Frontend Code Review", 13),
        ]

        guest_names = [
            ["Alice Johnson", "Bob Smith", "Carol White"],
            ["David Lee", "Emma Davis"],
            ["Frank Miller", "Grace Wilson", "Henry Moore"],
            ["Ivy Taylor", "Jack Brown"],
        ]

        for (title, offset_days), guests in zip(ended_meetings_meta, guest_names):
            exists = db.query(Meeting).filter(Meeting.title == title).first()
            if exists:
                print(f"[--] Meeting '{title}' already exists, skipping")
                continue

            scheduled = now - timedelta(days=offset_days, hours=2)
            ended = scheduled + timedelta(hours=1)
            mid = generate_meeting_id()

            meeting = Meeting(
                meeting_id=mid,
                title=title,
                description=f"Completed meeting: {title}",
                host_id=1,
                meeting_type="scheduled",
                status="ended",
                scheduled_at=scheduled,
                duration_mins=60,
                invite_link=make_invite_link(mid),
                ended_at=ended,
            )
            db.add(meeting)
            db.flush()  # Get meeting_id into DB without committing

            # Seed host as participant
            host_participant_exists = (
                db.query(Participant)
                .filter(Participant.meeting_id == mid, Participant.is_host == True)
                .first()
            )
            if not host_participant_exists:
                db.add(
                    Participant(
                        meeting_id=mid,
                        user_id=1,
                        display_name="Shrayash Awasthi",
                        joined_at=scheduled,
                        left_at=ended,
                        is_host=True,
                    )
                )

            # Seed guest participants
            for guest_name in guests:
                db.add(
                    Participant(
                        meeting_id=mid,
                        user_id=None,  # Guest — no user account
                        display_name=guest_name,
                        joined_at=scheduled + timedelta(minutes=random.randint(1, 5)),
                        left_at=ended,
                        is_host=False,
                    )
                )

            print(f"[OK] Seeded ended meeting: {title} ({len(guests)} guests)")

        db.commit()
        print("\n[DONE] Seeding complete!")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
