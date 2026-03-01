import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task_attachment import TaskAttachment


class AttachmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_task(self, task_id: uuid.UUID) -> list[TaskAttachment]:
        result = await self.db.execute(
            select(TaskAttachment)
            .options(selectinload(TaskAttachment.uploader))
            .where(TaskAttachment.task_id == task_id)
            .order_by(TaskAttachment.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, attachment_id: uuid.UUID) -> TaskAttachment | None:
        result = await self.db.execute(
            select(TaskAttachment).where(TaskAttachment.id == attachment_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> TaskAttachment:
        attachment = TaskAttachment(**kwargs)
        self.db.add(attachment)
        await self.db.flush()
        return attachment

    async def delete(self, attachment_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(TaskAttachment).where(TaskAttachment.id == attachment_id)
        )
        await self.db.flush()
