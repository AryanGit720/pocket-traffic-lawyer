"""Configuration management using pydantic-settings"""
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

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
    
    # Create directories
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.FAISS_DIR.mkdir(parents=True, exist_ok=True)
        self.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()