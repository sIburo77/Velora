import uuid

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.board import Board
from app.models.column import Column
from app.models.task import Task


class BoardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_workspace(self, workspace_id: uuid.UUID) -> Board | None:
        result = await self.db.execute(
            select(Board).where(Board.workspace_id == workspace_id)
        )
        return result.scalar_one_or_none()

    async def get_full_board(self, board_id: uuid.UUID) -> Board | None:
        result = await self.db.execute(
            select(Board)
            .options(
                selectinload(Board.columns)
                .selectinload(Column.tasks)
                .selectinload(Task.tags)
            )
            .where(Board.id == board_id)
        )
        return result.scalar_one_or_none()

    async def create(self, workspace_id: uuid.UUID, name: str = "Main Board") -> Board:
        board = Board(workspace_id=workspace_id, name=name)
        self.db.add(board)
        await self.db.flush()
        return board

    # Column operations
    async def get_column(self, column_id: uuid.UUID) -> Column | None:
        result = await self.db.execute(select(Column).where(Column.id == column_id))
        return result.scalar_one_or_none()

    async def get_columns(self, board_id: uuid.UUID) -> list[Column]:
        result = await self.db.execute(
            select(Column).where(Column.board_id == board_id).order_by(Column.position)
        )
        return result.scalars().all()

    async def create_column(self, board_id: uuid.UUID, name: str, position: int) -> Column:
        column = Column(board_id=board_id, name=name, position=position)
        self.db.add(column)
        await self.db.flush()
        return column

    async def update_column(self, column: Column, **kwargs) -> Column:
        for key, value in kwargs.items():
            if value is not None:
                setattr(column, key, value)
        await self.db.flush()
        return column

    async def delete_column(self, column_id: uuid.UUID) -> None:
        await self.db.execute(delete(Column).where(Column.id == column_id))
        await self.db.flush()

    async def get_max_column_position(self, board_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(Column.position), -1)).where(Column.board_id == board_id)
        )
        return result.scalar()

    # Task operations
    async def get_task(self, task_id: uuid.UUID) -> Task | None:
        result = await self.db.execute(
            select(Task).options(selectinload(Task.tags)).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_tasks_by_column(self, column_id: uuid.UUID) -> list[Task]:
        result = await self.db.execute(
            select(Task).where(Task.column_id == column_id).order_by(Task.position)
        )
        return result.scalars().all()

    async def create_task(self, **kwargs) -> Task:
        task = Task(**kwargs)
        self.db.add(task)
        await self.db.flush()
        result = await self.db.execute(
            select(Task).options(selectinload(Task.tags)).where(Task.id == task.id)
        )
        return result.scalar_one()

    async def update_task(self, task: Task, **kwargs) -> Task:
        for key, value in kwargs.items():
            if value is not None:
                setattr(task, key, value)
        await self.db.flush()
        result = await self.db.execute(
            select(Task).options(selectinload(Task.tags)).where(Task.id == task.id)
        )
        return result.scalar_one()

    async def delete_task(self, task_id: uuid.UUID) -> None:
        await self.db.execute(delete(Task).where(Task.id == task_id))
        await self.db.flush()

    async def get_max_task_position(self, column_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(Task.position), -1)).where(Task.column_id == column_id)
        )
        return result.scalar()

    async def batch_update_task_positions(self, column_id: uuid.UUID, task_ids: list[uuid.UUID]) -> None:
        from sqlalchemy import update
        for i, task_id in enumerate(task_ids):
            await self.db.execute(
                update(Task).where(Task.id == task_id).values(column_id=column_id, position=i)
            )
        await self.db.flush()

    async def get_all_tasks_for_board(self, board_id: uuid.UUID) -> list[Task]:
        result = await self.db.execute(
            select(Task)
            .join(Column, Column.id == Task.column_id)
            .where(Column.board_id == board_id)
        )
        return result.scalars().all()

    async def get_tasks_by_deadline_range(
        self, board_id: uuid.UUID, start: "datetime", end: "datetime"
    ) -> list[Task]:
        from datetime import datetime
        result = await self.db.execute(
            select(Task)
            .join(Column, Column.id == Task.column_id)
            .where(
                Column.board_id == board_id,
                Task.deadline.isnot(None),
                Task.deadline >= start,
                Task.deadline <= end,
            )
            .order_by(Task.deadline)
        )
        return result.scalars().all()

    async def search_tasks(
        self,
        board_id: uuid.UUID,
        query: str | None = None,
        priority: str | None = None,
        is_completed: bool | None = None,
        has_deadline: bool | None = None,
        deadline_from: "datetime | None" = None,
        deadline_to: "datetime | None" = None,
        assigned_to: "str | None" = None,
    ) -> list[Task]:
        stmt = select(Task).join(Column, Column.id == Task.column_id).where(Column.board_id == board_id)

        if query:
            stmt = stmt.where(Task.title.ilike(f"%{query}%"))
        if priority:
            stmt = stmt.where(Task.priority == priority)
        if is_completed is not None:
            stmt = stmt.where(Task.is_completed == is_completed)
        if has_deadline is True:
            stmt = stmt.where(Task.deadline.isnot(None))
        if deadline_from:
            stmt = stmt.where(Task.deadline >= deadline_from)
        if deadline_to:
            stmt = stmt.where(Task.deadline <= deadline_to)
        if assigned_to:
            if assigned_to == "unassigned":
                stmt = stmt.where(Task.assigned_to.is_(None))
            else:
                stmt = stmt.where(Task.assigned_to == uuid.UUID(assigned_to))

        result = await self.db.execute(stmt.options(selectinload(Task.tags)).order_by(Task.position))
        return result.scalars().all()
