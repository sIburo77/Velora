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
    return await service.get_board(workspace_id, user_id)


# Columns
@router.post("/columns", response_model=ColumnResponse, status_code=201)
async def create_column(
    workspace_id: uuid.UUID,
    data: ColumnCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    return await service.create_column(workspace_id, data, user_id)


@router.patch("/columns/{column_id}", response_model=ColumnResponse)
async def update_column(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    data: ColumnUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    return await service.update_column(workspace_id, column_id, data, user_id)


@router.delete("/columns/{column_id}")
async def delete_column(
    workspace_id: uuid.UUID,
    column_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    await service.delete_column(workspace_id, column_id, user_id)
    return {"detail": "Column deleted"}


@router.put("/columns/reorder", response_model=list[ColumnResponse])
async def reorder_columns(
    workspace_id: uuid.UUID,
    column_ids: list[uuid.UUID],
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
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
    return await service.create_task(workspace_id, column_id, data, user_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    data: TaskUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    return await service.update_task(workspace_id, task_id, data, user_id)


@router.delete("/tasks/{task_id}")
async def delete_task(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
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
):
    return await service.search_tasks(
        workspace_id, user_id, query=q, priority=priority,
        is_completed=is_completed, has_deadline=has_deadline,
        deadline_from=deadline_from, deadline_to=deadline_to,
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
    return await service.get_calendar_tasks(workspace_id, user_id, year, month)


# Analytics
@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: BoardService = Depends(get_board_service),
):
    return await service.get_analytics(workspace_id, user_id)
