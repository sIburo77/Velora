import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task_comment import TaskComment


class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_task(self, task_id: uuid.UUID) -> list[TaskComment]:
        result = await self.db.execute(
            select(TaskComment)
            .options(selectinload(TaskComment.author))
            .where(TaskComment.task_id == task_id)
            .order_by(TaskComment.created_at.asc())
        )
        return result.scalars().all()

    async def get_by_id(self, comment_id: uuid.UUID) -> TaskComment | None:
        result = await self.db.execute(
            select(TaskComment).where(TaskComment.id == comment_id)
        )
        return result.scalar_one_or_none()

    async def create(self, task_id: uuid.UUID, author_id: uuid.UUID, content: str) -> TaskComment:
        comment = TaskComment(task_id=task_id, author_id=author_id, content=content)
        self.db.add(comment)
        await self.db.flush()
        # reload with author
        result = await self.db.execute(
            select(TaskComment)
            .options(selectinload(TaskComment.author))
            .where(TaskComment.id == comment.id)
        )
        return result.scalar_one()

    async def update(self, comment: TaskComment, content: str) -> TaskComment:
        comment.content = content
        await self.db.flush()
        return comment

    async def delete(self, comment_id: uuid.UUID) -> None:
        await self.db.execute(delete(TaskComment).where(TaskComment.id == comment_id))
        await self.db.flush()
