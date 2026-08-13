from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from routers.meetings import format_meeting_id

router = APIRouter(prefix="/users", tags=["users"])

HOST_ID = 1

@router.get("/me", response_model=schemas.UserRead)
def get_user_me(db: Session = Depends(get_db)):
    """Return the default user details (Phase 6)."""
    user = db.query(models.User).filter(models.User.id == HOST_ID).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "personal_meeting_id": format_meeting_id(user.personal_meeting_id),
        "created_at": user.created_at
    }
    return user_dict
