# ===== Backend Dockerfile (Optimized for Railway) =====
FROM python:3.11-slim

# Prevent writing .pyc files, force unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ---- Install minimal system packages ----
# (Includes ffmpeg for audio, curl for health checks, build tools for faiss)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    curl \
 && rm -rf /var/lib/apt/lists/*

# ---- Set working directory ----
WORKDIR /app

# ---- Copy requirements first (for better Docker caching) ----
COPY requirements.txt .

# ---- Install Python deps ----
RUN pip install --upgrade pip setuptools wheel && pip install -r requirements.txt

# ---- Copy app source ----
COPY app ./app

# ---- Create runtime directories ----
RUN mkdir -p app/data/index logs /models_cache

# ---- Environment setup ----
ENV PORT=8000
EXPOSE 8000

# ---- Run server ----
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
