# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y build-essential default-libmysqlclient-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Expose API port
EXPOSE 8000

# Environment defaults (override in compose/.env)
ENV PYTHONUNBUFFERED=1 \
    MYSQL_HOST=database \
    MYSQL_PORT=3306 \
    MYSQL_USER=root \
    MYSQL_PASSWORD=changeme \
    MYSQL_DATABASE=campus_connect \
    SECRET_KEY=please-change-me

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
