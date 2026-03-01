import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str | None
    workspace_id: uuid.UUID | None
    task_id: uuid.UUID | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int
