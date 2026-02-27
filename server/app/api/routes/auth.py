from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_service
from app.schemas.user import UserRegister, UserLogin, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, service: AuthService = Depends(get_auth_service)):
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, service: AuthService = Depends(get_auth_service)):
    return await service.login(data)
