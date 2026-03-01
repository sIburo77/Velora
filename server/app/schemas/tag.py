import uuid
from datetime import datetime

from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    color: str = "#8b5cf6"


class TagResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
