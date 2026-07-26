import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.messaging import (
    ThreadCreate,
    ThreadResponse,
    MessageCreate,
    MessageResponse
)
from app.services.messaging_service import MessagingService

router = APIRouter(prefix="/messaging", tags=["Messaging & Collaboration Threads"])

@router.post("/threads", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    payload: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    thread = svc.create_thread(
        vulnerability_id=payload.vulnerability_id,
        creator_id=current_user.id,
        subject=payload.subject,
        initial_message=payload.initial_message
    )
    return thread

@router.get("/threads", response_model=List[ThreadResponse])
def list_threads(
    vulnerability_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    if vulnerability_id:
        return svc.list_threads_for_vulnerability(vulnerability_id)
    return svc.list_company_threads(current_user.company_id)

@router.get("/threads/{thread_id}", response_model=ThreadResponse)
def get_thread(
    thread_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    return svc.get_thread(thread_id)

@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def post_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    msg = svc.send_message(
        thread_id=payload.thread_id,
        sender_id=current_user.id,
        content=payload.content
    )
    return MessageResponse(
        id=msg.id,
        thread_id=msg.thread_id,
        sender_id=msg.sender_id,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        sender_role=current_user.role.name if current_user.role else "USER",
        content=msg.content,
        created_at=msg.created_at,
        updated_at=msg.updated_at
    )
