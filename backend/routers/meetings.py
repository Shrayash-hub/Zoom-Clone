"""Meetings router — all meeting CRUD + join endpoints."""

from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
import random
import os
from datetime import datetime
import schemas
import models
from database import get_db

router = APIRouter(prefix="/meetings", tags=["meetings"])

HOST_ID = 1  # No auth — single default user


# ── Helpers ───────────────────────────────────────────────────────────────────

def format_meeting_id(raw: str) -> str:
    """Format a numeric meeting ID string with spaces for display.

    9 digits  → 'XXX XXX XXX'
    10 digits → 'XXX XXX XXXX'
    Other     → returned as-is
    """
    digits = raw.replace(" ", "")
    if len(digits) == 9:
        return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
    if len(digits) == 10:
        return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
    return raw


def _meeting_to_dict_with_count(meeting: models.Meeting, count: int) -> dict:
    """Serialize a Meeting ORM object + count into a MeetingWithCount-compatible dict."""
    return {
        "id": meeting.id,
        "meeting_id": format_meeting_id(meeting.meeting_id),
        "title": meeting.title,
        "description": meeting.description,
        "host_id": meeting.host_id,
        "meeting_type": meeting.meeting_type,
        "status": meeting.status,
        "scheduled_at": meeting.scheduled_at.isoformat() if meeting.scheduled_at else None,
        "duration_mins": meeting.duration_mins,
        "invite_link": meeting.invite_link,
        "passcode": meeting.passcode,
        "created_at": meeting.created_at.isoformat(),
        "ended_at": meeting.ended_at.isoformat() if meeting.ended_at else None,
        "participant_count": count,
    }


