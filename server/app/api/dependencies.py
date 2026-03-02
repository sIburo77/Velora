import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.repositories.user_repo import UserRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.invitation_repo import InvitationRepository
from app.repositories.board_repo import BoardRepository
from app.repositories.verification_repo import VerificationRepository
from app.repositories.comment_repo import CommentRepository
from app.repositories.attachment_repo import AttachmentRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.tag_repo import TagRepository
from app.repositories.activity_log_repo import ActivityLogRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.workspace_service import WorkspaceService
from app.services.invitation_service import InvitationService
from app.services.board_service import BoardService
from app.services.email_service import EmailService
from app.services.comment_service import CommentService
from app.services.attachment_service import AttachmentService
from app.services.chat_service import ChatService
from app.services.notification_service import NotificationService
from app.services.tag_service import TagService
from app.services.activity_log_service import ActivityLogService

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> uuid.UUID:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedError("Invalid or expired token")
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Invalid token payload")
    return uuid.UUID(user_id)


# Repositories
def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_workspace_repo(db: AsyncSession = Depends(get_db)) -> WorkspaceRepository:
    return WorkspaceRepository(db)


def get_invitation_repo(db: AsyncSession = Depends(get_db)) -> InvitationRepository:
    return InvitationRepository(db)


def get_board_repo(db: AsyncSession = Depends(get_db)) -> BoardRepository:
    return BoardRepository(db)


def get_verification_repo(db: AsyncSession = Depends(get_db)) -> VerificationRepository:
    return VerificationRepository(db)


def get_comment_repo(db: AsyncSession = Depends(get_db)) -> CommentRepository:
    return CommentRepository(db)


def get_attachment_repo(db: AsyncSession = Depends(get_db)) -> AttachmentRepository:
    return AttachmentRepository(db)


def get_chat_repo(db: AsyncSession = Depends(get_db)) -> ChatRepository:
    return ChatRepository(db)


def get_notification_repo(db: AsyncSession = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


def get_tag_repo(db: AsyncSession = Depends(get_db)) -> TagRepository:
    return TagRepository(db)


def get_activity_log_repo(db: AsyncSession = Depends(get_db)) -> ActivityLogRepository:
    return ActivityLogRepository(db)


# Services
def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    verification_repo: VerificationRepository = Depends(get_verification_repo),
) -> AuthService:
    return AuthService(user_repo, verification_repo, EmailService())


def get_user_service(user_repo: UserRepository = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)


def get_workspace_service(
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
    board_repo: BoardRepository = Depends(get_board_repo),
) -> WorkspaceService:
    return WorkspaceService(workspace_repo, board_repo)


def get_invitation_service(
    invitation_repo: InvitationRepository = Depends(get_invitation_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
    user_repo: UserRepository = Depends(get_user_repo),
) -> InvitationService:
    return InvitationService(invitation_repo, workspace_repo, user_repo)


def get_board_service(
    board_repo: BoardRepository = Depends(get_board_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
    notification_repo: NotificationRepository = Depends(get_notification_repo),
    activity_repo: ActivityLogRepository = Depends(get_activity_log_repo),
) -> BoardService:
    return BoardService(board_repo, workspace_repo, notification_repo, activity_repo)


def get_comment_service(
    comment_repo: CommentRepository = Depends(get_comment_repo),
    board_repo: BoardRepository = Depends(get_board_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
    notification_repo: NotificationRepository = Depends(get_notification_repo),
    user_repo: UserRepository = Depends(get_user_repo),
) -> CommentService:
    return CommentService(comment_repo, board_repo, workspace_repo, notification_repo, user_repo)


def get_attachment_service(
    attachment_repo: AttachmentRepository = Depends(get_attachment_repo),
    board_repo: BoardRepository = Depends(get_board_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> AttachmentService:
    return AttachmentService(attachment_repo, board_repo, workspace_repo)


def get_chat_service(
    chat_repo: ChatRepository = Depends(get_chat_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> ChatService:
    return ChatService(chat_repo, workspace_repo)


def get_notification_service(
    notification_repo: NotificationRepository = Depends(get_notification_repo),
) -> NotificationService:
    return NotificationService(notification_repo)


def get_tag_service(
    tag_repo: TagRepository = Depends(get_tag_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
    board_repo: BoardRepository = Depends(get_board_repo),
) -> TagService:
    return TagService(tag_repo, workspace_repo, board_repo)


def get_activity_log_service(
    activity_repo: ActivityLogRepository = Depends(get_activity_log_repo),
    workspace_repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> ActivityLogService:
    return ActivityLogService(activity_repo, workspace_repo)
