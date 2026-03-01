import uuid

from app.core.exceptions import ForbiddenError, NotFoundError
from app.repositories.chat_repo import ChatRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse


class ChatService:
    def __init__(self, chat_repo: ChatRepository, workspace_repo: WorkspaceRepository):
        self.chat_repo = chat_repo
        self.workspace_repo = workspace_repo

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

    def _to_response(self, msg) -> ChatMessageResponse:
        return ChatMessageResponse(
            id=msg.id,
            workspace_id=msg.workspace_id,
            author_id=msg.author_id,
            content=msg.content,
            file_url=msg.file_url,
            file_name=msg.file_name,
            created_at=msg.created_at,
            author_name=msg.author.name if msg.author else None,
            author_avatar=msg.author.avatar_url if msg.author else None,
            reply_to_id=msg.reply_to_id,
            reply_to_content=msg.reply_to.content if msg.reply_to else None,
            reply_to_author_name=msg.reply_to.author.name if msg.reply_to and msg.reply_to.author else None,
        )

    async def get_history(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[ChatMessageResponse]:
        await self._check_membership(workspace_id, user_id)
        messages = await self.chat_repo.get_history(workspace_id, limit, offset)
        return [self._to_response(m) for m in messages]

    async def delete_message(
        self, workspace_id: uuid.UUID, message_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        msg = await self.chat_repo.get_by_id(message_id)
        if not msg:
            raise NotFoundError("Message not found")

        if msg.author_id != user_id and member.role not in ("owner", "admin"):
            raise ForbiddenError("You can only delete your own messages")

        await self.chat_repo.delete(message_id)

    async def send_message(
        self, workspace_id: uuid.UUID, data: ChatMessageCreate, user_id: uuid.UUID
    ) -> ChatMessageResponse:
        await self._check_membership(workspace_id, user_id)
        msg = await self.chat_repo.create(workspace_id, user_id, data.content)
        return self._to_response(msg)
