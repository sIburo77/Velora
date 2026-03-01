import uuid
import re

from app.core.exceptions import NotFoundError, ForbiddenError
from app.repositories.comment_repo import CommentRepository
from app.repositories.board_repo import BoardRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.user_repo import UserRepository
from app.schemas.comment import CommentCreate, CommentResponse


class CommentService:
    def __init__(
        self,
        comment_repo: CommentRepository,
        board_repo: BoardRepository,
        workspace_repo: WorkspaceRepository,
        notification_repo: NotificationRepository,
        user_repo: UserRepository,
    ):
        self.comment_repo = comment_repo
        self.board_repo = board_repo
        self.workspace_repo = workspace_repo
        self.notification_repo = notification_repo
        self.user_repo = user_repo

    async def _check_membership(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

    async def _check_can_edit(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> str:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")
        if member.role == "viewer":
            raise ForbiddenError("Viewers cannot add comments")
        return member.role

    def _to_response(self, comment) -> CommentResponse:
        return CommentResponse(
            id=comment.id,
            task_id=comment.task_id,
            author_id=comment.author_id,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author_name=comment.author.name if comment.author else None,
            author_email=comment.author.email if comment.author else None,
        )

    async def get_comments(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[CommentResponse]:
        await self._check_membership(workspace_id, user_id)
        comments = await self.comment_repo.get_by_task(task_id)
        return [self._to_response(c) for c in comments]

    async def create_comment(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, data: CommentCreate, user_id: uuid.UUID
    ) -> CommentResponse:
        await self._check_can_edit(workspace_id, user_id)
        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")

        comment = await self.comment_repo.create(task_id, user_id, data.content)
        author = await self.user_repo.get_by_id(user_id)

        # Create notification for task assignee
        if task.assigned_to and task.assigned_to != user_id:
            await self.notification_repo.create(
                user_id=task.assigned_to,
                type="comment",
                title=f"{author.name if author else 'Someone'} commented on \"{task.title}\"",
                body=data.content[:200],
                workspace_id=workspace_id,
                task_id=task_id,
            )

        # Handle @mentions
        mentioned_emails = re.findall(r'@([\w.+-]+@[\w-]+\.[\w.]+)', data.content)
        for email in mentioned_emails:
            mentioned_user = await self.user_repo.get_by_email(email)
            if mentioned_user and mentioned_user.id != user_id:
                member = await self.workspace_repo.get_member(workspace_id, mentioned_user.id)
                if member:
                    await self.notification_repo.create(
                        user_id=mentioned_user.id,
                        type="mention",
                        title=f"{author.name if author else 'Someone'} mentioned you in \"{task.title}\"",
                        body=data.content[:200],
                        workspace_id=workspace_id,
                        task_id=task_id,
                    )

        return self._to_response(comment)

    async def delete_comment(
        self, workspace_id: uuid.UUID, comment_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundError("Comment not found")

        if comment.author_id != user_id and member.role != "admin":
            raise ForbiddenError("Cannot delete this comment")

        await self.comment_repo.delete(comment_id)
