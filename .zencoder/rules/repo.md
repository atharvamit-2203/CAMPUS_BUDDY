---
description: Repository Information Overview
alwaysApply: true
---

# Campus Buddy Information

## Summary
Campus Buddy is a comprehensive campus solutions platform developed for the MPSTME Hackathon. It consists of a Next.js frontend and a FastAPI backend with MySQL database integration. The application provides features for student management, faculty dashboards, organization management, event scheduling, and various campus services.

## Structure
- **backend/**: FastAPI application with MySQL integration, AI features, and authentication
- **frontend/**: Next.js application with TypeScript and Tailwind CSS
- **file_zip/**: Additional frontend components and assets
- **docker-compose.yml**: Docker configuration for the entire application stack

## Language & Runtime
**Backend**:
- **Language**: Python 3.11
- **Framework**: FastAPI 0.104.1
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy 2.0.23

**Frontend**:
- **Language**: TypeScript 5
- **Framework**: Next.js 15.5.2
- **React**: 19.1.0
- **CSS**: Tailwind CSS 4

## Dependencies

### Backend Dependencies
**Main Dependencies**:
- FastAPI, Uvicorn for API server
- MySQL Connector, SQLAlchemy for database operations
- Python-jose, Passlib, Bcrypt for authentication
- Pandas, NumPy, Scikit-learn for AI/ML features
- Pillow, Pytesseract for image processing

**Development Dependencies**:
- Various testing utilities

### Frontend Dependencies
**Main Dependencies**:
- Next.js for React framework
- React and React DOM
- Lucide React for icons
- Lottie React for animations

**Development Dependencies**:
- TypeScript
- ESLint
- Tailwind CSS

## Build & Installation

### Backend Setup
```bash
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Run the server
cd backend
uvicorn main:app --reload
```

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

## Docker
**Docker Compose**: Full stack deployment with database, backend, and frontend
```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build
```

**Backend Dockerfile**: Python 3.11 slim image with MySQL client
**Frontend Dockerfile**: Multi-stage build with Node.js 20 Alpine

## Testing
**Backend Testing**:
- Various test files in backend/ directory (test_*.py)
- Manual API testing with test_api.py
- Database connection tests with test_db_connection.py

**Frontend Testing**:
- No formal testing framework configured