"""Participants router — list participants for a given meeting."""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/meetings", tags=["participants"])


@router.get("/{meeting_id}/participants", response_model=List[schemas.ParticipantRead])
def list_participants(meeting_id: str, db: Session = Depends(get_db)):
    """Return all active participants for the given meeting_id."""
    clean_id = meeting_id.replace(" ", "")
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_id == clean_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    
    return (
        db.query(models.Participant)
        .filter(
            models.Participant.meeting_id == clean_id,
            models.Participant.left_at.is_(None)
        )
        .order_by(models.Participant.joined_at.asc())
        .all()
    )


@router.post("/{meeting_id}/participants/{participant_id}/remove")
def remove_participant(meeting_id: str, participant_id: int, db: Session = Depends(get_db)):
    """Remove a participant by setting left_at to current UTC time."""
    clean_id = meeting_id.replace(" ", "")
    participant = (
        db.query(models.Participant)
        .filter(
            models.Participant.id == participant_id,
            models.Participant.meeting_id == clean_id
        )
        .first()
    )
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
        
    participant.left_at = datetime.utcnow()
    db.commit()
    return {"success": True}
