# syntax=docker/dockerfile:1

# Multi-stage not strictly needed, but we keep it simple and small
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Workdir for the backend app
WORKDIR /app

# System dependencies (mysql client libs for mysql-connector and potential bcrypt builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend and install
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy the backend app code
COPY backend/ /app/

# Expose the API port (Railway uses $PORT)
EXPOSE 8000

# Default env (override in Railway)
ENV PORT=8000

# Start FastAPI with uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
