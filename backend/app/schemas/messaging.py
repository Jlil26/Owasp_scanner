from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import uuid

class MessageCreate(BaseModel):
    thread_id: uuid.UUID
    content: str

class MessageResponse(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ThreadCreate(BaseModel):
    vulnerability_id: uuid.UUID
    subject: Optional[str] = None
    initial_message: Optional[str] = None

class ThreadResponse(BaseModel):
    id: uuid.UUID
    vulnerability_id: uuid.UUID
    subject: Optional[str] = None
    messages: List[MessageResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
