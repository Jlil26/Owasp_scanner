import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PermissionResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class RolePermissionsUpdate(BaseModel):
    permission_ids: List[uuid.UUID]
