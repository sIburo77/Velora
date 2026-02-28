import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Multi-step registration schemas

class EmailRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class CompleteRegistrationRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    registration_token: str


class GoogleAuthRequest(BaseModel):
    credential: str


class RegistrationTokenResponse(BaseModel):
    registration_token: str


class MessageResponse(BaseModel):
    message: str
