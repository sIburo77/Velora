import uuid
from datetime import datetime

from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    uploaded_by: uuid.UUID | None
    created_at: datetime
    uploader_name: str | None = None

    model_config = {"from_attributes": True}
