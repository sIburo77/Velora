import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_tag_service
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter(prefix="/workspaces/{workspace_id}", tags=["tags"])


@router.get("/tags", response_model=list[TagResponse])
async def get_tags(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    return await service.get_workspace_tags(workspace_id, user_id)


@router.post("/tags", response_model=TagResponse, status_code=201)
async def create_tag(
    workspace_id: uuid.UUID,
    data: TagCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    return await service.create_tag(workspace_id, data, user_id)


@router.delete("/tags/{tag_id}", status_code=204)
async def delete_tag(
    workspace_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    await service.delete_tag(workspace_id, tag_id, user_id)


@router.post("/board/tasks/{task_id}/tags/{tag_id}", status_code=204)
async def add_tag_to_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    await service.add_tag_to_task(workspace_id, task_id, tag_id, user_id)


@router.delete("/board/tasks/{task_id}/tags/{tag_id}", status_code=204)
async def remove_tag_from_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    await service.remove_tag_from_task(workspace_id, task_id, tag_id, user_id)
