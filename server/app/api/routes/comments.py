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
    """Возвращает список комментариев к задаче.

    Доступ: участник рабочего пространства.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :return: Список комментариев с информацией об авторе.
    :rtype: list[CommentResponse]

    HTTP метод: GET
    """
    return await service.get_comments(workspace_id, task_id, user_id)


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: CommentCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
):
    """Создаёт комментарий к задаче.

    :param data: Объект с полем content (текст комментария).
    :type data: CommentCreate
    :return: Созданный комментарий.
    :rtype: CommentResponse

    HTTP метод: POST
    """
    return await service.create_comment(workspace_id, task_id, data, user_id)


@router.delete("/{comment_id}")
async def delete_comment(
    workspace_id: uuid.UUID,
    comment_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: CommentService = Depends(get_comment_service),
):
    """Удаляет комментарий.

    Удалить может только автор комментария.

    :param comment_id: Идентификатор комментария.
    :type comment_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict
    :raises 403: Нет прав на удаление.
    :raises 404: Комментарий не найден.

    HTTP метод: DELETE
    """
    await service.delete_comment(workspace_id, comment_id, user_id)
    return {"detail": "Comment deleted"}
