import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

from app.api.dependencies import get_current_user_id, get_user_service
from app.core.config import settings
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.get("/me", response_model=UserResponse)
async def get_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    """Возвращает профиль текущего пользователя.

    Доступ: аутентифицированный пользователь.

    :param user_id: Идентификатор пользователя (из JWT-токена).
    :type user_id: uuid.UUID
    :return: Данные профиля пользователя.
    :rtype: UserResponse
    :raises 401: Пользователь не аутентифицирован.

    HTTP метод: GET
    """
    return await service.get_profile(user_id)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    """Обновляет профиль текущего пользователя.

    Позволяет изменить имя пользователя.

    :param data: Объект с обновляемыми полями (name).
    :type data: UserUpdate
    :return: Обновлённые данные профиля.
    :rtype: UserResponse

    HTTP метод: PATCH
    """
    return await service.update_profile(user_id, data)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    """Загружает аватар пользователя.

    Принимает файл изображения (JPEG, PNG, GIF, WebP), максимальный размер — 10 МБ.

    :param file: Загружаемый файл изображения.
    :type file: UploadFile
    :return: Обновлённые данные профиля с новым avatar_url.
    :rtype: UserResponse
    :raises 400: Неподдерживаемый формат или файл слишком большой.

    HTTP метод: POST
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, GIF, WebP images are allowed")
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, "File too large")

    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars", "users")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    stored = f"{uuid.uuid4()}{ext}"
    async with aiofiles.open(os.path.join(avatar_dir, stored), "wb") as f:
        await f.write(content)

    avatar_url = f"/api/users/avatars/{stored}"
    return await service.update_avatar(user_id, avatar_url)


@router.delete("/me/avatar", response_model=UserResponse)
async def delete_avatar(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    """Удаляет аватар пользователя.

    :return: Обновлённые данные профиля с avatar_url = null.
    :rtype: UserResponse

    HTTP метод: DELETE
    """
    return await service.update_avatar(user_id, None)


@router.get("/avatars/{filename}")
async def serve_avatar(filename: str):
    """Отдаёт файл аватара пользователя.

    Публичный эндпоинт, не требует аутентификации.

    :param filename: Имя файла аватара.
    :type filename: str
    :return: Файл изображения.
    :rtype: FileResponse
    :raises 404: Файл не найден.

    HTTP метод: GET
    """
    path = os.path.join(settings.UPLOAD_DIR, "avatars", "users", filename)
    if not os.path.isfile(path):
        raise HTTPException(404, "Not found")
    return FileResponse(path)


@router.delete("/me")
async def delete_account(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    """Удаляет аккаунт текущего пользователя.

    Каскадно удаляет все связанные данные (членства, уведомления).

    :return: Подтверждение удаления.
    :rtype: dict
    :raises 401: Пользователь не аутентифицирован.

    HTTP метод: DELETE
    """
    await service.delete_account(user_id)
    return {"detail": "Account deleted"}
