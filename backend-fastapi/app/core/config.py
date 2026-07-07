from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    env: str = "development"
    cors_origins: str = "http://localhost:3000"
    restaurant_whatsapp_number: str = ""
    public_base_url: str = "http://localhost:8000"
    upload_dir: str = "./uploads"
    mp_access_token: str = ""
    mp_public_key: str = ""
    frontend_base_url: str = "http://localhost:3000"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = ""
    sentry_dsn: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
