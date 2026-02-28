from datetime import datetime, timedelta, timezone

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError, BadRequestError
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.repositories.user_repo import UserRepository
from app.repositories.verification_repo import VerificationRepository
from app.services.email_service import EmailService, generate_code
from app.schemas.user import (
    UserLogin, TokenResponse, UserResponse,
    EmailRequest, VerifyCodeRequest, CompleteRegistrationRequest,
    GoogleAuthRequest, RegistrationTokenResponse, MessageResponse,
)


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        verification_repo: VerificationRepository,
        email_service: EmailService,
    ):
        self.user_repo = user_repo
        self.verification_repo = verification_repo
        self.email_service = email_service

    # Step 1: Initiate registration — send code to email
    async def initiate_registration(self, data: EmailRequest) -> MessageResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing and existing.is_verified:
            raise ConflictError("Email already registered")

        # Delete old codes, create new one
        await self.verification_repo.delete_by_email(data.email)
        code = generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)
        await self.verification_repo.create(email=data.email, code=code, expires_at=expires_at)
        await self.email_service.send_verification_code(data.email, code)

        return MessageResponse(message="Verification code sent")

    # Step 2: Verify code — returns registration_token
    async def verify_code(self, data: VerifyCodeRequest) -> RegistrationTokenResponse:
        vc = await self.verification_repo.get_valid_code(data.email, data.code)
        if not vc:
            raise BadRequestError("Invalid or expired code")

        # Clean up used codes
        await self.verification_repo.delete_by_email(data.email)

        # Create a short-lived registration token
        token = create_access_token(
            {"sub": data.email, "purpose": "registration"},
            expires_delta=timedelta(minutes=30),
        )
        return RegistrationTokenResponse(registration_token=token)

    # Step 3: Complete registration — create user with name + password
    async def complete_registration(self, data: CompleteRegistrationRequest) -> TokenResponse:
        # Verify registration token
        payload = decode_access_token(data.registration_token)
        if not payload or payload.get("purpose") != "registration" or payload.get("sub") != data.email:
            raise UnauthorizedError("Invalid registration token")

        existing = await self.user_repo.get_by_email(data.email)
        if existing and existing.is_verified:
            raise ConflictError("Email already registered")

        # Create or update user
        if existing:
            user = await self.user_repo.update(
                existing,
                name=data.name,
                hashed_password=hash_password(data.password),
                is_verified=True,
            )
        else:
            user = await self.user_repo.create(
                email=data.email,
                name=data.name,
                hashed_password=hash_password(data.password),
                is_verified=True,
            )

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

    # Resend code
    async def resend_code(self, data: EmailRequest) -> MessageResponse:
        await self.verification_repo.delete_by_email(data.email)
        code = generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)
        await self.verification_repo.create(email=data.email, code=code, expires_at=expires_at)
        await self.email_service.send_verification_code(data.email, code)
        return MessageResponse(message="Verification code resent")

    # Google OAuth
    async def google_auth(self, data: GoogleAuthRequest) -> TokenResponse:
        try:
            idinfo = id_token.verify_oauth2_token(
                data.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except Exception:
            raise UnauthorizedError("Invalid Google token")

        google_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", email.split("@")[0])

        # Check if user exists by google_id
        user = await self.user_repo.get_by_google_id(google_id)
        if user:
            token = create_access_token({"sub": str(user.id)})
            return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

        # Check if user exists by email
        user = await self.user_repo.get_by_email(email)
        if user:
            # Link Google account to existing user
            user = await self.user_repo.update(user, google_id=google_id, is_verified=True)
            token = create_access_token({"sub": str(user.id)})
            return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

        # Create new user
        user = await self.user_repo.create(
            email=email, name=name, google_id=google_id, is_verified=True,
        )
        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

    # Login (password-based)
    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_verified:
            raise UnauthorizedError("Email not verified")

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
