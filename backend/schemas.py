"""Pydantic schemas for request validation and response serialization."""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

MeetingType = Literal["instant", "scheduled", "personal"]
MeetingStatus = Literal["waiting", "active", "ended"]


# ── User ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None
    personal_meeting_id: str


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Meeting ───────────────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_type: MeetingType
    scheduled_at: Optional[datetime] = None
    duration_mins: int = 60
    passcode: Optional[str] = None


class MeetingCreate(MeetingBase):
    pass


class MeetingRead(MeetingBase):
    id: int
    meeting_id: str
    host_id: int
    status: MeetingStatus
    invite_link: str
    created_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MeetingWithCount(MeetingRead):
    """MeetingRead extended with a live participant count."""
    participant_count: int


class MeetingsHomeResponse(BaseModel):
    """Response shape for GET /api/meetings with no type filter."""
    upcoming: list[MeetingWithCount]
    recent: list[MeetingWithCount]


# ── Participant ───────────────────────────────────────────────────────────────

class ParticipantBase(BaseModel):
    display_name: str
    is_host: bool = False


class ParticipantCreate(ParticipantBase):
    user_id: Optional[int] = None
    passcode: Optional[str] = None


class ParticipantRead(ParticipantBase):
    id: int
    meeting_id: str
    user_id: Optional[int] = None
    joined_at: datetime
    left_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
