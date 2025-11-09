"""Speech-to-Text endpoint"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import time
import logging
from pathlib import Path

from app.schemas import STTResponse
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Lazy load STT model
_stt_model = None

def get_stt_model():
    """Lazy load the STT model"""
    global _stt_model
    if _stt_model is None and settings.STT_ENABLE:
        try:
            from faster_whisper import WhisperModel
            _stt_model = WhisperModel(
                settings.MODEL_NAME_STT,
                device="cpu",
                compute_type="int8"
            )
            logger.info("STT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load STT model: {e}")
            raise
    return _stt_model

@router.post("/stt", response_model=STTResponse)
async def speech_to_text(audio: UploadFile = File(...)) -> STTResponse:
    """Convert speech to text"""
    if not settings.STT_ENABLE:
        raise HTTPException(status_code=503, detail="STT is disabled")
    
    start_time = time.time()
    
    try:
        # Validate audio format
        if audio.content_type not in ["audio/wav", "audio/webm", "audio/mpeg"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format: {audio.content_type}"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Get STT model
            model = get_stt_model()
            if model is None:
                raise HTTPException(status_code=503, detail="STT model not available")
            
            # Transcribe
            segments, _ = model.transcribe(tmp_path, language="en")
            text = " ".join([segment.text.strip() for segment in segments])
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"STT completed in {latency_ms}ms")
            
            return STTResponse(text=text, latency_ms=latency_ms)
            
        finally:
            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)
            
    except Exception as e:
        logger.error(f"STT error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))