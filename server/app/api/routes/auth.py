from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_service
from app.schemas.user import (
    UserLogin, TokenResponse, EmailRequest, VerifyCodeRequest,
    CompleteRegistrationRequest, GoogleAuthRequest,
    RegistrationTokenResponse, MessageResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=MessageResponse)
async def initiate_registration(data: EmailRequest, service: AuthService = Depends(get_auth_service)):
    return await service.initiate_registration(data)


@router.post("/verify-code", response_model=RegistrationTokenResponse)
async def verify_code(data: VerifyCodeRequest, service: AuthService = Depends(get_auth_service)):
    return await service.verify_code(data)


@router.post("/complete-registration", response_model=TokenResponse)
async def complete_registration(data: CompleteRegistrationRequest, service: AuthService = Depends(get_auth_service)):
    return await service.complete_registration(data)


@router.post("/resend-code", response_model=MessageResponse)
async def resend_code(data: EmailRequest, service: AuthService = Depends(get_auth_service)):
    return await service.resend_code(data)


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, service: AuthService = Depends(get_auth_service)):
    return await service.google_auth(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, service: AuthService = Depends(get_auth_service)):
    return await service.login(data)
