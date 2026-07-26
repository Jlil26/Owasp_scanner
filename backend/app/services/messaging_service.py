import uuid
import re
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.messaging import Thread, Message
from app.models.user import User
from app.models.vulnerability import Vulnerability
from app.models.enums import NotificationType
from app.models.activity import CollaborationActivity
from app.services.notification_service import NotificationService

class MessagingService:
    def __init__(self, db: Session):
        self.db = db
        self.notif_svc = NotificationService(db)

    def create_thread(
        self,
        vulnerability_id: uuid.UUID,
        creator_id: uuid.UUID,
        subject: Optional[str] = None,
        initial_message: Optional[str] = None
    ) -> Thread:
        vuln = self.db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
        if not vuln:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vulnerability not found")

        thread = Thread(
            vulnerability_id=vulnerability_id,
            subject=subject or f"Discussion: {vuln.title}"
        )
        self.db.add(thread)
        self.db.commit()
        self.db.refresh(thread)

        if initial_message:
            self.send_message(thread.id, creator_id, initial_message)

        # Log Activity
        act = CollaborationActivity(
            company_id=vuln.company_id,
            user_id=creator_id,
            action="THREAD_CREATED",
            resource_type="vulnerability",
            resource_id=vulnerability_id,
            summary=f"Created discussion thread: '{thread.subject}'"
        )
        self.db.add(act)
        self.db.commit()

        return thread

    def get_thread(self, thread_id: uuid.UUID) -> Thread:
        thread = self.db.query(Thread).filter(Thread.id == thread_id).first()
        if not thread:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")
        return thread

    def list_threads_for_vulnerability(self, vulnerability_id: uuid.UUID) -> List[Thread]:
        return self.db.query(Thread).filter(Thread.vulnerability_id == vulnerability_id).all()

    def list_company_threads(self, company_id: uuid.UUID) -> List[Thread]:
        return (
            self.db.query(Thread)
            .join(Vulnerability)
            .filter(Vulnerability.company_id == company_id)
            .order_by(Thread.updated_at.desc())
            .all()
        )

    def send_message(self, thread_id: uuid.UUID, sender_id: uuid.UUID, content: str) -> Message:
        thread = self.get_thread(thread_id)
        sender = self.db.query(User).filter(User.id == sender_id).first()
        sender_name = f"{sender.first_name} {sender.last_name}" if sender else "User"

        message = Message(
            thread_id=thread_id,
            sender_id=sender_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)

        # Parse mentions (@username or @first_name or @email)
        mentioned_users = self._extract_and_notify_mentions(
            content=content,
            sender_id=sender_id,
            context_title=f"Thread: {thread.subject}"
        )

        # Log Activity
        act = CollaborationActivity(
            company_id=thread.vulnerability.company_id,
            user_id=sender_id,
            action="MESSAGE_SENT",
            resource_type="thread",
            resource_id=thread_id,
            summary=f"Sent message in thread '{thread.subject}'",
            details=content[:200]
        )
        self.db.add(act)
        self.db.commit()

        return message

    def _extract_and_notify_mentions(self, content: str, sender_id: uuid.UUID, context_title: str) -> List[User]:
        mentions = re.findall(r"@([a-zA-Z0-9_.\-]+)", content)
        if not mentions:
            return []

        sender = self.db.query(User).filter(User.id == sender_id).first()
        sender_name = f"{sender.first_name} {sender.last_name}" if sender else "Someone"

        notified_users = []
        for m in set(mentions):
            # match by email prefix, first_name or last_name
            user = (
                self.db.query(User)
                .filter(
                    (User.first_name.ilike(f"%{m}%")) |
                    (User.last_name.ilike(f"%{m}%")) |
                    (User.email.ilike(f"%{m}%"))
                )
                .first()
            )
            if user and user.id != sender_id:
                notified_users.append(user)
                self.notif_svc.create_internal_notification(
                    user_id=user.id,
                    notification_type=NotificationType.MENTION,
                    title=f"Mentioned by {sender_name}",
                    message=f"{sender_name} mentioned you in {context_title}: '{content[:120]}'"
                )
        return notified_users
