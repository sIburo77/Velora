import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import FileResponse

from app.api.dependencies import get_current_user_id, get_attachment_service
from app.schemas.attachment import AttachmentResponse
from app.services.attachment_service import AttachmentService

router = APIRouter(
    prefix="/workspaces/{workspace_id}/board/tasks/{task_id}/attachments",
    tags=["Attachments"],
)


@router.get("", response_model=list[AttachmentResponse])
async def get_attachments(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: AttachmentService = Depends(get_attachment_service),
):
    return await service.get_attachments(workspace_id, task_id, user_id)


@router.post("", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: AttachmentService = Depends(get_attachment_service),
):
    file_data = await file.read()
    return await service.upload_file(
        workspace_id, task_id, user_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_data=file_data,
    )


@router.get("/{attachment_id}/download")
async def download_attachment(
    workspace_id: uuid.UUID,
    attachment_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: AttachmentService = Depends(get_attachment_service),
):
    file_path, filename, content_type = await service.get_file_path(
        workspace_id, attachment_id, user_id
    )
    return FileResponse(file_path, filename=filename, media_type=content_type)


@router.delete("/{attachment_id}")
async def delete_attachment(
    workspace_id: uuid.UUID,
    attachment_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: AttachmentService = Depends(get_attachment_service),
):
    await service.delete_attachment(workspace_id, attachment_id, user_id)
    return {"detail": "Attachment deleted"}
