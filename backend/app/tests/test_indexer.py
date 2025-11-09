"""Tests for indexer functionality"""
import pytest
import pandas as pd
import tempfile
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.embed import EmbeddingModel
from app.core.indexer import IndexManager

@pytest.fixture
def sample_df():
    """Create sample dataframe"""
    return pd.DataFrame({
        'id': ['1', '2', '3'],
        'question': [
            'What is the fine for not wearing helmet?',
            'What documents are required while driving?',
            'What is the speed limit in city?'
        ],
        'answer': [
            'The fine is Rs. 1000',
            'License, RC, Insurance, PUC',
            '30-40 km/h in city areas'
        ],
        'source': [
            'MVA Section 129',
            'MVA Section 130',
            'CMVR Rule 112'
        ],
        'category': ['Safety', 'Documentation', 'Speed']
    })

@pytest.fixture
def embedding_model():
    """Create embedding model"""
    return EmbeddingModel("sentence-transformers/all-MiniLM-L6-v2")

@pytest.fixture
def temp_index_dir():
    """Create temporary directory for index"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)

def test_build_index(sample_df, embedding_model, temp_index_dir):
    """Test building FAISS index"""
    manager = IndexManager(embedding_model, temp_index_dir)
    
    # Build index
    doc_count = manager.build_index(sample_df, chunk_size=512)
    
    assert doc_count == 3
    assert manager.is_loaded()
    assert len(manager.documents) == 3

def test_search_index(sample_df, embedding_model, temp_index_dir):
    """Test searching the index"""
    manager = IndexManager(embedding_model, temp_index_dir)
    manager.build_index(sample_df)
    
    # Search
    results = manager.search("helmet fine", top_k=2)
    
    assert len(results) > 0
    assert results[0][1] > 0  # Score should be positive
    assert 'helmet' in results[0][0]['question'].lower()

def test_save_load_index(sample_df, embedding_model, temp_index_dir):
    """Test saving and loading index"""
    # Build and save
    manager1 = IndexManager(embedding_model, temp_index_dir)
    manager1.build_index(sample_df)
    
    # Load in new instance
    manager2 = IndexManager(embedding_model, temp_index_dir)
    loaded = manager2.load_index()
    
    assert loaded
    assert manager2.is_loaded()
    assert len(manager2.documents) == len(manager1.documents)