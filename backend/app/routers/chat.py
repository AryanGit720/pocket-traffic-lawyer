"""Chat endpoint for RAG-based Q&A"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import time
import logging

from app.schemas import ChatRequest, ChatResponse, Source
from app.deps import get_index_manager, get_generator_model
from app.core.rag import RAGPipeline
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    index_manager = Depends(get_index_manager),
    generator = Depends(get_generator_model)
) -> ChatResponse:
    """Process a chat query about Indian traffic laws"""
    start_time = time.time()
    
    try:
        # Check if index is loaded
        if not index_manager.is_loaded():
            raise HTTPException(
                status_code=503,
                detail="Index not loaded. Please build the index first."
            )
        
        # Initialize RAG pipeline
        rag = RAGPipeline(
            index_manager=index_manager,
            generator=generator,
            rerank_enabled=settings.RERANK_ENABLE
        )
        
        # Process query
        result = await rag.process_query(request.query)
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Log the query
        logger.info(f"Query: {request.query[:100]}... | Latency: {latency_ms}ms")
        
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            latency_ms=latency_ms,
            confidence=result["confidence"]
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))