"""Main FastAPI application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from app.config import settings
from app.routers import chat, stt, tts, admin
from app.core.embed import EmbeddingModel
from app.core.generator import GeneratorModel
from app.core.indexer import IndexManager
from app.deps import set_models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize models on startup"""
    logger.info("Initializing models...")
    
    # Initialize embedding model
    embedding_model = EmbeddingModel(settings.MODEL_NAME_EMBED)
    
    # Initialize generator model
    generator_model = GeneratorModel(
        model_name=settings.MODEL_NAME_GEN,
        use_local=settings.USE_LOCAL_GENERATOR,
        api_key=settings.GROQ_API_KEY
    )
    
    # Initialize index manager
    index_manager = IndexManager(
        embedding_model=embedding_model,
        index_dir=settings.FAISS_DIR
    )
    
    # Set global instances
    set_models(embedding_model, generator_model, index_manager)
    
    # Load existing index if available
    if index_manager.load_index():
        logger.info("Loaded existing FAISS index")
    else:
        logger.warning("No existing index found. Please build index via admin API.")
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")

app = FastAPI(
    title="Pocket Traffic Lawyer API",
    description="AI-powered Indian traffic law assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api")
app.include_router(stt.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")

@app.get("/")
async def root():
    return {
        "message": "Pocket Traffic Lawyer API",
        "version": "1.0.0",
        "disclaimer": "This service provides informational content about Indian traffic laws and is not a substitute for professional legal advice."
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}