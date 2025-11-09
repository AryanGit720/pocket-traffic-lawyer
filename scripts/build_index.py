#!/usr/bin/env python3
"""Script to build FAISS index from dataset"""
import argparse
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import pandas as pd
from app.core.embed import EmbeddingModel
from app.core.indexer import IndexManager
from app.config import settings

def main():
    parser = argparse.ArgumentParser(description="Build FAISS index from dataset")
    parser.add_argument(
        "--dataset",
        type=str,
        default="backend/app/data/dataset_samples/traffic_law_sample.csv",
        help="Path to dataset CSV/JSON file"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=512,
        help="Text chunk size"
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Force rebuild even if index exists"
    )
    
    args = parser.parse_args()
    
    # Load dataset
    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"Error: Dataset file not found: {dataset_path}")
        sys.exit(1)
    
    print(f"Loading dataset from {dataset_path}")
    if dataset_path.suffix == '.csv':
        df = pd.read_csv(dataset_path)
    elif dataset_path.suffix == '.json':
        df = pd.read_json(dataset_path)
    else:
        print("Error: Unsupported file format. Use CSV or JSON.")
        sys.exit(1)
    
    # Validate schema
    required_columns = {'id', 'question', 'answer', 'source', 'category'}
    if not required_columns.issubset(df.columns):
        print(f"Error: Dataset must contain columns: {required_columns}")
        sys.exit(1)
    
    print(f"Dataset loaded: {len(df)} documents")
    
    # Initialize models
    print("Loading embedding model...")
    embedding_model = EmbeddingModel(settings.MODEL_NAME_EMBED)
    
    # Build index
    print("Building FAISS index...")
    index_manager = IndexManager(
        embedding_model=embedding_model,
        index_dir=Path("backend") / settings.FAISS_DIR
    )
    
    doc_count = index_manager.build_index(
        df,
        chunk_size=args.chunk_size,
        rebuild=args.rebuild
    )
    
    print(f"Index built successfully with {doc_count} chunks")
    print(f"Index saved to {settings.FAISS_DIR}")

if __name__ == "__main__":
    main()