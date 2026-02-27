import uuid

from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.board_repo import BoardRepository
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
)


class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository, board_repo: BoardRepository):
        self.workspace_repo = workspace_repo
        self.board_repo = board_repo

    async def create_workspace(self, data: WorkspaceCreate, owner_id: uuid.UUID) -> WorkspaceResponse:
        workspace = await self.workspace_repo.create(name=data.name)
        await self.workspace_repo.add_member(workspace.id, owner_id, role="owner")
        await self.board_repo.create(workspace.id)
        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            created_at=workspace.created_at,
            role="owner",
        )

    async def get_user_workspaces(self, user_id: uuid.UUID) -> list[WorkspaceResponse]:
        rows = await self.workspace_repo.get_user_workspaces(user_id)
        return [
            WorkspaceResponse(id=ws.id, name=ws.name, created_at=ws.created_at, role=role)
            for ws, role in rows
        ]

    async def update_workspace(
        self, workspace_id: uuid.UUID, data: WorkspaceUpdate, user_id: uuid.UUID
    ) -> WorkspaceResponse:
        await self._check_owner(workspace_id, user_id)
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace not found")
        updated = await self.workspace_repo.update(workspace, name=data.name)
        return WorkspaceResponse(
            id=updated.id, name=updated.name, created_at=updated.created_at, role="owner"
        )

    async def delete_workspace(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self._check_owner(workspace_id, user_id)
        await self.workspace_repo.delete(workspace_id)

    async def get_members(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> list[WorkspaceMemberResponse]:
        await self._check_membership(workspace_id, user_id)
        members = await self.workspace_repo.get_members(workspace_id)
        return [
            WorkspaceMemberResponse(
                id=m.id,
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                user_email=m.user.email if m.user else None,
                user_name=m.user.name if m.user else None,
            )
            for m in members
        ]

    async def remove_member(
        self, workspace_id: uuid.UUID, member_user_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_owner(workspace_id, user_id)
        if member_user_id == user_id:
            raise BadRequestError("Cannot remove yourself as owner")
        member = await self.workspace_repo.get_member(workspace_id, member_user_id)
        if not member:
            raise NotFoundError("Member not found")
        await self.workspace_repo.remove_member(workspace_id, member_user_id)

    async def _check_owner(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member or member.role != "owner":
            raise ForbiddenError("Only workspace owner can perform this action")

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("You are not a member of this workspace")
