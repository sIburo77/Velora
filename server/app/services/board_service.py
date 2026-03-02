import uuid
from datetime import datetime, timezone
from calendar import monthrange

from app.core.exceptions import NotFoundError, ForbiddenError
from app.repositories.board_repo import BoardRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.activity_log_repo import ActivityLogRepository
from app.ws_manager import manager
from app.schemas.board import (
    BoardFullResponse,
    ColumnCreate,
    ColumnUpdate,
    ColumnResponse,
    ColumnWithTasksResponse,
    TaskCreate,
    TaskUpdate,
    TaskMove,
    TaskResponse,
    AnalyticsResponse,
    MemberStatResponse,
    CalendarTaskResponse,
)


class BoardService:
    def __init__(self, board_repo: BoardRepository, workspace_repo: WorkspaceRepository, notification_repo: NotificationRepository, activity_repo: ActivityLogRepository | None = None):
        self.board_repo = board_repo
        self.workspace_repo = workspace_repo
        self.notification_repo = notification_repo
        self.activity_repo = activity_repo

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> str:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")
        return member.role

    async def _check_can_edit(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> str:
        role = await self._check_membership(workspace_id, user_id)
        if role == "viewer":
            raise ForbiddenError("Viewers cannot modify the board")
        return role

    async def _log(self, workspace_id, user_id, action, target_type, target_name="", details=None):
        if self.activity_repo:
            await self.activity_repo.create(workspace_id, user_id, action, target_type, target_name, details)

    async def _broadcast(self, workspace_id, event_type, data=None):
        await manager.broadcast_board(workspace_id, {"type": event_type, "data": data})

    async def get_board(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> BoardFullResponse:
        await self._check_membership(workspace_id, user_id)
        board = await self.board_repo.get_by_workspace(workspace_id)
        if not board:
            board = await self.board_repo.create(workspace_id)

        full_board = await self.board_repo.get_full_board(board.id)
        columns = []
        for col in full_board.columns:
            tasks = [TaskResponse.model_validate(t) for t in col.tasks]
            columns.append(
                ColumnWithTasksResponse(
                    id=col.id,
                    board_id=col.board_id,
                    name=col.name,
                    position=col.position,
                    created_at=col.created_at,
                    tasks=tasks,
                )
            )
        return BoardFullResponse(
            id=full_board.id,
            workspace_id=full_board.workspace_id,
            name=full_board.name,
            created_at=full_board.created_at,
            columns=columns,
        )

    # Column operations
    async def create_column(
        self, workspace_id: uuid.UUID, data: ColumnCreate, user_id: uuid.UUID
    ) -> ColumnResponse:
        await self._check_can_edit(workspace_id, user_id)
        board = await self.board_repo.get_by_workspace(workspace_id)
        if not board:
            raise NotFoundError("Board not found")

        position = data.position
        if position is None:
            position = await self.board_repo.get_max_column_position(board.id) + 1

        column = await self.board_repo.create_column(board.id, data.name, position)
        await self._log(workspace_id, user_id, "created", "column", data.name)
        await self._broadcast(workspace_id, "board_updated")
        return ColumnResponse.model_validate(column)

    async def update_column(
        self, workspace_id: uuid.UUID, column_id: uuid.UUID, data: ColumnUpdate, user_id: uuid.UUID
    ) -> ColumnResponse:
        await self._check_can_edit(workspace_id, user_id)
        column = await self.board_repo.get_column(column_id)
        if not column:
            raise NotFoundError("Column not found")

        kwargs = {}
        if data.name is not None:
            kwargs["name"] = data.name
        if data.position is not None:
            kwargs["position"] = data.position

        updated = await self.board_repo.update_column(column, **kwargs)
        return ColumnResponse.model_validate(updated)

    async def delete_column(
        self, workspace_id: uuid.UUID, column_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_can_edit(workspace_id, user_id)
        column = await self.board_repo.get_column(column_id)
        if not column:
            raise NotFoundError("Column not found")
        col_name = column.name
        await self.board_repo.delete_column(column_id)
        await self._log(workspace_id, user_id, "deleted", "column", col_name)
        await self._broadcast(workspace_id, "board_updated")

    async def reorder_columns(
        self, workspace_id: uuid.UUID, column_ids: list[uuid.UUID], user_id: uuid.UUID
    ) -> list[ColumnResponse]:
        await self._check_can_edit(workspace_id, user_id)
        result = []
        for position, col_id in enumerate(column_ids):
            column = await self.board_repo.get_column(col_id)
            if column:
                updated = await self.board_repo.update_column(column, position=position)
                result.append(ColumnResponse.model_validate(updated))
        return result

    # Task operations
    async def create_task(
        self, workspace_id: uuid.UUID, column_id: uuid.UUID, data: TaskCreate, user_id: uuid.UUID
    ) -> TaskResponse:
        await self._check_can_edit(workspace_id, user_id)
        column = await self.board_repo.get_column(column_id)
        if not column:
            raise NotFoundError("Column not found")

        position = await self.board_repo.get_max_task_position(column_id) + 1
        task = await self.board_repo.create_task(
            column_id=column_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            deadline=data.deadline,
            assigned_to=data.assigned_to,
            created_by=user_id,
            position=position,
        )
        if data.assigned_to and data.assigned_to != user_id:
            await self.notification_repo.create(
                user_id=data.assigned_to,
                type="task",
                title=f"Task assigned: {data.title}",
                body=f"You have been assigned to \"{data.title}\"",
            )
        await self._log(workspace_id, user_id, "created", "task", data.title)
        await self._broadcast(workspace_id, "board_updated")
        return TaskResponse.model_validate(task)

    async def update_task(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, data: TaskUpdate, user_id: uuid.UUID
    ) -> TaskResponse:
        await self._check_can_edit(workspace_id, user_id)
        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")

        old_assigned = task.assigned_to

        kwargs = {}
        for field in ["title", "description", "priority", "is_completed", "deadline", "assigned_to"]:
            value = getattr(data, field)
            if value is not None:
                kwargs[field] = value

        updated = await self.board_repo.update_task(task, **kwargs)

        if data.is_completed is True and not task.is_completed:
            await self._log(workspace_id, user_id, "completed", "task", updated.title)
        else:
            await self._log(workspace_id, user_id, "updated", "task", updated.title)

        new_assigned = data.assigned_to
        if new_assigned and new_assigned != old_assigned and new_assigned != user_id:
            await self.notification_repo.create(
                user_id=new_assigned,
                type="task",
                title=f"Task assigned: {updated.title}",
                body=f"You have been assigned to \"{updated.title}\"",
            )

        await self._broadcast(workspace_id, "board_updated")
        return TaskResponse.model_validate(updated)

    async def delete_task(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_can_edit(workspace_id, user_id)
        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")
        task_title = task.title
        await self.board_repo.delete_task(task_id)
        await self._log(workspace_id, user_id, "deleted", "task", task_title)
        await self._broadcast(workspace_id, "board_updated")

    async def reorder_tasks(
        self, workspace_id: uuid.UUID, column_id: uuid.UUID,
        task_ids: list[uuid.UUID], user_id: uuid.UUID,
    ) -> None:
        await self._check_can_edit(workspace_id, user_id)
        await self.board_repo.batch_update_task_positions(column_id, task_ids)
        await self._broadcast(workspace_id, "board_updated")

    async def move_task(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, data: TaskMove, user_id: uuid.UUID
    ) -> TaskResponse:
        await self._check_can_edit(workspace_id, user_id)
        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")

        target_column = await self.board_repo.get_column(data.column_id)
        if not target_column:
            raise NotFoundError("Target column not found")

        updated = await self.board_repo.update_task(
            task, column_id=data.column_id, position=data.position
        )
        return TaskResponse.model_validate(updated)

    # Search & filter
    async def search_tasks(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        query: str | None = None,
        priority: str | None = None,
        is_completed: bool | None = None,
        has_deadline: bool | None = None,
        deadline_from: "datetime | None" = None,
        deadline_to: "datetime | None" = None,
        assigned_to: "str | None" = None,
    ) -> list[TaskResponse]:
        await self._check_membership(workspace_id, user_id)
        board = await self.board_repo.get_by_workspace(workspace_id)
        if not board:
            return []
        tasks = await self.board_repo.search_tasks(
            board.id, query=query, priority=priority, is_completed=is_completed,
            has_deadline=has_deadline, deadline_from=deadline_from, deadline_to=deadline_to,
            assigned_to=assigned_to,
        )
        return [TaskResponse.model_validate(t) for t in tasks]

    # Calendar
    async def get_calendar_tasks(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID, year: int, month: int
    ) -> list[CalendarTaskResponse]:
        await self._check_membership(workspace_id, user_id)
        board = await self.board_repo.get_by_workspace(workspace_id)
        if not board:
            return []

        start = datetime(year, month, 1, tzinfo=timezone.utc)
        _, last_day = monthrange(year, month)
        end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        tasks = await self.board_repo.get_tasks_by_deadline_range(board.id, start, end)
        return [
            CalendarTaskResponse(
                id=t.id,
                title=t.title,
                deadline=t.deadline,
                priority=t.priority,
                is_completed=t.is_completed,
                column_id=t.column_id,
            )
            for t in tasks
        ]

    # Analytics
    async def get_analytics(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> AnalyticsResponse:
        await self._check_membership(workspace_id, user_id)
        board = await self.board_repo.get_by_workspace(workspace_id)
        if not board:
            return AnalyticsResponse(
                total_tasks=0, completed_tasks=0, completion_rate=0.0, by_column={}, by_priority={}
            )

        full_board = await self.board_repo.get_full_board(board.id)
        all_tasks = []
        by_column = {}
        for col in full_board.columns:
            by_column[col.name] = len(col.tasks)
            all_tasks.extend(col.tasks)

        total = len(all_tasks)
        completed = sum(1 for t in all_tasks if t.is_completed)
        rate = (completed / total * 100) if total > 0 else 0.0

        by_priority = {}
        for t in all_tasks:
            by_priority[t.priority] = by_priority.get(t.priority, 0) + 1

        # Per-member stats
        members = await self.workspace_repo.get_members(workspace_id)
        member_map = {}
        for m in members:
            if m.user:
                member_map[m.user_id] = {
                    "user_id": m.user_id,
                    "user_name": m.user.name,
                    "avatar_url": m.user.avatar_url,
                    "tasks_created": 0,
                    "tasks_completed": 0,
                }

        for t in all_tasks:
            if t.created_by and t.created_by in member_map:
                member_map[t.created_by]["tasks_created"] += 1
                if t.is_completed:
                    member_map[t.created_by]["tasks_completed"] += 1

        by_member = []
        for uid, stats in member_map.items():
            created = stats["tasks_created"]
            compl = stats["tasks_completed"]
            by_member.append(MemberStatResponse(
                user_id=uid,
                user_name=stats["user_name"],
                avatar_url=stats["avatar_url"],
                tasks_created=created,
                tasks_completed=compl,
                completion_rate=round((compl / created * 100) if created > 0 else 0.0, 1),
            ))
        by_member.sort(key=lambda x: x.tasks_completed, reverse=True)

        return AnalyticsResponse(
            total_tasks=total,
            completed_tasks=completed,
            completion_rate=round(rate, 1),
            by_column=by_column,
            by_priority=by_priority,
            by_member=by_member,
        )
