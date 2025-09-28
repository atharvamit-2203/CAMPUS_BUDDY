# Campus Connect – Deployment Guide (Docker + local)

This guide gives you a complete, production‑ready way to run the project using Docker Compose, plus local run instructions for Windows.

Key URLs (default ports)
- Backend API: http://localhost:8000
- Frontend Web: http://localhost:3000
- MySQL: localhost:3306

Repository layout
- backend/ … FastAPI + MySQL backend
- frontend/ … Next.js frontend (app router)
- docker-compose.yml … Orchestrates DB + backend + frontend
- .env.example … Common environment template

Quick start (Docker)
1) Copy environment file
   cp .env.example .env
   # edit values as needed (passwords, secrets, domains)

2) Start services
   docker compose up --build

3) First run DB bootstrap
   The MySQL container automatically loads the initial schema from backend/campus_connect_mysql_complete.sql. If you need to apply additional migrations, place .sql files in db/init/ and re‑create the db container.

4) Open the app
   - Frontend: http://localhost:3000
   - API docs (FastAPI): http://localhost:8000/docs

Local run (Windows PowerShell)
1) MySQL
   - Install MySQL 8
   - Create database campus_connect
   - Import backend/campus_connect_mysql_complete.sql

2) Backend
   - cd backend
   - python -m venv venv
   - venv\Scripts\Activate.ps1
   - pip install -r requirements.txt
   - copy .env.example ..\..\.env (or set env vars)
   - setx MYSQL_HOST "127.0.0.1" (or put in .env)
   - uvicorn main:app --host 0.0.0.0 --port 8000

3) Frontend
   - cd frontend
   - npm install
   - setx NEXT_PUBLIC_API_URL "http://localhost:8000"
   - npm run dev

Environment variables
Backend (in .env)
- MYSQL_HOST=database (or 127.0.0.1 for local)
- MYSQL_PORT=3306
- MYSQL_ROOT_PASSWORD=changeme_root
- MYSQL_USER=app_user
- MYSQL_PASSWORD=changeme_app
- MYSQL_DATABASE=campus_connect
- SECRET_KEY=replace-with-strong-secret
- ACCESS_TOKEN_EXPIRE_MINUTES=60
- MYSQL_POOL_SIZE=10
- MYSQL_MAX_OVERFLOW=20
- MYSQL_ECHO=False

Frontend (in .env or .env.local under frontend/)
- NEXT_PUBLIC_API_URL=http://backend:8000 (Docker) or http://localhost:8000 (local)

Production notes
- Replace allow_origins in backend CORS with your real domain(s).
- Use a managed MySQL and externalize storage if needed.
- Configure TLS/HTTPS via a reverse proxy (e.g., Nginx, Traefik) in front of frontend and backend.
- Add a Stripe or Razorpay account and keys if you decide to switch from the built‑in simple payment flow to a real gateway.
- Enable logging/monitoring (e.g., Promtail + Loki, Sentry) and backup for MySQL.

Data seeding and roles
- Run backend/scripts/provision_all_org_users.py to auto‑generate org users using organization_details.
- Use Admin > Admins tab (UI) to assign sub‑admins. For now, it’s a UI shell; to persist, implement /admin/roles + /admin/roles/{id}/users as per the plan.

Canteen E2E
- Student: choose items, Pay Now -> redirected to payment page -> order created -> QR auto‑downloaded.
- Staff (temporary): call POST /canteen/orders/{id}/status to move queued -> preparing -> ready.
- Pickup: POST /canteen/scan with qr_token to verify and mark served.

Room bookings
- Faculty: Available rooms -> GET /rooms?booking_date&start_time&end_time
- Create booking -> POST /rooms/book
- Shared upcoming bookings -> GET /rooms/bookings?upcoming_only=1
- Cancel -> POST /rooms/bookings/{id}/cancel

Recruitment UI
- Swipe deck: GET /organizations/mine/members?status=pending,shortlisted
- Actions: POST /organizations/members/{user_id}/status
- Details: GET /users/{user_id}/details

Troubleshooting
- If the backend can’t connect to MySQL: verify .env MYSQL_* values and that the DB is reachable from the backend container/network.
- If the frontend can’t reach the API: ensure NEXT_PUBLIC_API_URL is correct for your environment (Docker vs local).
- If the DB schema mismatches: reimport backend/campus_connect_mysql_complete.sql or run the relevant SQL files in backend/.

