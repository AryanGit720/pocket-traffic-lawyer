# backend/app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import time
import logging

from app.schemas import ChatRequest, ChatResponse, Source
from app.deps import get_index_manager, get_generator_model
from app.core.rag import RAGPipeline
from app.config import settings
from app.database import get_db
from app.core.permissions import get_current_user_optional
from app.models.chat_history import ChatHistory
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    index_manager = Depends(get_index_manager),
    generator = Depends(get_generator_model),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ChatResponse:
    """Process a chat query about Indian traffic laws"""
    start_time = time.time()
    try:
        if not index_manager.is_loaded():
            raise HTTPException(
                status_code=503,
                detail="Index not loaded. Please build the index first."
            )
        rag = RAGPipeline(
            index_manager=index_manager,
            generator=generator,
            rerank_enabled=settings.RERANK_ENABLE
        )
        result = await rag.process_query(request.query)
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Query: {request.query[:100]}... | Latency: {latency_ms}ms")
        response = ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            latency_ms=latency_ms,
            confidence=result["confidence"]
        )
        # Save history if logged in
        if current_user:
            try:
                sources_payload = [s.model_dump() if hasattr(s, "model_dump") else s for s in response.sources]  # type: ignore
                item = ChatHistory(
                    user_id=current_user.id,
                    question=request.query,
                    answer=response.answer,
                    sources=sources_payload,
                    confidence=response.confidence,
                )
                db.add(item)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to save chat history: {e}", exc_info=True)
        return response
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))