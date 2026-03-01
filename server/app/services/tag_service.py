import uuid

from app.core.exceptions import NotFoundError, ForbiddenError
from app.repositories.tag_repo import TagRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.board_repo import BoardRepository
from app.schemas.tag import TagCreate, TagResponse


class TagService:
    def __init__(
        self,
        tag_repo: TagRepository,
        workspace_repo: WorkspaceRepository,
        board_repo: BoardRepository,
    ):
        self.tag_repo = tag_repo
        self.workspace_repo = workspace_repo
        self.board_repo = board_repo

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

    async def create_tag(
        self, workspace_id: uuid.UUID, data: TagCreate, user_id: uuid.UUID
    ) -> TagResponse:
        await self._check_membership(workspace_id, user_id)
        tag = await self.tag_repo.create(workspace_id, data.name, data.color)
        return TagResponse.model_validate(tag)

    async def get_workspace_tags(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[TagResponse]:
        await self._check_membership(workspace_id, user_id)
        tags = await self.tag_repo.get_workspace_tags(workspace_id)
        return [TagResponse.model_validate(t) for t in tags]

    async def delete_tag(
        self, workspace_id: uuid.UUID, tag_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_membership(workspace_id, user_id)
        tag = await self.tag_repo.get_by_id(tag_id)
        if not tag or tag.workspace_id != workspace_id:
            raise NotFoundError("Tag not found")
        await self.tag_repo.delete(tag_id)

    async def add_tag_to_task(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, tag_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_membership(workspace_id, user_id)
        tag = await self.tag_repo.get_by_id(tag_id)
        if not tag or tag.workspace_id != workspace_id:
            raise NotFoundError("Tag not found")
        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")
        await self.tag_repo.add_tag_to_task(task_id, tag_id)

    async def remove_tag_from_task(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, tag_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        await self._check_membership(workspace_id, user_id)
        await self.tag_repo.remove_tag_from_task(task_id, tag_id)
