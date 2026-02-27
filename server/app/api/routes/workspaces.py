import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_workspace_service
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


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


@router.delete("/{workspace_id}/members/{member_user_id}")
async def remove_member(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: WorkspaceService = Depends(get_workspace_service),
):
    await service.remove_member(workspace_id, member_user_id, user_id)
    return {"detail": "Member removed"}
