import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat_message import ChatMessage


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_history(
        self, workspace_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .options(
                selectinload(ChatMessage.author),
                selectinload(ChatMessage.reply_to).selectinload(ChatMessage.author),
            )
            .where(ChatMessage.workspace_id == workspace_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(reversed(result.scalars().all()))

    async def create(
        self, workspace_id: uuid.UUID, author_id: uuid.UUID, content: str,
        file_url: str | None = None, file_name: str | None = None,
        reply_to_id: uuid.UUID | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            workspace_id=workspace_id, author_id=author_id, content=content,
            file_url=file_url, file_name=file_name, reply_to_id=reply_to_id,
        )
        self.db.add(msg)
        await self.db.flush()
        result = await self.db.execute(
            select(ChatMessage)
            .options(
                selectinload(ChatMessage.author),
                selectinload(ChatMessage.reply_to).selectinload(ChatMessage.author),
            )
            .where(ChatMessage.id == msg.id)
        )
        return result.scalar_one()
