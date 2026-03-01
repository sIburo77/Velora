import uuid

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user_id, get_chat_service
from app.schemas.chat import ChatMessageResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/workspaces/{workspace_id}/chat", tags=["Chat"])


@router.get("/history", response_model=list[ChatMessageResponse])
async def get_chat_history(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.get_history(workspace_id, user_id, limit, offset)
