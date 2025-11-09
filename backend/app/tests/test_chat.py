"""Tests for chat functionality"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.main import app
from app.schemas import ChatResponse, Source

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_index_manager():
    manager = Mock()
    manager.is_loaded.return_value = True
    manager.search.return_value = [
        ({
            'id': '1',
            'question': 'What is the fine for not wearing helmet?',
            'answer': 'The fine is Rs. 1000',
            'source': 'Motor Vehicles Act Section 129',
            'category': 'Safety',
            'chunk': 'The fine is Rs. 1000 for not wearing helmet'
        }, 0.95)
    ]
    return manager

@pytest.fixture
def mock_generator():
    generator = Mock()
    generator.generate.return_value = "The fine for not wearing a helmet is Rs. 1000 according to Section 129 of the Motor Vehicles Act."
    return generator

@pytest.mark.asyncio
async def test_chat_endpoint_success(client, mock_index_manager, mock_generator):
    """Test successful chat query"""
    with patch('app.routers.chat.get_index_manager', return_value=mock_index_manager):
        with patch('app.routers.chat.get_generator_model', return_value=mock_generator):
            response = client.post(
                "/api/chat",
                json={"query": "What is the fine for not wearing helmet?"}
            )
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert "latency_ms" in data
    assert "confidence" in data
    assert len(data["sources"]) > 0

@pytest.mark.asyncio
async def test_chat_endpoint_no_index(client):
    """Test chat when index is not loaded"""
    mock_manager = Mock()
    mock_manager.is_loaded.return_value = False
    
    with patch('app.routers.chat.get_index_manager', return_value=mock_manager):
        response = client.post(
            "/api/chat",
            json={"query": "What is the fine for not wearing helmet?"}
        )
    
    assert response.status_code == 503
    assert "Index not loaded" in response.json()["detail"]

@pytest.mark.asyncio
async def test_chat_endpoint_invalid_query(client):
    """Test chat with empty query"""
    response = client.post(
        "/api/chat",
        json={"query": ""}
    )
    
    assert response.status_code == 422  # Validation error