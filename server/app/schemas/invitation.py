import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    email: str
    token: str
    status: str
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}


class InvitationAccept(BaseModel):
    token: str
