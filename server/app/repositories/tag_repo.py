import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag, task_tags


class TagRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tag_id: uuid.UUID) -> Tag | None:
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        return result.scalar_one_or_none()

    async def get_workspace_tags(self, workspace_id: uuid.UUID) -> list[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.workspace_id == workspace_id).order_by(Tag.name)
        )
        return result.scalars().all()

    async def create(self, workspace_id: uuid.UUID, name: str, color: str) -> Tag:
        tag = Tag(workspace_id=workspace_id, name=name, color=color)
        self.db.add(tag)
        await self.db.flush()
        return tag

    async def delete(self, tag_id: uuid.UUID) -> None:
        await self.db.execute(delete(Tag).where(Tag.id == tag_id))
        await self.db.flush()

    async def add_tag_to_task(self, task_id: uuid.UUID, tag_id: uuid.UUID) -> None:
        await self.db.execute(task_tags.insert().values(task_id=task_id, tag_id=tag_id))
        await self.db.flush()

    async def remove_tag_from_task(self, task_id: uuid.UUID, tag_id: uuid.UUID) -> None:
        await self.db.execute(
            task_tags.delete().where(
                task_tags.c.task_id == task_id, task_tags.c.tag_id == tag_id
            )
        )
        await self.db.flush()
