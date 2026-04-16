import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_invitation_service
from app.schemas.invitation import InvitationCreate, InvitationResponse, InvitationAccept
from app.services.invitation_service import InvitationService

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.post("/workspace/{workspace_id}", response_model=InvitationResponse, status_code=201)
async def create_invitation(
    workspace_id: uuid.UUID,
    data: InvitationCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: InvitationService = Depends(get_invitation_service),
):
    """Создаёт приглашение в рабочее пространство.

    Генерирует уникальный токен приглашения со сроком действия 72 часа.

    :param data: Объект с полем email приглашаемого пользователя.
    :type data: InvitationCreate
    :return: Данные созданного приглашения.
    :rtype: InvitationResponse
    :raises 400: Пользователь уже является участником.
    :raises 403: Недостаточно прав (только owner).

    HTTP метод: POST
    """
    return await service.create_invitation(workspace_id, data, user_id)


@router.post("/accept", response_model=InvitationResponse)
async def accept_invitation(
    data: InvitationAccept,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: InvitationService = Depends(get_invitation_service),
):
    """Принимает приглашение в рабочее пространство.

    Пользователь добавляется как участник с ролью member.

    :param data: Объект с полем token (токен приглашения).
    :type data: InvitationAccept
    :return: Обновлённое приглашение со статусом accepted.
    :rtype: InvitationResponse
    :raises 400: Токен недействителен или истёк.

    HTTP метод: POST
    """
    return await service.accept_invitation(data.token, user_id)


@router.post("/decline", response_model=InvitationResponse)
async def decline_invitation(
    data: InvitationAccept,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: InvitationService = Depends(get_invitation_service),
):
    """Отклоняет приглашение в рабочее пространство.

    :param data: Объект с полем token (токен приглашения).
    :type data: InvitationAccept
    :return: Обновлённое приглашение со статусом declined.
    :rtype: InvitationResponse

    HTTP метод: POST
    """
    return await service.decline_invitation(data.token, user_id)


@router.get("/my", response_model=list[InvitationResponse])
async def my_pending_invitations(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: InvitationService = Depends(get_invitation_service),
):
    """Возвращает список ожидающих приглашений текущего пользователя.

    :return: Список приглашений со статусом pending.
    :rtype: list[InvitationResponse]

    HTTP метод: GET
    """
    return await service.get_pending_for_user(user_id)


@router.get("/workspace/{workspace_id}", response_model=list[InvitationResponse])
async def list_invitations(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: InvitationService = Depends(get_invitation_service),
):
    """Возвращает список всех приглашений рабочего пространства.

    Доступ: участник рабочего пространства.

    :param workspace_id: Идентификатор рабочего пространства.
    :type workspace_id: uuid.UUID
    :return: Список приглашений.
    :rtype: list[InvitationResponse]

    HTTP метод: GET
    """
    return await service.get_workspace_invitations(workspace_id, user_id)
