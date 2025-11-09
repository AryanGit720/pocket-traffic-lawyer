# Pocket Traffic Lawyer Backend

FastAPI backend for the Pocket Traffic Lawyer application.

## Setup

1. Create virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```
## Install dependencies:
```bash
pip install -e .
```
## Configure environment:

```bash
cp .env.example .env
# Edit .env with your settings
```
## Build initial index:

```bash
python ../scripts/build_index.py --dataset app/data/dataset_samples/traffic_law_sample.csv
```

## Run server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints
* POST /api/chat - Main chat endpoint
* POST /api/stt - Speech to text
* POST /api/tts - Text to speech
* POST /api/admin/index - Rebuild index
* GET /api/admin/stats - Get index statistics