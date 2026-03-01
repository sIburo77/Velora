import os
import uuid

import aiofiles

from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.repositories.attachment_repo import AttachmentRepository
from app.repositories.board_repo import BoardRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.attachment import AttachmentResponse


class AttachmentService:
    def __init__(
        self,
        attachment_repo: AttachmentRepository,
        board_repo: BoardRepository,
        workspace_repo: WorkspaceRepository,
    ):
        self.attachment_repo = attachment_repo
        self.board_repo = board_repo
        self.workspace_repo = workspace_repo

    async def _check_can_edit(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> str:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")
        if member.role == "viewer":
            raise ForbiddenError("Viewers cannot upload files")
        return member.role

    def _to_response(self, attachment) -> AttachmentResponse:
        return AttachmentResponse(
            id=attachment.id,
            task_id=attachment.task_id,
            filename=attachment.filename,
            content_type=attachment.content_type,
            size_bytes=attachment.size_bytes,
            uploaded_by=attachment.uploaded_by,
            created_at=attachment.created_at,
            uploader_name=attachment.uploader.name if attachment.uploader else None,
        )

    async def get_attachments(
        self, workspace_id: uuid.UUID, task_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[AttachmentResponse]:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")
        attachments = await self.attachment_repo.get_by_task(task_id)
        return [self._to_response(a) for a in attachments]

    async def upload_file(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        filename: str,
        content_type: str,
        file_data: bytes,
    ) -> AttachmentResponse:
        await self._check_can_edit(workspace_id, user_id)

        task = await self.board_repo.get_task(task_id)
        if not task:
            raise NotFoundError("Task not found")

        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_data) > max_size:
            raise BadRequestError(f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")

        upload_dir = os.path.join(settings.UPLOAD_DIR, str(workspace_id))
        os.makedirs(upload_dir, exist_ok=True)

        ext = os.path.splitext(filename)[1]
        stored_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(upload_dir, stored_filename)

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_data)

        attachment = await self.attachment_repo.create(
            task_id=task_id,
            filename=filename,
            stored_filename=stored_filename,
            content_type=content_type,
            size_bytes=len(file_data),
            uploaded_by=user_id,
        )
        # reload with uploader
        attachment = await self.attachment_repo.get_by_id(attachment.id)
        return AttachmentResponse(
            id=attachment.id,
            task_id=attachment.task_id,
            filename=attachment.filename,
            content_type=attachment.content_type,
            size_bytes=attachment.size_bytes,
            uploaded_by=attachment.uploaded_by,
            created_at=attachment.created_at,
        )

    async def get_file_path(
        self, workspace_id: uuid.UUID, attachment_id: uuid.UUID, user_id: uuid.UUID
    ) -> tuple[str, str, str]:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        attachment = await self.attachment_repo.get_by_id(attachment_id)
        if not attachment:
            raise NotFoundError("Attachment not found")

        file_path = os.path.join(settings.UPLOAD_DIR, str(workspace_id), attachment.stored_filename)
        if not os.path.exists(file_path):
            raise NotFoundError("File not found on disk")

        return file_path, attachment.filename, attachment.content_type

    async def delete_attachment(
        self, workspace_id: uuid.UUID, attachment_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")

        attachment = await self.attachment_repo.get_by_id(attachment_id)
        if not attachment:
            raise NotFoundError("Attachment not found")

        if attachment.uploaded_by != user_id and member.role != "admin":
            raise ForbiddenError("Cannot delete this attachment")

        file_path = os.path.join(settings.UPLOAD_DIR, str(workspace_id), attachment.stored_filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        await self.attachment_repo.delete(attachment_id)
