import uuid

from app.core.exceptions import ForbiddenError
from app.repositories.activity_log_repo import ActivityLogRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.activity_log import ActivityLogResponse


class ActivityLogService:
    def __init__(self, activity_repo: ActivityLogRepository, workspace_repo: WorkspaceRepository):
        self.activity_repo = activity_repo
        self.workspace_repo = workspace_repo

    async def get_logs(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[ActivityLogResponse]:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        logs = await self.activity_repo.get_by_workspace(workspace_id, limit, offset)
        return [
            ActivityLogResponse(
                id=log.id,
                workspace_id=log.workspace_id,
                user_id=log.user_id,
                user_name=log.user.name if log.user else None,
                user_avatar=log.user.avatar_url if log.user else None,
                action=log.action,
                target_type=log.target_type,
                target_name=log.target_name,
                details=log.details,
                created_at=log.created_at,
            )
            for log in logs
        ]

    async def log(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str,
        target_type: str,
        target_name: str = "",
        details: str | None = None,
    ) -> None:
        await self.activity_repo.create(
            workspace_id=workspace_id,
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_name=target_name,
            details=details,
        )