def _query_with_count(db: Session):
    """Base query: Meeting joined with participant count."""
    return (
        db.query(models.Meeting, func.count(models.Participant.id).label("participant_count"))
        .outerjoin(
            models.Participant,
            models.Participant.meeting_id == models.Meeting.meeting_id,
        )
        .filter(models.Meeting.host_id == HOST_ID)
        .group_by(models.Meeting.id)
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def list_meetings(type: Optional[str] = None, db: Session = Depends(get_db)):
    """Return meetings filtered by type.

    ?type=upcoming → status IN ('waiting', 'active'), ordered by scheduled_at ASC
    ?type=recent   → status='ended', ordered by ended_at DESC, limit 10
    (no param)     → { "upcoming": [...], "recent": [...] }
    """
    if type == "upcoming":
        rows = (
            _query_with_count(db)
            .filter(models.Meeting.status.in_(["waiting", "active"]))
            .order_by(models.Meeting.scheduled_at.asc())
            .all()
        )
        return [_meeting_to_dict_with_count(m, c) for m, c in rows]

    if type == "recent":
        rows = (
            _query_with_count(db)
            .filter(models.Meeting.status == "ended")
            .order_by(models.Meeting.ended_at.desc())
            .limit(10)
            .all()
        )
        return [_meeting_to_dict_with_count(m, c) for m, c in rows]

    # No filter — return both sections in one payload
    upcoming_rows = (
        _query_with_count(db)
        .filter(models.Meeting.status.in_(["waiting", "active"]))
        .order_by(models.Meeting.scheduled_at.asc())
        .all()
    )
    recent_rows = (
        _query_with_count(db)
        .filter(models.Meeting.status == "ended")
        .order_by(models.Meeting.ended_at.desc())
        .limit(10)
        .all()
    )
    return {
        "upcoming": [_meeting_to_dict_with_count(m, c) for m, c in upcoming_rows],
        "recent":   [_meeting_to_dict_with_count(m, c) for m, c in recent_rows],
    }


@router.post("/pmi/start", tags=["meetings"])
def start_pmi_meeting(db: Session = Depends(get_db)):
    """Start or resume the host's Personal Meeting ID (PMI) meeting."""
    user = db.query(models.User).filter(models.User.id == HOST_ID).first()
    pmi_id = user.personal_meeting_id  # raw 9-digit string e.g. "554269989"

    # Check if a PMI meeting already exists and is not ended
    existing = db.query(models.Meeting).filter(
        models.Meeting.meeting_id == pmi_id,
        models.Meeting.status != "ended"
    ).first()

    if existing:
        # Reuse existing PMI meeting — set to active
        existing.status = "active"
        db.commit()
        db.refresh(existing)
        return _meeting_to_dict_with_count(existing, 1)

    # Create new PMI meeting if none exists or all previous ones ended
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    meeting = models.Meeting(
        meeting_id=pmi_id,
        title="My Personal Meeting ID (PMI)",
        host_id=HOST_ID,
        meeting_type="personal",
        status="active",
        invite_link=f"{frontend_url}/join?id={pmi_id}",
        duration_mins=60
    )
    db.add(meeting)

    # Add host as participant
    participant = models.Participant(
        meeting_id=pmi_id,
        user_id=HOST_ID,
        display_name="Shrayash Awasthi",
        is_host=True
    )
    db.add(participant)
    db.commit()
    db.refresh(meeting)
    return _meeting_to_dict_with_count(meeting, 1)


@router.post("", response_model=schemas.MeetingWithCount, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Create a new instant or scheduled meeting (Phase 3)."""
    # 1. Generate unique 9-digit meeting ID
    while True:
        # Generate 9-digit number
        raw_id = str(random.randint(100000000, 999999999))
        existing = db.query(models.Meeting).filter(models.Meeting.meeting_id == raw_id).first()
        if not existing:
            break
            
    # 2. Determine initial status
    initial_status = "active" if payload.meeting_type == "instant" else "waiting"
    
    # 3. Create meeting
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    invite_link = f"{frontend_url}/join?id={raw_id}"
    
    new_meeting = models.Meeting(
        meeting_id=raw_id,
        title=payload.title,
        description=payload.description,
        host_id=HOST_ID,
        meeting_type=payload.meeting_type,
        status=initial_status,
        scheduled_at=payload.scheduled_at,
        duration_mins=payload.duration_mins,
        passcode=payload.passcode,
        invite_link=invite_link
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    # 4. Add host participant (only for instant meetings)
    participant_count = 0
    if payload.meeting_type == "instant":
        host_participant = models.Participant(
            meeting_id=raw_id,
            user_id=HOST_ID,
            display_name="Shrayash Awasthi",
            is_host=True
        )
        db.add(host_participant)
        db.commit()
        participant_count = 1
    
    # 5. Return with proper count
    return _meeting_to_dict_with_count(new_meeting, participant_count)


@router.get("/{meeting_id}", response_model=schemas.MeetingRead)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Return a single meeting by its raw meeting_id string."""
    stripped_id = meeting_id.replace(" ", "")
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_id == stripped_id).first()
    
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
    if meeting.status == "ended":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This meeting has ended")
        
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Delete a meeting (Phase 3)."""
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
    meeting.status = "ended"
    meeting.ended_at = datetime.utcnow()
    db.commit()
    
    return {"success": True}


@router.post("/{meeting_id}/join", status_code=status.HTTP_201_CREATED)
def join_meeting(meeting_id: str, payload: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    """Register a participant joining a meeting (Phase 4)."""
    stripped_id = meeting_id.replace(" ", "")
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_id == stripped_id).first()
    
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        
    if meeting.status == "ended":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This meeting has ended")
    
    # Passcode validation
    if meeting.passcode:
        if not payload.passcode:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This meeting requires a passcode")
        if payload.passcode != meeting.passcode:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Incorrect passcode")
        
    participant = models.Participant(
        meeting_id=stripped_id,
        user_id=None,
        display_name=payload.display_name,
        is_host=False,
        joined_at=datetime.utcnow()
    )
    db.add(participant)
    db.commit()
    
    return {"success": True, "meeting_id": stripped_id}
