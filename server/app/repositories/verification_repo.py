from datetime import datetime, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verification_code import VerificationCode


class VerificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, email: str, code: str, expires_at: datetime) -> VerificationCode:
        vc = VerificationCode(email=email, code=code, expires_at=expires_at)
        self.db.add(vc)
        await self.db.flush()
        return vc

    async def get_valid_code(self, email: str, code: str) -> VerificationCode | None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(VerificationCode).where(
                VerificationCode.email == email,
                VerificationCode.code == code,
                VerificationCode.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def delete_by_email(self, email: str) -> None:
        await self.db.execute(
            delete(VerificationCode).where(VerificationCode.email == email)
        )
        await self.db.flush()
