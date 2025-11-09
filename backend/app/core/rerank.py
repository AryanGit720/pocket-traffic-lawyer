"""Cross-encoder reranking"""
from sentence_transformers import CrossEncoder
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class Reranker:
    """Cross-encoder for reranking retrieved documents"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        logger.info(f"Loading reranker model: {model_name}")
        self.model = CrossEncoder(model_name, device='cpu')
    
    def rerank(self, query: str, documents: List[Tuple[Dict, float]], top_k: int = 5) -> List[Tuple[Dict, float]]:
        """Rerank documents based on query relevance"""
        if not documents:
            return []
        
        # Prepare pairs for reranking
        pairs = []
        for doc, _ in documents:
            # Use the chunk text for reranking
            text = doc.get('chunk', doc.get('answer', ''))
            pairs.append([query, text])
        
        # Get reranking scores
        scores = self.model.predict(pairs)
        
        # Combine with documents and sort
        reranked = []
        for i, (doc, _) in enumerate(documents):
            reranked.append((doc, float(scores[i])))
        
        # Sort by new scores
        reranked.sort(key=lambda x: x[1], reverse=True)
        
        return reranked[:top_k]