import uuid
from datetime import datetime
from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    user_avatar: str | None = None
    action: str
    target_type: str
    target_name: str
    details: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
