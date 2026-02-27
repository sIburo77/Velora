import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_user_service
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    return await service.get_profile(user_id)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    return await service.update_profile(user_id, data)


@router.delete("/me")
async def delete_account(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    await service.delete_account(user_id)
    return {"detail": "Account deleted"}
