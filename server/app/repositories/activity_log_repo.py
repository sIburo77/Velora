import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity_log import ActivityLog


class ActivityLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str,
        target_type: str,
        target_name: str = "",
        details: str | None = None,
    ) -> ActivityLog:
        log = ActivityLog(
            workspace_id=workspace_id,
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_name=target_name,
            details=details,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_by_workspace(
        self, workspace_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .options(selectinload(ActivityLog.user))
            .where(ActivityLog.workspace_id == workspace_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()
