# Campus Connect Backend API

FastAPI backend for Campus Connect - An inter-college networking and collaboration platform.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Supabase account and database
- PostgreSQL database (via Supabase)

### 1. Setup Environment

**Windows:**
```bash
# Run the automated setup script
start_server.bat
```

**Manual Setup:**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Database

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_KEY=[YOUR-ANON-KEY]
SECRET_KEY=your-super-secret-jwt-key-here
```

### 3. Setup Database Schema

Run the SQL files in order in your Supabase SQL Editor:
1. `01_enums_and_types.sql`
2. `02_core_tables.sql`
3. `03_feature_tables.sql`
4. `04_faculty_messaging.sql`
5. `05_triggers_functions.sql`
6. `06_views.sql`
7. `07_college_data.sql`
8. `08a_student_data_part1.sql`
9. `08b_student_data_part2.sql`
10. `09_faculty_organization_data.sql`
11. `10_sample_data.sql`

### 4. Start the Server

```bash
uvicorn main:app --reload
```

## 📚 API Documentation

Once the server is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🔑 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "student123",
  "email": "student@college.edu",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "student",
  "college_id": 1,
  "student_id": "CS2025001",
  "course": "Computer Science",
  "department": "Computer Science",
  "semester": "Sixth"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@college.edu",
  "password": "securepassword"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

## 🏫 Other Endpoints

### Get Colleges
```http
GET /colleges
```

## 🧪 Testing

Run the test script to verify everything is working:
```bash
python test_api.py
```

This will test:
- ✅ API health check
- ✅ Get colleges
- ✅ User registration
- ✅ User login
- ✅ Get user info

## 📁 Project Structure

```
backend/
├── main.py                     # FastAPI application entry point
├── config.py                   # Configuration settings
├── database.py                 # Database connection setup
├── models.py                   # SQLAlchemy models
├── schemas.py                  # Pydantic schemas
├── auth.py                     # Authentication utilities
├── test_api.py                 # API testing script
├── start_server.bat           # Windows startup script
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── SQL Files/                # Database schema parts
    ├── 01_enums_and_types.sql
    ├── 02_core_tables.sql
    ├── ...
    └── 10_sample_data.sql
```

## 🔧 Key Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Support for students, faculty, and organizations
- **Supabase Integration** - PostgreSQL database with real-time features
- **CORS Enabled** - Ready for frontend integration
- **Auto Documentation** - Interactive API docs with FastAPI
- **Type Safety** - Full type hints with Pydantic schemas

## 🌐 Database Schema

The database supports:
- **Multi-college System** - 10 engineering colleges
- **User Management** - Students, faculty, organizations
- **Club System** - Join requests, memberships, activities
- **Event Management** - College events with RSVP
- **Faculty Announcements** - With student interest tracking
- **Messaging System** - Inter-user communication
- **Networking Features** - User connections and recommendations

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based permissions
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy

## 🚨 Troubleshooting

### Common Issues:

1. **Import errors**: Make sure virtual environment is activated
2. **Database connection errors**: Check your .env file credentials
3. **Port already in use**: Change port in start command: `--port 8001`

### Getting Supabase Credentials:

1. Go to your Supabase project dashboard
2. Go to Settings → Database
3. Copy the connection string and update DATABASE_URL
4. Go to Settings → API
5. Copy the URL and anon key

## 📞 Support

For issues or questions:
1. Check the interactive API docs at `/docs`
2. Run the test script to identify issues
3. Verify your .env configuration
