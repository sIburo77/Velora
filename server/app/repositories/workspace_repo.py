import uuid

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, workspace_id: uuid.UUID) -> Workspace | None:
        result = await self.db.execute(select(Workspace).where(Workspace.id == workspace_id))
        return result.scalar_one_or_none()

    async def get_user_workspaces(self, user_id: uuid.UUID) -> list[tuple[Workspace, str]]:
        result = await self.db.execute(
            select(Workspace, WorkspaceMember.role)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
        )
        return result.all()

    async def create(self, name: str) -> Workspace:
        workspace = Workspace(name=name)
        self.db.add(workspace)
        await self.db.flush()
        return workspace

    async def update(self, workspace: Workspace, **kwargs) -> Workspace:
        for key, value in kwargs.items():
            if value is not None:
                setattr(workspace, key, value)
        await self.db.flush()
        return workspace

    async def delete(self, workspace_id: uuid.UUID) -> None:
        await self.db.execute(delete(Workspace).where(Workspace.id == workspace_id))
        await self.db.flush()

    async def add_member(self, workspace_id: uuid.UUID, user_id: uuid.UUID, role: str = "member") -> WorkspaceMember:
        member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.flush()
        return member

    async def get_member(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> WorkspaceMember | None:
        result = await self.db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_members(self, workspace_id: uuid.UUID) -> list[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember)
            .options(selectinload(WorkspaceMember.user))
            .where(WorkspaceMember.workspace_id == workspace_id)
        )
        return result.scalars().all()

    async def update_member_role(self, workspace_id: uuid.UUID, user_id: uuid.UUID, role: str) -> None:
        await self.db.execute(
            update(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
            .values(role=role)
        )
        await self.db.flush()

    async def remove_member(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        )
        await self.db.flush()
