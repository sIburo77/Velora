import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

from app.api.dependencies import get_current_user_id, get_workspace_service
from app.core.config import settings
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    RoleUpdate,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Возвращает список рабочих пространств текущего пользователя.

    :return: Список рабочих пространств, в которых пользователь является участником.
    :rtype: list[WorkspaceResponse]

    HTTP метод: GET
    """
    return await service.get_user_workspaces(user_id)


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    data: WorkspaceCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Создаёт новое рабочее пространство.

    Пользователь автоматически становится владельцем (role=owner). Создаётся канбан-доска по умолчанию.

    :param data: Объект с полем name (название пространства).
    :type data: WorkspaceCreate
    :return: Созданное рабочее пространство.
    :rtype: WorkspaceResponse

    HTTP метод: POST
    """
    return await service.create_workspace(data, user_id)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Обновляет рабочее пространство (переименование).

    Доступ: владелец рабочего пространства.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :param data: Объект с обновляемыми полями.
    :type data: WorkspaceUpdate
    :return: Обновлённое пространство.
    :rtype: WorkspaceResponse
    :raises 403: Недостаточно прав.

    HTTP метод: PATCH
    """
    return await service.update_workspace(workspace_id, data, user_id)


@router.post("/{workspace_id}/avatar", response_model=WorkspaceResponse)
async def upload_workspace_avatar(
    workspace_id: uuid.UUID,
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Загружает аватар рабочего пространства.

    Принимает файл изображения (JPEG, PNG, GIF, WebP), максимальный размер — 10 МБ.

    :param file: Загружаемый файл изображения.
    :type file: UploadFile
    :return: Обновлённое пространство с новым avatar_url.
    :rtype: WorkspaceResponse
    :raises 400: Неподдерживаемый формат или файл слишком большой.

    HTTP метод: POST
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, GIF, WebP images are allowed")
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, "File too large")

    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars", "workspaces")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    stored = f"{uuid.uuid4()}{ext}"
    async with aiofiles.open(os.path.join(avatar_dir, stored), "wb") as f:
        await f.write(content)

    avatar_url = f"/api/workspaces/{workspace_id}/avatar/{stored}"
    return await service.update_avatar(workspace_id, user_id, avatar_url)


@router.delete("/{workspace_id}/avatar", response_model=WorkspaceResponse)
async def delete_workspace_avatar(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Удаляет аватар рабочего пространства.

    :return: Обновлённое пространство с avatar_url = null.
    :rtype: WorkspaceResponse

    HTTP метод: DELETE
    """
    return await service.update_avatar(workspace_id, user_id, None)


@router.get("/{workspace_id}/avatar/{filename}")
async def serve_workspace_avatar(workspace_id: uuid.UUID, filename: str):
    """Отдаёт файл аватара рабочего пространства.

    Публичный эндпоинт, не требует аутентификации.

    :param filename: Имя файла аватара.
    :type filename: str
    :return: Файл изображения.
    :rtype: FileResponse
    :raises 404: Файл не найден.

    HTTP метод: GET
    """
    path = os.path.join(settings.UPLOAD_DIR, "avatars", "workspaces", filename)
    if not os.path.isfile(path):
        raise HTTPException(404, "Not found")
    return FileResponse(path)


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Удаляет рабочее пространство.

    Каскадно удаляет все связанные данные: доски, колонки, задачи, чат, приглашения.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict
    :raises 403: Недостаточно прав (только owner).

    HTTP метод: DELETE
    """
    await service.delete_workspace(workspace_id, user_id)
    return {"detail": "Workspace deleted"}


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
async def list_members(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Возвращает список участников рабочего пространства.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Список участников с именем, email, ролью и аватаром.
    :rtype: list[WorkspaceMemberResponse]

    HTTP метод: GET
    """
    return await service.get_members(workspace_id, user_id)


@router.patch("/{workspace_id}/members/{member_user_id}/role", response_model=WorkspaceMemberResponse)
async def update_member_role(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    data: RoleUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Изменяет роль участника рабочего пространства.

    Доступ: владелец рабочего пространства.

    :param member_user_id: Идентификатор пользователя, чью роль меняем.
    :type member_user_id: uuid.UUID
    :param data: Объект с полем role (owner или member).
    :type data: RoleUpdate
    :return: Обновлённые данные участника.
    :rtype: WorkspaceMemberResponse
    :raises 403: Недостаточно прав.

    HTTP метод: PATCH
    """
    return await service.update_member_role(workspace_id, member_user_id, data, user_id)


@router.delete("/{workspace_id}/members/{member_user_id}")
async def remove_member(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    """Удаляет участника из рабочего пространства.

    Владелец может удалить любого участника. Участник может удалить только себя (выйти).

    :param member_user_id: Идентификатор удаляемого пользователя.
    :type member_user_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict
    :raises 403: Недостаточно прав.

    HTTP метод: DELETE
    """
    await service.remove_member(workspace_id, member_user_id, user_id)
    return {"detail": "Member removed"}
