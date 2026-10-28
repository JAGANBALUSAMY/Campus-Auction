from functools import lru_cache

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Campus Auction API"
    environment: str = "development"
    database_url: SecretStr | None = None
    cors_allowed_origins: str = "http://localhost:5173"
    jwt_secret_key: SecretStr | None = None
    access_token_expire_minutes: int = Field(default=15, ge=5, le=60)
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_cookie_settings(self) -> "Settings":
        if (
            self.environment.lower() in {"production", "prod"}
            and not self.auth_cookie_secure
        ):
            raise ValueError(
                "AUTH_COOKIE_SECURE must be true in production environments."
            )
        if self.auth_cookie_samesite.lower() not in {"lax", "strict", "none"}:
            raise ValueError("AUTH_COOKIE_SAMESITE must be lax, strict, or none.")
        if (
            self.auth_cookie_samesite.lower() == "none"
            and not self.auth_cookie_secure
        ):
            raise ValueError("SameSite=None requires secure authentication cookies.")
        if (
            self.jwt_secret_key is not None
            and len(self.jwt_secret_key.get_secret_value()) < 32
        ):
            raise ValueError("JWT_SECRET_KEY must contain at least 32 characters.")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
