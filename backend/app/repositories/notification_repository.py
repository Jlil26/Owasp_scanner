import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.enums import NotificationType

class NotificationRepository:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def create_notification(
        self,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str
    ) -> Notification:
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            is_read=False
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def get_user_notifications(
        self,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Notification], int]:
        query = select(Notification).where(Notification.user_id == user_id)
        if is_read is not None:
            query = query.where(Notification.is_read == is_read)

        count_stmt = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        offset = (page - 1) * size
        stmt = query.order_by(desc(Notification.created_at)).offset(offset).limit(size)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        stmt = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        notif = self.db.execute(stmt).scalar_one_or_none()
        if notif:
            notif.is_read = True
            self.db.commit()
            self.db.refresh(notif)
        return notif

    def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount
