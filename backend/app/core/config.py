from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Application
    app_name: str = "Clinica Orchidea API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "noreply@clinicaorchidea.it"
    from_name: str = "Clinica Orchidea"
    
    # URLs
    frontend_url: str = "http://localhost:5173"
    api_base_url: str = "http://localhost:8000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
