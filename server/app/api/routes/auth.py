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
    """Инициирует регистрацию пользователя.

    Генерирует 6-значный код подтверждения и отправляет его на указанный email.

    :param data: Объект с полем email.
    :type data: EmailRequest
    :return: Сообщение об успешной отправке кода.
    :rtype: MessageResponse
    :raises 400: Email уже зарегистрирован.

    HTTP метод: POST
    """
    return await service.initiate_registration(data)


@router.post("/verify-code", response_model=RegistrationTokenResponse)
async def verify_code(data: VerifyCodeRequest, service: AuthService = Depends(get_auth_service)):
    """Проверяет код подтверждения email.

    Принимает email и 6-значный код, при успехе возвращает временный токен регистрации.

    :param data: Объект с полями email и code.
    :type data: VerifyCodeRequest
    :return: Временный токен для завершения регистрации.
    :rtype: RegistrationTokenResponse
    :raises 400: Неверный или истёкший код.

    HTTP метод: POST
    """
    return await service.verify_code(data)


@router.post("/complete-registration", response_model=TokenResponse)
async def complete_registration(data: CompleteRegistrationRequest, service: AuthService = Depends(get_auth_service)):
    """Завершает регистрацию пользователя.

    Принимает email, пароль, имя и временный токен. Создаёт аккаунт и возвращает JWT-токен.

    :param data: Объект с полями email, password, name, token.
    :type data: CompleteRegistrationRequest
    :return: JWT access-токен.
    :rtype: TokenResponse
    :raises 400: Неверный токен регистрации.

    HTTP метод: POST
    """
    return await service.complete_registration(data)


@router.post("/resend-code", response_model=MessageResponse)
async def resend_code(data: EmailRequest, service: AuthService = Depends(get_auth_service)):
    """Повторно отправляет код подтверждения на email.

    :param data: Объект с полем email.
    :type data: EmailRequest
    :return: Сообщение об успешной отправке.
    :rtype: MessageResponse

    HTTP метод: POST
    """
    return await service.resend_code(data)


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, service: AuthService = Depends(get_auth_service)):
    """Аутентификация через Google OAuth.

    Принимает Google ID-токен, создаёт или находит пользователя, возвращает JWT-токен.

    :param data: Объект с полем token (Google ID token).
    :type data: GoogleAuthRequest
    :return: JWT access-токен.
    :rtype: TokenResponse
    :raises 401: Невалидный Google-токен.

    HTTP метод: POST
    """
    return await service.google_auth(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, service: AuthService = Depends(get_auth_service)):
    """Аутентификация по email и паролю.

    :param data: Объект с полями email и password.
    :type data: UserLogin
    :return: JWT access-токен.
    :rtype: TokenResponse
    :raises 401: Неверный email или пароль.

    HTTP метод: POST
    """
    return await service.login(data)
