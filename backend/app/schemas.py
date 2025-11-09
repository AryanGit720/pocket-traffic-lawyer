"""Pydantic schemas for request/response models"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)

class Source(BaseModel):
    id: str
    source: str
    snippet: str
    score: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    latency_ms: int
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class STTRequest(BaseModel):
    # Audio data will be sent as multipart form data
    pass

class STTResponse(BaseModel):
    text: str
    latency_ms: int

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)

class IndexRequest(BaseModel):
    dataset_path: Optional[str] = None
    chunk_size: int = Field(default=512, ge=100, le=2000)
    rebuild: bool = True

class IndexResponse(BaseModel):
    success: bool
    message: str
    doc_count: int
    index_size_mb: float

class StatsResponse(BaseModel):
    doc_count: int
    index_size_mb: float
    last_updated: Optional[datetime]
    embedding_model: str
    top_k: int