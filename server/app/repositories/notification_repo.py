import uuid

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(
        self, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return result.scalar() or 0

    async def create(self, **kwargs) -> Notification:
        notification = Notification(**kwargs)
        self.db.add(notification)
        await self.db.flush()
        return notification

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification | None:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await self.db.flush()
        return notification

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.db.flush()
