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
    return await service.get_user_workspaces(user_id)


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    data: WorkspaceCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    return await service.create_workspace(data, user_id)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    return await service.update_workspace(workspace_id, data, user_id)


@router.post("/{workspace_id}/avatar", response_model=WorkspaceResponse)
async def upload_workspace_avatar(
    workspace_id: uuid.UUID,
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
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
    return await service.update_avatar(workspace_id, user_id, None)


@router.get("/{workspace_id}/avatar/{filename}")
async def serve_workspace_avatar(workspace_id: uuid.UUID, filename: str):
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
    await service.delete_workspace(workspace_id, user_id)
    return {"detail": "Workspace deleted"}


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
async def list_members(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    return await service.get_members(workspace_id, user_id)


@router.patch("/{workspace_id}/members/{member_user_id}/role", response_model=WorkspaceMemberResponse)
async def update_member_role(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    data: RoleUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    return await service.update_member_role(workspace_id, member_user_id, data, user_id)


@router.delete("/{workspace_id}/members/{member_user_id}")
async def remove_member(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    await service.remove_member(workspace_id, member_user_id, user_id)
    return {"detail": "Member removed"}
