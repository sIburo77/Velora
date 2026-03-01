from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://velora:velora_secret@localhost:5432/velora_db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    INVITATION_EXPIRE_HOURS: int = 72

    # SMTP (Gmail)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Verification
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
