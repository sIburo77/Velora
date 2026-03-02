import uuid
from datetime import datetime

from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    template: str | None = None


class WorkspaceUpdate(BaseModel):
    name: str


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    avatar_url: str | None = None
    created_at: datetime
    role: str | None = None

    model_config = {"from_attributes": True}


class RoleUpdate(BaseModel):
    role: str


class WorkspaceMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    joined_at: datetime
    user_email: str | None = None
    user_name: str | None = None
    avatar_url: str | None = None

    model_config = {"from_attributes": True}
