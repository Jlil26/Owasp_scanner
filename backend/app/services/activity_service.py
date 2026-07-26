import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.activity import CollaborationActivity

class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def get_activities(
        self,
        company_id: uuid.UUID,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[CollaborationActivity], int]:
        query = self.db.query(CollaborationActivity).filter(CollaborationActivity.company_id == company_id)

        if resource_type:
            query = query.filter(CollaborationActivity.resource_type == resource_type)
        if resource_id:
            query = query.filter(CollaborationActivity.resource_id == resource_id)
        if user_id:
            query = query.filter(CollaborationActivity.user_id == user_id)

        total = query.count()
        items = (
            query.order_by(desc(CollaborationActivity.created_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        return items, total
