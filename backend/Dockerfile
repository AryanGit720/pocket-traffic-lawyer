# ===== Backend Dockerfile =====
# Use a lightweight Python image
FROM python:3.11-slim

# Prevents Python from writing .pyc files and ensures logs are shown in real-time
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ---- System dependencies ----
# ffmpeg (for Speech-to-Text), curl (for downloads), build tools for compiling any deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    curl \
 && rm -rf /var/lib/apt/lists/*

# ---- Set working directory ----
WORKDIR /app

# ---- Copy project files ----
COPY pyproject.toml .
COPY app ./app

# ---- Install Python dependencies ----
RUN pip install --upgrade pip && pip install -e .

# ---- Create directories for runtime data ----
# These can be mounted as volumes on Railway or Docker Compose
RUN mkdir -p app/data/index logs /models_cache

# ---- Environment and port configuration ----
ENV PORT=8000
EXPOSE 8000

# ---- Run the backend server ----
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
