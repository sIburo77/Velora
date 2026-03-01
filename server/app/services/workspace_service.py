import uuid

from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.board_repo import BoardRepository
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    RoleUpdate,
)

WORKSPACE_TEMPLATES = {
    "scrum": ["Backlog", "To Do", "In Progress", "Review", "Done"],
    "marketing": ["Ideas", "Planning", "In Progress", "Review", "Published"],
    "personal": ["To Do", "In Progress", "Done"],
}


class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository, board_repo: BoardRepository):
        self.workspace_repo = workspace_repo
        self.board_repo = board_repo

    async def create_workspace(self, data: WorkspaceCreate, owner_id: uuid.UUID) -> WorkspaceResponse:
        workspace = await self.workspace_repo.create(name=data.name)
        await self.workspace_repo.add_member(workspace.id, owner_id, role="admin")
        board = await self.board_repo.create(workspace.id)

        # Create template columns
        template_name = data.template or "default"
        columns = WORKSPACE_TEMPLATES.get(template_name, ["To Do", "In Progress", "Done"])
        for i, col_name in enumerate(columns):
            await self.board_repo.create_column(board.id, col_name, i)

        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            avatar_url=workspace.avatar_url,
            created_at=workspace.created_at,
            role="admin",
        )

    async def get_user_workspaces(self, user_id: uuid.UUID) -> list[WorkspaceResponse]:
        rows = await self.workspace_repo.get_user_workspaces(user_id)
        return [
            WorkspaceResponse(
                id=ws.id, name=ws.name, avatar_url=ws.avatar_url,
                created_at=ws.created_at, role=role,
            )
            for ws, role in rows
        ]

    async def update_workspace(
        self, workspace_id: uuid.UUID, data: WorkspaceUpdate, user_id: uuid.UUID
    ) -> WorkspaceResponse:
        await self._check_admin(workspace_id, user_id)
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace not found")
        updated = await self.workspace_repo.update(workspace, name=data.name)
        return WorkspaceResponse(
            id=updated.id, name=updated.name, avatar_url=updated.avatar_url,
            created_at=updated.created_at, role="admin",
        )

    async def update_avatar(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID, avatar_url: str | None,
    ) -> WorkspaceResponse:
        await self._check_admin(workspace_id, user_id)
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace not found")
        workspace.avatar_url = avatar_url
        await self.workspace_repo.flush()
        return WorkspaceResponse(
            id=workspace.id, name=workspace.name, avatar_url=workspace.avatar_url,
            created_at=workspace.created_at, role="admin",
        )

    async def delete_workspace(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self._check_admin(workspace_id, user_id)
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

    async def update_member_role(
        self, workspace_id: uuid.UUID, member_user_id: uuid.UUID, data: RoleUpdate, user_id: uuid.UUID
    ) -> WorkspaceMemberResponse:
        await self._check_admin(workspace_id, user_id)

        if member_user_id == user_id:
            raise BadRequestError("Cannot change your own role")

        if data.role not in ("admin", "editor", "member", "viewer"):
            raise BadRequestError("Invalid role")

        member = await self.workspace_repo.get_member(workspace_id, member_user_id)
        if not member:
            raise NotFoundError("Member not found")

        await self.workspace_repo.update_member_role(workspace_id, member_user_id, data.role)
        member = await self.workspace_repo.get_member(workspace_id, member_user_id)

        return WorkspaceMemberResponse(
            id=member.id,
            user_id=member.user_id,
            role=member.role,
            joined_at=member.joined_at,
        )

    async def remove_member(
        self, workspace_id: uuid.UUID, member_user_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_admin(workspace_id, user_id)
        if member_user_id == user_id:
            raise BadRequestError("Cannot remove yourself as admin")
        member = await self.workspace_repo.get_member(workspace_id, member_user_id)
        if not member:
            raise NotFoundError("Member not found")
        await self.workspace_repo.remove_member(workspace_id, member_user_id)

    async def _check_admin(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member or member.role != "admin":
            raise ForbiddenError("Only workspace admin can perform this action")

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("You are not a member of this workspace")
