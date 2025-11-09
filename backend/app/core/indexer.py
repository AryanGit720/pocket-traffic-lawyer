"""FAISS index management"""
import faiss
import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

from app.core.embed import EmbeddingModel
from app.core.utils import chunk_text

logger = logging.getLogger(__name__)

class IndexManager:
    """Manages FAISS index and document metadata"""
    
    def __init__(self, embedding_model: EmbeddingModel, index_dir: Path):
        self.embedding_model = embedding_model
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        self.index: Optional[faiss.IndexFlatIP] = None
        self.documents: List[Dict] = []
        self.metadata: Dict = {}
    
    def build_index(self, df: pd.DataFrame, chunk_size: int = 512, rebuild: bool = True) -> int:
        """Build FAISS index from dataframe"""
        logger.info(f"Building index from {len(df)} documents")
        
        # Prepare documents
        all_texts = []
        all_docs = []
        
        for _, row in df.iterrows():
            # Combine answer and source for better retrieval
            text = f"{row['answer']} Source: {row['source']}"
            
            # Optional chunking for long
                        # Optional chunking for long texts
            if len(text) > chunk_size:
                chunks = chunk_text(text, chunk_size)
                for chunk in chunks:
                    all_texts.append(chunk)
                    all_docs.append({
                        'id': row['id'],
                        'question': row['question'],
                        'answer': row['answer'],
                        'source': row['source'],
                        'category': row['category'],
                        'chunk': chunk
                    })
            else:
                all_texts.append(text)
                all_docs.append({
                    'id': row['id'],
                    'question': row['question'],
                    'answer': row['answer'],
                    'source': row['source'],
                    'category': row['category'],
                    'chunk': text
                })
        
        # Generate embeddings
        logger.info(f"Generating embeddings for {len(all_texts)} text chunks")
        embeddings = self.embedding_model.encode(all_texts, normalize=True)
        
        # Create FAISS index
        dimension = self.embedding_model.get_dimension()
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for normalized vectors
        self.index.add(embeddings.astype('float32'))
        
        # Store documents and metadata
        self.documents = all_docs
        self.metadata = {
            'doc_count': len(all_docs),
            'chunk_size': chunk_size,
            'last_updated': datetime.utcnow(),
            'original_doc_count': len(df)
        }
        
        # Save to disk
        self.save_index()
        
        logger.info(f"Index built with {len(all_docs)} chunks from {len(df)} documents")
        return len(all_docs)
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[Dict, float]]:
        """Search the index for similar documents"""
        if self.index is None or len(self.documents) == 0:
            raise ValueError("Index not loaded")
        
        # Encode query
        query_embedding = self.embedding_model.encode(query, normalize=True)
        
        # Search
        scores, indices = self.index.search(
            query_embedding.reshape(1, -1).astype('float32'),
            min(top_k, len(self.documents))
        )
        
        # Prepare results
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx >= 0:  # Valid index
                results.append((self.documents[idx], float(score)))
        
        return results
    
    def save_index(self):
        """Save index and metadata to disk"""
        # Save FAISS index
        faiss.write_index(self.index, str(self.index_dir / "index.faiss"))
        
        # Save documents
        with open(self.index_dir / "documents.pkl", "wb") as f:
            pickle.dump(self.documents, f)
        
        # Save metadata
        with open(self.index_dir / "metadata.pkl", "wb") as f:
            pickle.dump(self.metadata, f)
        
        logger.info("Index saved to disk")
    
    def load_index(self) -> bool:
        """Load index from disk"""
        try:
            index_path = self.index_dir / "index.faiss"
            docs_path = self.index_dir / "documents.pkl"
            meta_path = self.index_dir / "metadata.pkl"
            
            if not all(p.exists() for p in [index_path, docs_path, meta_path]):
                return False
            
            # Load FAISS index
            self.index = faiss.read_index(str(index_path))
            
            # Load documents
            with open(docs_path, "rb") as f:
                self.documents = pickle.load(f)
            
            # Load metadata
            with open(meta_path, "rb") as f:
                self.metadata = pickle.load(f)
            
            logger.info(f"Index loaded with {len(self.documents)} documents")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load index: {e}")
            return False
    
    def is_loaded(self) -> bool:
        """Check if index is loaded"""
        return self.index is not None and len(self.documents) > 0
    
    def get_stats(self) -> Dict:
        """Get index statistics"""
        if not self.is_loaded():
            return {
                "doc_count": 0,
                "index_size_mb": 0,
                "last_updated": None
            }
        
        return {
            "doc_count": len(self.documents),
            "index_size_mb": self.get_index_size_mb(),
            "last_updated": self.metadata.get("last_updated")
        }
    
    def get_index_size_mb(self) -> float:
        """Get total size of index files in MB"""
        total_size = 0
        for file in self.index_dir.glob("*"):
            if file.is_file():
                total_size += file.stat().st_size
        return total_size / (1024 * 1024)