import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_tag_service
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter(prefix="/workspaces/{workspace_id}", tags=["Tags"])


@router.get("/tags", response_model=list[TagResponse])
async def get_tags(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    """Возвращает список всех тегов рабочего пространства.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Список тегов с именем и цветом.
    :rtype: list[TagResponse]

    HTTP метод: GET
    """
    return await service.get_workspace_tags(workspace_id, user_id)


@router.post("/tags", response_model=TagResponse, status_code=201)
async def create_tag(
    workspace_id: uuid.UUID,
    data: TagCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    """Создаёт новый тег в рабочем пространстве.

    :param data: Объект с полями name и color (HEX-код).
    :type data: TagCreate
    :return: Созданный тег.
    :rtype: TagResponse

    HTTP метод: POST
    """
    return await service.create_tag(workspace_id, data, user_id)


@router.delete("/tags/{tag_id}", status_code=204)
async def delete_tag(
    workspace_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    """Удаляет тег из рабочего пространства.

    Тег удаляется из всех задач, которым он был назначен.

    :param tag_id: Идентификатор тега.
    :type tag_id: uuid.UUID
    :raises 404: Тег не найден.

    HTTP метод: DELETE
    """
    await service.delete_tag(workspace_id, tag_id, user_id)


@router.post("/board/tasks/{task_id}/tags/{tag_id}", status_code=204)
async def add_tag_to_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    """Назначает тег задаче.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :param tag_id: Идентификатор тега.
    :type tag_id: uuid.UUID

    HTTP метод: POST
    """
    await service.add_tag_to_task(workspace_id, task_id, tag_id, user_id)


@router.delete("/board/tasks/{task_id}/tags/{tag_id}", status_code=204)
async def remove_tag_from_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    tag_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: TagService = Depends(get_tag_service),
):
    """Убирает тег с задачи.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :param tag_id: Идентификатор тега.
    :type tag_id: uuid.UUID

    HTTP метод: DELETE
    """
    await service.remove_tag_from_task(workspace_id, task_id, tag_id, user_id)
