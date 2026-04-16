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
    """Возвращает историю сообщений чата рабочего пространства.

    Поддерживает пагинацию. Сообщения возвращаются в хронологическом порядке.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :param limit: Максимальное количество сообщений (по умолчанию 50, максимум 100).
    :type limit: int
    :param offset: Смещение для пагинации.
    :type offset: int
    :return: Список сообщений с информацией об авторе.
    :rtype: list[ChatMessageResponse]

    HTTP метод: GET
    """
    return await service.get_history(workspace_id, user_id, limit, offset)


@router.delete("/{message_id}")
async def delete_chat_message(
    workspace_id: _uuid.UUID,
    message_id: _uuid.UUID,
    user_id: _uuid.UUID = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    """Удаляет сообщение чата.

    Удалить может только автор сообщения.

    :param message_id: Идентификатор сообщения.
    :type message_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict
    :raises 403: Нет прав на удаление.

    HTTP метод: DELETE
    """
    await service.delete_message(workspace_id, message_id, user_id)
    return {"ok": True}


@router.post("/upload")
async def upload_chat_file(
    workspace_id: _uuid.UUID,
    user_id: _uuid.UUID = Depends(get_current_user_id),
    file: UploadFile = File(...),
):
    """Загружает файл для отправки в чат.

    Максимальный размер файла — 10 МБ. Возвращает URL и имя файла для использования в сообщении.

    :param file: Загружаемый файл.
    :type file: UploadFile
    :return: Словарь с полями file_url и file_name.
    :rtype: dict
    :raises 400: Файл слишком большой.

    HTTP метод: POST
    """
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
    """Отдаёт файл, прикреплённый к сообщению чата.

    Публичный эндпоинт для участников рабочего пространства.

    :param filename: Имя файла на сервере.
    :type filename: str
    :return: Файл.
    :rtype: FileResponse
    :raises 404: Файл не найден.

    HTTP метод: GET
    """
    from fastapi.responses import FileResponse
    safe = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, "chat", str(workspace_id), safe)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path)
