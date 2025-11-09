"""Utility functions"""
import re
from typing import List

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
    """Split text into chunks with overlap"""
    # Split by sentences first
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_size = 0
    
    for sentence in sentences:
        sentence_size = len(sentence)
        
        if current_size + sentence_size > chunk_size and current_chunk:
            # Save current chunk
            chunks.append(' '.join(current_chunk))
            
            # Start new chunk with overlap
            if overlap > 0 and len(current_chunk) > 1:
                # Keep last sentence for overlap
                current_chunk = [current_chunk[-1]]
                current_size = len(current_chunk[0])
            else:
                current_chunk = []
                current_size = 0
        
        current_chunk.append(sentence)
        current_size += sentence_size
    
    # Add remaining chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\-KATEX_INLINE_OPENKATEX_INLINE_CLOSE]', '', text)
    
    return text.strip()