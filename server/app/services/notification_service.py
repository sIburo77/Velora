import uuid

from app.core.exceptions import NotFoundError
from app.repositories.notification_repo import NotificationRepository
from app.schemas.notification import NotificationResponse, UnreadCountResponse


class NotificationService:
    def __init__(self, notification_repo: NotificationRepository):
        self.notification_repo = notification_repo

    async def get_notifications(
        self, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[NotificationResponse]:
        notifications = await self.notification_repo.get_by_user(user_id, limit, offset)
        return [NotificationResponse.model_validate(n) for n in notifications]

    async def get_unread_count(self, user_id: uuid.UUID) -> UnreadCountResponse:
        count = await self.notification_repo.get_unread_count(user_id)
        return UnreadCountResponse(count=count)

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> NotificationResponse:
        notification = await self.notification_repo.mark_read(notification_id, user_id)
        if not notification:
            raise NotFoundError("Notification not found")
        return NotificationResponse.model_validate(notification)

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.notification_repo.mark_all_read(user_id)

    async def create_notification(
        self,
        user_id: uuid.UUID,
        type: str,
        title: str,
        body: str | None = None,
        workspace_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
    ) -> NotificationResponse:
        notification = await self.notification_repo.create(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            workspace_id=workspace_id,
            task_id=task_id,
        )
        return NotificationResponse.model_validate(notification)
