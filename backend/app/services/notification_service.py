import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.notification import Notification
from app.models.enums import NotificationType
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def create_internal_notification(
        self,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str
    ) -> Notification:
        return self.repo.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message
        )

    def get_my_notifications(
        self,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Notification], int]:
        return self.repo.get_user_notifications(user_id, is_read, page, size)

    def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification:
        notif = self.repo.mark_as_read(notification_id, user_id)
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found."
            )
        return notif

    def mark_all_read(self, user_id: uuid.UUID) -> int:
        return self.repo.mark_all_as_read(user_id)
