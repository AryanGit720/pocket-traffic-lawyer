"""Admin endpoints for index management"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pathlib import Path
import logging
import pandas as pd
import json
import tempfile
from typing import Optional

from app.schemas import IndexRequest, IndexResponse, StatsResponse
from app.deps import get_index_manager
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/index", response_model=IndexResponse)
async def build_index(
    index_manager = Depends(get_index_manager),
    dataset_file: Optional[UploadFile] = File(None),
    chunk_size: int = Form(512),
    rebuild: bool = Form(True)
) -> IndexResponse:
    """Build or rebuild the FAISS index"""
    try:
        # Determine dataset path
        if dataset_file:
            # Save uploaded file
            suffix = Path(dataset_file.filename).suffix
            if suffix not in ['.csv', '.json']:
                raise ValueError("Unsupported file format. Use CSV or JSON.")
                
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                content = await dataset_file.read()
                tmp.write(content)
                dataset_path = tmp.name
                
            logger.info(f"Processing uploaded file: {dataset_file.filename} ({len(content)} bytes)")
        else:
            dataset_path = "app/data/dataset_samples/traffic_law_sample.csv"
            logger.info(f"Using default dataset: {dataset_path}")
        
        # Load dataset
        if dataset_path.endswith('.csv'):
            df = pd.read_csv(dataset_path, encoding='utf-8')
        elif dataset_path.endswith('.json'):
            df = pd.read_json(dataset_path)
        else:
            raise ValueError("Unsupported file format. Use CSV or JSON.")
        
        logger.info(f"Loaded dataset with {len(df)} rows and columns: {list(df.columns)}")
        
        # Validate schema
        required_columns = {'id', 'question', 'answer', 'source', 'category'}
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise ValueError(f"Dataset is missing required columns: {missing_columns}. Found columns: {list(df.columns)}")
        
        # Build index
        doc_count = index_manager.build_index(
            df,
            chunk_size=chunk_size,
            rebuild=rebuild
        )
        
        # Get index size
        index_size_mb = index_manager.get_index_size_mb()
        
        # Clean up temp file if it was created
        if dataset_file and 'tmp' in locals():
            try:
                Path(dataset_path).unlink()
            except:
                pass
        
        logger.info(f"Index built successfully with {doc_count} documents")
        
        return IndexResponse(
            success=True,
            message=f"Index built successfully with {doc_count} documents from {len(df)} original records",
            doc_count=doc_count,
            index_size_mb=index_size_mb
        )
        
    except Exception as e:
        logger.error(f"Index building error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=StatsResponse)
async def get_stats(index_manager = Depends(get_index_manager)) -> StatsResponse:
    """Get index statistics"""
    try:
        stats = index_manager.get_stats()
        return StatsResponse(
            doc_count=stats["doc_count"],
            index_size_mb=stats["index_size_mb"],
            last_updated=stats["last_updated"],
            embedding_model=settings.MODEL_NAME_EMBED,
            top_k=settings.TOP_K
        )
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))