@echo off
cd /d "D:\MPSTME_HACKATHON\backend"
echo Starting Campus Connect API with MySQL...
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
