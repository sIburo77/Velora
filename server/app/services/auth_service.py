from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, data: UserRegister) -> TokenResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictError("Email already registered")

        user = await self.user_repo.create(
            email=data.email,
            name=data.name,
            hashed_password=hash_password(data.password),
        )

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )
