import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID | None
    content: str
    created_at: datetime
    updated_at: datetime
    author_name: str | None = None
    author_email: str | None = None

    model_config = {"from_attributes": True}
