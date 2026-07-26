import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.activity import CollaborationActivityResponse
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["Collaboration Activity & Audit Feed"])

@router.get("", response_model=List[CollaborationActivityResponse])
def get_activities(
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[uuid.UUID] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = ActivityService(db)
    items, _ = svc.get_activities(
        company_id=current_user.company_id,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        page=page,
        size=size
    )
    return [
        CollaborationActivityResponse(
            id=act.id,
            company_id=act.company_id,
            user_id=act.user_id,
            user_name=f"{act.user.first_name} {act.user.last_name}" if act.user else "User",
            user_role=act.user.role.name if act.user and act.user.role else "USER",
            action=act.action,
            resource_type=act.resource_type,
            resource_id=act.resource_id,
            summary=act.summary,
            details=act.details,
            created_at=act.created_at
        ) for act in items
    ]
