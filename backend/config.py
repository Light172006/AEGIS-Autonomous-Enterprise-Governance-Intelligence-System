"""Backend configuration module."""

import os
import secrets
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

@dataclass
class BackendConfig:
    database_url: str = "sqlite:///aegis.db"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    upload_dir: Path = field(default_factory=lambda: Path("data/uploads"))
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:3000"])
    admin_email: str = "admin@aegis.local"
    admin_password: str = "aegis-admin-2024"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = ""

    @classmethod
    def from_env(cls) -> "BackendConfig":
        load_dotenv()
        
        PROJECT_ROOT = Path(__file__).resolve().parents[1]
        
        jwt_secret = os.getenv("AEGIS_JWT_SECRET")
        if not jwt_secret:
            print("WARNING: AEGIS_JWT_SECRET not set in .env. Generating a random one. "
                  "Tokens will be invalidated upon restart.")
            jwt_secret = secrets.token_urlsafe(32)
            
        upload_dir_env = os.getenv("AEGIS_UPLOAD_DIR")
        upload_dir = PROJECT_ROOT / upload_dir_env if upload_dir_env else PROJECT_ROOT / "data" / "uploads"
        
        cors_origins_env = os.getenv("AEGIS_CORS_ORIGINS", "http://localhost:3000")
        cors_origins = [o.strip() for o in cors_origins_env.split(",")] if cors_origins_env else ["http://localhost:3000"]
        
        return cls(
            database_url=os.getenv("AEGIS_DATABASE_URL", "sqlite:///aegis.db"),
            jwt_secret=jwt_secret,
            jwt_expire_minutes=int(os.getenv("AEGIS_JWT_EXPIRE_MINUTES", "480")),
            upload_dir=upload_dir,
            cors_origins=cors_origins,
            admin_password=os.getenv("AEGIS_ADMIN_PASSWORD", "aegis-admin-2024"),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            ollama_model=os.getenv("OLLAMA_MODEL", "")
        )
