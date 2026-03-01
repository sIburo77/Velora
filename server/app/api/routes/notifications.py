import uuid

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user_id, get_notification_service
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.get_notifications(user_id, limit, offset)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.get_unread_count(user_id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.mark_read(notification_id, user_id)


@router.post("/read-all")
async def mark_all_read(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
):
    await service.mark_all_read(user_id)
    return {"detail": "All notifications marked as read"}
