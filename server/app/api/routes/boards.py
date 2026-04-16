import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user_id, get_board_service
from app.schemas.board import (
    BoardFullResponse,
    ColumnCreate,
    ColumnUpdate,
    ColumnResponse,
    TaskCreate,
    TaskUpdate,
    TaskMove,
    TaskReorder,
    TaskResponse,
    AnalyticsResponse,
    CalendarTaskResponse,
)
from app.services.board_service import BoardService

router = APIRouter(prefix="/workspaces/{workspace_id}/board", tags=["Board"])


@router.get("", response_model=BoardFullResponse)
async def get_board(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Возвращает полную структуру канбан-доски.

    Включает все колонки и задачи с тегами, комментариями и вложениями.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Доска со всеми колонками и задачами.
    :rtype: BoardFullResponse

    HTTP метод: GET
    """
    return await service.get_board(workspace_id, user_id)


# Columns
@router.post("/columns", response_model=ColumnResponse, status_code=201)
async def create_column(
    workspace_id: uuid.UUID,
    data: ColumnCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Создаёт новую колонку на доске.

    :param data: Объект с полем name (название колонки).
    :type data: ColumnCreate
    :return: Созданная колонка.
    :rtype: ColumnResponse

    HTTP метод: POST
    """
    return await service.create_column(workspace_id, data, user_id)


@router.patch("/columns/{column_id}", response_model=ColumnResponse)
async def update_column(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    data: ColumnUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Обновляет колонку (переименование).

    :param column_id: Идентификатор колонки.
    :type column_id: uuid.UUID
    :param data: Объект с обновляемыми полями.
    :type data: ColumnUpdate
    :return: Обновлённая колонка.
    :rtype: ColumnResponse

    HTTP метод: PATCH
    """
    return await service.update_column(workspace_id, column_id, data, user_id)


@router.delete("/columns/{column_id}")
async def delete_column(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Удаляет колонку и все задачи в ней.

    :param column_id: Идентификатор колонки.
    :type column_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict

    HTTP метод: DELETE
    """
    await service.delete_column(workspace_id, column_id, user_id)
    return {"detail": "Column deleted"}


@router.put("/columns/reorder", response_model=list[ColumnResponse])
async def reorder_columns(
    workspace_id: uuid.UUID,
    column_ids: list[uuid.UUID],
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Изменяет порядок колонок на доске.

    :param column_ids: Список идентификаторов колонок в новом порядке.
    :type column_ids: list[uuid.UUID]
    :return: Список колонок с обновлёнными позициями.
    :rtype: list[ColumnResponse]

    HTTP метод: PUT
    """
    return await service.reorder_columns(workspace_id, column_ids, user_id)


# Tasks
@router.post("/columns/{column_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    data: TaskCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Создаёт новую задачу в указанной колонке.

    Обязательные поля в JSON:
        - title (str): Заголовок задачи.

    Опциональные поля:
        - description (str): Описание задачи.
        - priority (str): Приоритет (low, medium, high).
        - deadline (datetime): Дедлайн задачи.
        - assigned_to (uuid): Идентификатор исполнителя.

    :param column_id: Идентификатор колонки.
    :type column_id: uuid.UUID
    :param data: Данные новой задачи.
    :type data: TaskCreate
    :return: Созданная задача.
    :rtype: TaskResponse

    HTTP метод: POST
    """
    return await service.create_task(workspace_id, column_id, data, user_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Обновляет задачу.

    Позволяет изменить заголовок, описание, приоритет, дедлайн, исполнителя и статус выполнения.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :param data: Объект с обновляемыми полями.
    :type data: TaskUpdate
    :return: Обновлённая задача.
    :rtype: TaskResponse

    HTTP метод: PATCH
    """
    return await service.update_task(workspace_id, task_id, data, user_id)


@router.delete("/tasks/{task_id}")
async def delete_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Удаляет задачу со всеми комментариями и вложениями.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict

    HTTP метод: DELETE
    """
    await service.delete_task(workspace_id, task_id, user_id)
    return {"detail": "Task deleted"}


@router.put("/columns/{column_id}/tasks/reorder")
async def reorder_tasks(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    data: TaskReorder,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Изменяет порядок задач внутри колонки.

    :param column_id: Идентификатор колонки.
    :type column_id: uuid.UUID
    :param data: Объект с полем task_ids — список ID задач в новом порядке.
    :type data: TaskReorder
    :return: Подтверждение операции.
    :rtype: dict

    HTTP метод: PUT
    """
    await service.reorder_tasks(workspace_id, column_id, data.task_ids, user_id)
    return {"detail": "Tasks reordered"}


@router.put("/tasks/{task_id}/move", response_model=TaskResponse)
async def move_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskMove,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Перемещает задачу в другую колонку.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :param data: Объект с полями column_id (новая колонка) и position (позиция).
    :type data: TaskMove
    :return: Обновлённая задача.
    :rtype: TaskResponse

    HTTP метод: PUT
    """
    return await service.move_task(workspace_id, task_id, data, user_id)


# Search
@router.get("/tasks/search", response_model=list[TaskResponse])
async def search_tasks(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
    q: str | None = Query(None),
    priority: str | None = Query(None),
    is_completed: bool | None = Query(None),
    has_deadline: bool | None = Query(None),
    deadline_from: datetime | None = Query(None),
    deadline_to: datetime | None = Query(None),
    assigned_to: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """Поиск и фильтрация задач в рабочем пространстве.

    Поддерживает фильтрацию по тексту, приоритету, статусу, дедлайну и исполнителю.

    :param q: Поисковый запрос по заголовку задачи.
    :type q: str, optional
    :param priority: Фильтр по приоритету (low, medium, high).
    :type priority: str, optional
    :param is_completed: Фильтр по статусу выполнения.
    :type is_completed: bool, optional
    :param deadline_from: Дедлайн от (включительно).
    :type deadline_from: datetime, optional
    :param deadline_to: Дедлайн до (включительно).
    :type deadline_to: datetime, optional
    :param assigned_to: Фильтр по исполнителю (UUID).
    :type assigned_to: str, optional
    :return: Список найденных задач.
    :rtype: list[TaskResponse]

    HTTP метод: GET
    """
    return await service.search_tasks(
        workspace_id, user_id, query=q, priority=priority,
        is_completed=is_completed, has_deadline=has_deadline,
        deadline_from=deadline_from, deadline_to=deadline_to,
        assigned_to=assigned_to, limit=limit, offset=offset,
    )


# Calendar
@router.get("/tasks/calendar", response_model=list[CalendarTaskResponse])
async def get_calendar_tasks(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
):
    """Возвращает задачи с дедлайнами для календарного представления.

    :param year: Год (обязательный параметр).
    :type year: int
    :param month: Месяц (1-12, обязательный параметр).
    :type month: int
    :return: Список задач с дедлайнами в указанном месяце.
    :rtype: list[CalendarTaskResponse]

    HTTP метод: GET
    """
    return await service.get_calendar_tasks(workspace_id, user_id, year, month)


# Analytics
@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    """Возвращает аналитику рабочего пространства.

    Включает количество задач, распределение по приоритетам, статистику выполнения и активность участников.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Аналитические данные.
    :rtype: AnalyticsResponse

    HTTP метод: GET
    """
    return await service.get_analytics(workspace_id, user_id)
