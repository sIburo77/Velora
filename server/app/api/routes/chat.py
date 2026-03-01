import os
import uuid as _uuid

import aiofiles
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException

from app.api.dependencies import get_current_user_id, get_chat_service
from app.core.config import settings
from app.schemas.chat import ChatMessageResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/workspaces/{workspace_id}/chat", tags=["Chat"])


@router.get("/history", response_model=list[ChatMessageResponse])
async def get_chat_history(
    workspace_id: _uuid.UUID,
    user_id: _uuid.UUID = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.get_history(workspace_id, user_id, limit, offset)


@router.post("/upload")
async def upload_chat_file(
    workspace_id: _uuid.UUID,
    user_id: _uuid.UUID = Depends(get_current_user_id),
    file: UploadFile = File(...),
):
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(400, f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    chat_dir = os.path.join(settings.UPLOAD_DIR, "chat", str(workspace_id))
    os.makedirs(chat_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1]
    stored = f"{_uuid.uuid4()}{ext}"
    path = os.path.join(chat_dir, stored)

    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    file_url = f"/api/workspaces/{workspace_id}/chat/files/{stored}"
    return {"file_url": file_url, "file_name": file.filename}


@router.get("/files/{filename}")
async def get_chat_file(workspace_id: _uuid.UUID, filename: str):
    from fastapi.responses import FileResponse
    safe = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, "chat", str(workspace_id), safe)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path)
