@echo off
echo Starting Campus Connect Backend API...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo ⚠️  WARNING: .env file not found!
    echo Please copy .env.example to .env and fill in your Supabase credentials:
    echo.
    echo 1. DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    echo 2. SUPABASE_URL=https://[PROJECT-REF].supabase.co
    echo 3. SUPABASE_KEY=[YOUR-ANON-KEY]
    echo 4. SECRET_KEY=[RANDOM-SECRET-KEY]
    echo.
    pause
    exit /b 1
)

REM Start the server
echo.
echo 🚀 Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
