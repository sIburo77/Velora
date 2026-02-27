import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invitation import Invitation


class InvitationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_token(self, token: str) -> Invitation | None:
        result = await self.db.execute(select(Invitation).where(Invitation.token == token))
        return result.scalar_one_or_none()

    async def get_by_workspace(self, workspace_id: uuid.UUID) -> list[Invitation]:
        result = await self.db.execute(
            select(Invitation).where(Invitation.workspace_id == workspace_id)
        )
        return result.scalars().all()

    async def get_pending_by_email_and_workspace(
        self, email: str, workspace_id: uuid.UUID
    ) -> Invitation | None:
        result = await self.db.execute(
            select(Invitation).where(
                Invitation.email == email,
                Invitation.workspace_id == workspace_id,
                Invitation.status == "pending",
            )
        )
        return result.scalar_one_or_none()

    async def get_pending_by_email(self, email: str) -> list[Invitation]:
        result = await self.db.execute(
            select(Invitation).where(
                Invitation.email == email,
                Invitation.status == "pending",
            )
        )
        return result.scalars().all()

    async def create(self, **kwargs) -> Invitation:
        invitation = Invitation(**kwargs)
        self.db.add(invitation)
        await self.db.flush()
        return invitation

    async def update_status(self, invitation: Invitation, status: str) -> Invitation:
        invitation.status = status
        await self.db.flush()
        return invitation
