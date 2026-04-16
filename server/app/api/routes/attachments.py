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
    """Возвращает список вложений задачи.

    :param task_id: Идентификатор задачи.
    :type task_id: uuid.UUID
    :return: Список вложений с именем файла, размером и MIME-типом.
    :rtype: list[AttachmentResponse]

    HTTP метод: GET
    """
    return await service.get_attachments(workspace_id, task_id, user_id)


@router.post("", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: AttachmentService = Depends(get_attachment_service),
):
    """Загружает файловое вложение к задаче.

    Максимальный размер файла — 10 МБ.

    :param file: Загружаемый файл.
    :type file: UploadFile
    :return: Данные созданного вложения.
    :rtype: AttachmentResponse
    :raises 400: Файл слишком большой.

    HTTP метод: POST
    """
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
    """Скачивает файловое вложение.

    Возвращает файл с оригинальным именем и MIME-типом.

    :param attachment_id: Идентификатор вложения.
    :type attachment_id: uuid.UUID
    :return: Файл вложения.
    :rtype: FileResponse
    :raises 404: Вложение не найдено.

    HTTP метод: GET
    """
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
    """Удаляет файловое вложение.

    :param attachment_id: Идентификатор вложения.
    :type attachment_id: uuid.UUID
    :return: Подтверждение удаления.
    :rtype: dict
    :raises 404: Вложение не найдено.

    HTTP метод: DELETE
    """
    await service.delete_attachment(workspace_id, attachment_id, user_id)
    return {"detail": "Attachment deleted"}
