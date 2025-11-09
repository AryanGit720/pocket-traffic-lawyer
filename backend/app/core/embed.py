"""Embedding model wrapper with enhanced capabilities"""
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union
import logging
import re

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Wrapper for sentence transformer embedding models with preprocessing"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name, device='cpu')
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding dimension: {self.dimension}")
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text for better embedding quality"""
        # Convert to lowercase
        text = text.lower()
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Expand common abbreviations
        abbreviations = {
            'rc': 'registration certificate',
            'dl': 'driving license',
            'puc': 'pollution under control',
            'rto': 'regional transport office',
            'mvact': 'motor vehicles act',
            'cmvr': 'central motor vehicle rules',
            'dui': 'driving under influence drunk driving',
            'bac': 'blood alcohol content',
        }
        
        for abbr, full in abbreviations.items():
            text = re.sub(r'\b' + abbr + r'\b', full, text)
        
        return text.strip()
    
    def encode(self, texts: Union[str, List[str]], normalize: bool = True, preprocess: bool = True) -> np.ndarray:
        """Encode texts to embeddings with optional preprocessing"""
        if isinstance(texts, str):
            texts = [texts]
        
        # Optionally preprocess
        if preprocess:
            texts = [self.preprocess_text(t) for t in texts]
        
        # Encode with normalization
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=normalize,
            show_progress_bar=False,
            batch_size=32
        )
        
        return embeddings
    
    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.dimension