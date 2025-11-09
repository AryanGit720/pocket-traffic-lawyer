"""Dependency injection for FastAPI"""
from typing import Optional
from app.core.embed import EmbeddingModel
from app.core.generator import GeneratorModel
from app.core.indexer import IndexManager

# Global instances
_embedding_model: Optional[EmbeddingModel] = None
_generator_model: Optional[GeneratorModel] = None
_index_manager: Optional[IndexManager] = None

def set_models(embedding_model: EmbeddingModel, generator_model: GeneratorModel, index_manager: IndexManager):
    """Set the global model instances"""
    global _embedding_model, _generator_model, _index_manager
    _embedding_model = embedding_model
    _generator_model = generator_model
    _index_manager = index_manager

def get_embedding_model() -> EmbeddingModel:
    """Get the global embedding model instance"""
    if _embedding_model is None:
        raise RuntimeError("Embedding model not initialized")
    return _embedding_model

def get_generator_model() -> GeneratorModel:
    """Get the global generator model instance"""
    if _generator_model is None:
        raise RuntimeError("Generator model not initialized")
    return _generator_model

def get_index_manager() -> IndexManager:
    """Get the global index manager instance"""
    if _index_manager is None:
        raise RuntimeError("Index manager not initialized")
    return _index_manager