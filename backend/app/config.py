# backend/app/config.py
"""Configuration management using pydantic-settings"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from pathlib import Path
from typing import Optional, List

class Settings(BaseSettings):
    # Model Configuration
    MODEL_NAME_EMBED: str = "sentence-transformers/all-mpnet-base-v2"
    MODEL_NAME_GEN: str = "google/flan-t5-base"
    MODEL_NAME_RERANK: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    MODEL_NAME_STT: str = "base"
    
    # API Keys
    GROQ_API_KEY: Optional[str] = None
    
    # Feature Flags
    RERANK_ENABLE: bool = False
    USE_LOCAL_GENERATOR: bool = False
    STT_ENABLE: bool = True
    TTS_ENGINE: str = "pyttsx3"
    ENABLE_QUERY_EXPANSION: bool = True
    ENABLE_HYBRID_SEARCH: bool = True
    
    # Paths
    FAISS_DIR: Path = Path("app/data/index")
    HF_HOME: Path = Path("/models_cache")
    LOG_FILE: Path = Path("logs/app.log")
    
    # RAG Configuration
    TOP_K: int = 5
    CHUNK_SIZE: int = 512
    CONFIDENCE_THRESHOLD: float = 0.15
    MIN_SEMANTIC_SIMILARITY: float = 0.25

    # Auth / DB / CORS
    JWT_SECRET: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./app/data/auth.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:4173"]

    ADMIN_EMAIL: str = "admin@pockettrafficlawyer.com"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    # Create directories
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.FAISS_DIR.mkdir(parents=True, exist_ok=True)
        self.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        # Ensure auth DB dir exists if using SQLite file path
        if self.DATABASE_URL.startswith("sqlite:///"):
            db_path = Path(self.DATABASE_URL.replace("sqlite:///", ""))
            db_path.parent.mkdir(parents=True, exist_ok=True)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()