import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    author_id: uuid.UUID | None
    content: str
    file_url: str | None = None
    file_name: str | None = None
    created_at: datetime
    author_name: str | None = None
    author_avatar: str | None = None
    reply_to_id: uuid.UUID | None = None
    reply_to_content: str | None = None
    reply_to_author_name: str | None = None

    model_config = {"from_attributes": True}
