import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.tag import TagResponse


class BoardResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnCreate(BaseModel):
    name: str
    position: int | None = None


class ColumnUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class ColumnResponse(BaseModel):
    id: uuid.UUID
    board_id: uuid.UUID
    name: str
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnWithTasksResponse(ColumnResponse):
    tasks: list["TaskResponse"] = []


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: str = "medium"
    deadline: datetime | None = None
    assigned_to: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    is_completed: bool | None = None
    deadline: datetime | None = None
    assigned_to: uuid.UUID | None = None


class TaskMove(BaseModel):
    column_id: uuid.UUID
    position: int


class TaskResponse(BaseModel):
    id: uuid.UUID
    column_id: uuid.UUID
    title: str
    description: str | None
    priority: str
    is_completed: bool
    position: int
    deadline: datetime | None
    assigned_to: uuid.UUID | None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = []

    model_config = {"from_attributes": True}


class BoardFullResponse(BoardResponse):
    columns: list[ColumnWithTasksResponse] = []


class CalendarTaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    deadline: datetime | None
    priority: str
    is_completed: bool
    column_id: uuid.UUID

    model_config = {"from_attributes": True}


class TaskReorder(BaseModel):
    task_ids: list[uuid.UUID]


class MemberStatResponse(BaseModel):
    user_id: uuid.UUID
    user_name: str | None
    avatar_url: str | None
    tasks_created: int
    tasks_completed: int
    completion_rate: float


class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    by_column: dict[str, int]
    by_priority: dict[str, int]
    by_member: list[MemberStatResponse] = []
