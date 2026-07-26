import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.notification import NotificationResponse, NotificationReadResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get(
    "",
    response_model=ApiResponse[PaginatedResponse[NotificationResponse]],
    summary="Get user's internal notifications"
)
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    items, total = service.get_my_notifications(
        user_id=current_user.id,
        is_read=is_read,
        page=page,
        size=size
    )

    items_data = [NotificationResponse.model_validate(n) for n in items]
    paginated = PaginatedResponse(
        items=items_data,
        total=total,
        page=page,
        size=size
    )

    return ApiResponse(
        success=True,
        message="Notifications retrieved successfully.",
        data=paginated
    )

@router.patch(
    "/{id}/read",
    response_model=ApiResponse[NotificationReadResponse],
    summary="Mark notification as read"
)
def mark_notification_read(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    notif = service.mark_read(notification_id=id, user_id=current_user.id)

    return ApiResponse(
        success=True,
        message="Notification marked as read.",
        data=NotificationReadResponse(id=notif.id, is_read=notif.is_read)
    )

@router.post(
    "/read-all",
    response_model=ApiResponse[dict],
    summary="Mark all user notifications as read"
)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    count = service.mark_all_read(user_id=current_user.id)

    return ApiResponse(
        success=True,
        message=f"{count} notifications marked as read.",
        data={"count": count}
    )
