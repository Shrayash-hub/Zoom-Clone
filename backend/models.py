"""SQLAlchemy ORM models matching the schema defined in DATABASE.md."""

from datetime import datetime
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    avatar_url = Column(Text, nullable=True)
    personal_meeting_id = Column(Text, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    meetings = relationship("Meeting", back_populates="host", foreign_keys="Meeting.host_id")
    participations = relationship("Participant", back_populates="user")


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint(
            "meeting_type IN ('instant', 'scheduled', 'personal')",
            name="ck_meetings_type",
        ),
        CheckConstraint(
            "status IN ('waiting', 'active', 'ended')",
            name="ck_meetings_status",
        ),
        # Indexes from DATABASE.md
        Index("idx_meetings_host", "host_id"),
        Index("idx_meetings_status", "status"),
        Index("idx_meetings_scheduled", "scheduled_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meeting_type = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="waiting")
    scheduled_at = Column(DateTime, nullable=True)
    duration_mins = Column(Integer, default=60)
    invite_link = Column(Text, nullable=False)
    passcode = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    host = relationship("User", back_populates="meetings", foreign_keys=[host_id])
    participants = relationship("Participant", back_populates="meeting", foreign_keys="Participant.meeting_id")


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (
        # Index from DATABASE.md
        Index("idx_participants_meeting", "meeting_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Text, ForeignKey("meetings.meeting_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for guests
    display_name = Column(Text, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    is_host = Column(Boolean, default=False, nullable=False)

    # Relationships
    meeting = relationship("Meeting", back_populates="participants", foreign_keys=[meeting_id])
    user = relationship("User", back_populates="participations")
