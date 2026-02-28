import random
import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


class EmailService:
    async def send_verification_code(self, email: str, code: str) -> None:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP not configured, code for %s: %s", email, code)
            return

        msg = EmailMessage()
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        msg["Subject"] = "Velora — Код подтверждения"
        msg.set_content(
            f"Ваш код подтверждения: {code}\n\n"
            f"Код действителен {settings.VERIFICATION_CODE_EXPIRE_MINUTES} минут.\n"
            f"Если вы не запрашивали регистрацию, проигнорируйте это письмо."
        )

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
