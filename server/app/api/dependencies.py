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
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.workspace_service import WorkspaceService
from app.services.invitation_service import InvitationService
from app.services.board_service import BoardService
from app.services.email_service import EmailService

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
) -> BoardService:
    return BoardService(board_repo, workspace_repo)
