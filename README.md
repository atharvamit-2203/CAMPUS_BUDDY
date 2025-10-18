# 🎓 Campus Buddy - Complete Campus Management Solution

<div align="center">

![Campus Buddy Logo](frontend/public/CampusBuddyLogo.png)

**A comprehensive platform connecting students, faculty, and campus organizations**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**Campus Buddy** is an all-in-one campus management platform designed to streamline campus life for students, faculty, and organizations. It provides role-based dashboards, AI-powered recommendations, real-time notifications, and comprehensive tools for managing academic and extracurricular activities.

### 🎯 Key Objectives

- **Student Engagement**: Connect students with clubs, events, and peers
- **Faculty Efficiency**: Simplify class management, room booking, and student tracking
- **Organization Management**: Streamline event planning, recruitment, and team coordination
- **AI Integration**: Smart recommendations and automated scheduling
- **Campus Navigation**: Interactive maps and real-time location services

---

## ✨ Features

### 👨‍🎓 Student Features

- **📅 Personalized Timetable**: View and manage class schedules
- **🎪 Club Discovery**: AI-powered club recommendations based on interests
- **📢 Event Management**: Browse, register, and track campus events
- **🍽️ Canteen Services**: Pre-order food and view menus
- **🗺️ Campus Navigation**: Interactive campus maps with real-time directions
- **🤝 Networking**: Connect with peers based on shared interests and skills
- **📚 Resource Access**: Digital library and academic resources
- **🔔 Smart Notifications**: Real-time updates on events, classes, and activities

### 👩‍🏫 Faculty Features

- **📊 Class Management**: Track attendance and academic progress
- **🏢 Room Booking**: Reserve classrooms and facilities
- **👥 Student Monitoring**: View student performance and engagement
- **📋 Timetable Management**: Create and manage course schedules
- **💬 Messaging**: Direct communication with students
- **📈 Analytics Dashboard**: Insights on class performance

### 🏛️ Organization Features

- **📅 Event Planning**: Create and manage organization events
- **👥 Team Management**: Recruit and organize team members
- **📊 Analytics**: Track engagement and event attendance
- **🗓️ Meeting Scheduler**: AI-powered meeting coordination
- **📢 Announcements**: Broadcast updates to members

### 🤖 AI Features

- **Club Recommendations**: ML-based suggestions based on student interests
- **Smart Scheduling**: Automated event and meeting scheduling
- **Chatbot Assistant**: 24/7 AI-powered campus support
- **Predictive Analytics**: Insights on student engagement patterns

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Animations**: Lottie, Framer Motion
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Supabase)
- **ORM**: SQLAlchemy
- **Authentication**: JWT Tokens
- **AI/ML**: Google Gemini API
- **Validation**: Pydantic

### DevOps & Tools
- **Containerization**: Docker, Docker Compose
- **Version Control**: Git (GitHub/GitLab)
- **API Testing**: Postman
- **Deployment**: Render, Vercel

---

## 📁 Project Structure

```
CAMPUS_BUDDY/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration settings
│   ├── database.py            # Database connection
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── auth.py                # Authentication logic
│   ├── student.py             # Student endpoints
│   ├── faculty.py             # Faculty endpoints
│   ├── organization.py        # Organization endpoints
│   ├── club.py                # Club management
│   ├── event.py               # Event management
│   ├── ai_service.py          # AI integration
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend Docker config
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   │   ├── dashboard/     # Role-based dashboards
│   │   │   ├── login/         # Authentication pages
│   │   │   └── api/           # API routes
│   │   ├── components/        # Reusable React components
│   │   ├── services/          # API service layer
│   │   ├── contexts/          # React contexts
│   │   ├── types/             # TypeScript type definitions
│   │   └── config/            # Configuration
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── Dockerfile             # Frontend Docker config
│
├── docker-compose.yml         # Multi-container orchestration
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** (or Supabase account)
- **Docker** (optional, for containerized deployment)
- **Git**

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/campus_buddy
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
```

#### Frontend `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 💻 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/atharvamit-2203/CAMPUS_BUDDY.git
cd CAMPUS_BUDDY
```

### 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up database (if using local PostgreSQL)
# Run the SQL scripts in order:
# 01_enums_and_types.sql
# 02_core_tables.sql
# ... (follow numbered sequence)
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# or using yarn
yarn install
```

---

## ⚙️ Configuration

### Database Setup

1. **Using Supabase** (Recommended):
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL scripts from `backend/` in the Supabase SQL Editor
   - Copy your project URL and anon key to `.env`

2. **Using Local PostgreSQL**:
   - Install PostgreSQL
   - Create a database: `createdb campus_buddy`
   - Run migration scripts in order
   - Update `DATABASE_URL` in backend `.env`

### AI Configuration

- Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to backend `.env` as `GEMINI_API_KEY`

---

## 🏃 Running the Application

### Option 1: Manual Start

#### Start Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

#### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will run at: `http://localhost:3000`

### Option 2: Using Docker Compose

```bash
# From project root
docker-compose up --build
```

This will start:
- Backend at `http://localhost:8000`
- Frontend at `http://localhost:3000`

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/profile` | Get student profile |
| GET | `/api/student/timetable` | Get student timetable |
| GET | `/api/student/clubs` | Get available clubs |
| POST | `/api/student/clubs/join` | Join a club |
| GET | `/api/student/events` | Get upcoming events |

### Faculty Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faculty/classes` | Get assigned classes |
| POST | `/api/faculty/attendance` | Mark attendance |
| GET | `/api/faculty/students` | Get student list |
| POST | `/api/faculty/booking` | Book a room |

### Organization Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organization/events` | Create event |
| GET | `/api/organization/members` | Get members |
| POST | `/api/organization/announce` | Send announcement |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommend-clubs` | Get club recommendations |
| POST | `/api/ai/chat` | Chat with AI assistant |
| POST | `/api/ai/schedule` | AI-powered scheduling |

**Full API Documentation**: Visit `http://localhost:8000/docs` when backend is running

---

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from backend `.env`

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. From frontend directory: `vercel`
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard

### Docker Deployment

```bash
# Build and push to Docker Hub
docker build -t username/campus-buddy-backend ./backend
docker build -t username/campus-buddy-frontend ./frontend

docker push username/campus-buddy-backend
docker push username/campus-buddy-frontend

# Deploy using docker-compose on server
docker-compose -f docker-compose.yml up -d
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Frontend**: Follow ESLint rules, use TypeScript
- **Backend**: Follow PEP 8, use type hints
- **Commits**: Use conventional commit messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Developed with ❤️ for MPSTME Hackathon

- **GitHub**: [@atharvamit-2203](https://github.com/atharvamit-2203)
- **Repository**: [CAMPUS_BUDDY](https://github.com/atharvamit-2203/CAMPUS_BUDDY)

---

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

## 🙏 Acknowledgments

- MPSTME for organizing the hackathon
- Google Gemini for AI capabilities
- Supabase for database hosting
- All open-source contributors

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by the Campus Buddy Team

</div>
