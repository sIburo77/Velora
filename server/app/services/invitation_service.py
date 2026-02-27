import uuid
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError, ConflictError
from app.repositories.invitation_repo import InvitationRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.user_repo import UserRepository
from app.schemas.invitation import InvitationCreate, InvitationResponse


class InvitationService:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        workspace_repo: WorkspaceRepository,
        user_repo: UserRepository,
    ):
        self.invitation_repo = invitation_repo
        self.workspace_repo = workspace_repo
        self.user_repo = user_repo

    async def create_invitation(
        self, workspace_id: uuid.UUID, data: InvitationCreate, user_id: uuid.UUID
    ) -> InvitationResponse:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member or member.role != "owner":
            raise ForbiddenError("Only workspace owner can invite members")

        existing_member_user = await self.user_repo.get_by_email(data.email)
        if existing_member_user:
            existing_membership = await self.workspace_repo.get_member(workspace_id, existing_member_user.id)
            if existing_membership:
                raise ConflictError("User is already a member of this workspace")

        existing_invitation = await self.invitation_repo.get_pending_by_email_and_workspace(
            data.email, workspace_id
        )
        if existing_invitation:
            raise ConflictError("Invitation already sent to this email")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.INVITATION_EXPIRE_HOURS)

        invitation = await self.invitation_repo.create(
            workspace_id=workspace_id,
            email=data.email,
            token=token,
            invited_by=user_id,
            expires_at=expires_at,
        )
        return InvitationResponse.model_validate(invitation)

    async def accept_invitation(self, token: str, user_id: uuid.UUID) -> InvitationResponse:
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise NotFoundError("Invitation not found")

        if invitation.status != "pending":
            raise BadRequestError("Invitation already processed")

        if invitation.expires_at < datetime.now(timezone.utc):
            raise BadRequestError("Invitation has expired")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if user.email != invitation.email:
            raise ForbiddenError("This invitation was sent to a different email")

        existing = await self.workspace_repo.get_member(invitation.workspace_id, user_id)
        if existing:
            raise ConflictError("Already a member of this workspace")

        await self.workspace_repo.add_member(invitation.workspace_id, user_id, role="member")
        updated = await self.invitation_repo.update_status(invitation, "accepted")
        return InvitationResponse.model_validate(updated)

    async def get_workspace_invitations(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[InvitationResponse]:
        member = await self.workspace_repo.get_member(workspace_id, user_id)
        if not member:
            raise ForbiddenError("Not a member of this workspace")
        invitations = await self.invitation_repo.get_by_workspace(workspace_id)
        return [InvitationResponse.model_validate(inv) for inv in invitations]

    async def get_pending_for_user(self, email: str) -> list[InvitationResponse]:
        from sqlalchemy import select
        invitations = []
        return invitations
