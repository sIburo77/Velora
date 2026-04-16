import uuid

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user_id, get_activity_log_service
from app.schemas.activity_log import ActivityLogResponse
from app.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/workspaces/{workspace_id}/activity", tags=["Activity"])


@router.get("", response_model=list[ActivityLogResponse])
async def get_activity_logs(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: ActivityLogService = Depends(get_activity_log_service),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """Возвращает журнал активности рабочего пространства.

    Содержит записи о действиях пользователей: создание, обновление и удаление задач, колонок и других объектов.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :param limit: Максимальное количество записей (по умолчанию 50, максимум 200).
    :type limit: int
    :param offset: Смещение для пагинации.
    :type offset: int
    :return: Список записей активности.
    :rtype: list[ActivityLogResponse]

    HTTP метод: GET
    """
    return await service.get_logs(workspace_id, user_id, limit, offset)
