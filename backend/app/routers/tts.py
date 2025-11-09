"""Text-to-Speech endpoint with edge-tts (Microsoft Edge TTS)"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
import time
import logging
import asyncio
import tempfile
from pathlib import Path

from app.schemas import TTSRequest
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

async def synthesize_speech_edge_tts(text: str) -> bytes:
    """Synthesize speech using edge-tts (Microsoft Edge TTS) - Fast and high quality"""
    try:
        import edge_tts
        
        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        # Use a natural Indian English voice
        voice = "en-IN-NeerjaNeural"  # Indian female voice, change to "en-IN-PrabhatNeural" for male
        
        # Create the TTS
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(tmp_path)
        
        # Read the audio file
        with open(tmp_path, 'rb') as f:
            audio_data = f.read()
        
        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)
        
        return audio_data
        
    except ImportError:
        logger.error("edge-tts not installed, falling back to gTTS")
        return await synthesize_speech_gtts(text)
    except Exception as e:
        logger.error(f"Edge TTS error: {e}, falling back to gTTS")
        return await synthesize_speech_gtts(text)

async def synthesize_speech_gtts(text: str) -> bytes:
    """Synthesize speech using gTTS (fallback)"""
    try:
        from gtts import gTTS
        
        tts = gTTS(text=text, lang='en', slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer.read()
    except Exception as e:
        logger.error(f"gTTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech"""
    start_time = time.time()
    
    try:
        # Use edge-tts by default (much better than pyttsx3)
        audio_data = await synthesize_speech_edge_tts(request.text)
        content_type = "audio/mpeg"
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"TTS completed in {latency_ms}ms using edge-tts")
        
        # Return audio stream
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type=content_type,
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "X-Latency-Ms": str(latency_ms),
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))