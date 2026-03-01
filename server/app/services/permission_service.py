import uuid

from app.core.exceptions import ForbiddenError
from app.repositories.workspace_repo import WorkspaceRepository


class PermissionService:
    def __init__(self, workspace_repo: WorkspaceRepository):
        self.workspace_repo = workspace_repo

    async def check_role(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID, min_role: str = "viewer"
    ) -> str:
        """Check user's role in workspace. Returns role string.
        Roles hierarchy: admin > editor > member > viewer
        """
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        role_hierarchy = {"viewer": 0, "member": 1, "editor": 2, "admin": 3}
        user_level = role_hierarchy.get(member.role, 1)  # default to member
        required_level = role_hierarchy.get(min_role, 0)

        if user_level < required_level:
            raise ForbiddenError(f"Requires {min_role} role or higher")

        return member.role

    async def is_admin(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        return member is not None and member.role == "admin"
