import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_comment_service
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.comment_service import CommentService

router = APIRouter(
    prefix="/workspaces/{workspace_id}/board/tasks/{task_id}/comments",
    tags=["Comments"],
)


@router.get("", response_model=list[CommentResponse])
async def get_comments(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
):
    return await service.get_comments(workspace_id, task_id, user_id)


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: CommentCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
):
    return await service.create_comment(workspace_id, task_id, data, user_id)


@router.delete("/{comment_id}")
async def delete_comment(
    workspace_id: uuid.UUID,
    comment_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
):
    await service.delete_comment(workspace_id, comment_id, user_id)
    return {"detail": "Comment deleted"}
