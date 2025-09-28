import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Runtime configuration with smart env detection for Railway and others."""

    def __init__(self):
        # Defaults
        mysql_host = os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST") or "localhost"
        mysql_port = os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT") or "3306"
        mysql_user = os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER") or "root"
        mysql_pass = os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQLPASSWORD") or ""
        mysql_db = os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE") or "campus_connect"

        # Parse DATABASE_URL style connection strings if present
        db_url = (
            os.getenv("DATABASE_URL")
            or os.getenv("CLEARDB_DATABASE_URL")
            or os.getenv("JAWSDB_URL")
            or os.getenv("JAWSDB_MARIA_URL")
            or os.getenv("MYSQL_URL")
        )
        if db_url and db_url.startswith("mysql"):
            try:
                u = urlparse(db_url)
                if u.hostname:
                    mysql_host = u.hostname
                if u.port:
                    mysql_port = str(u.port)
                if u.username:
                    mysql_user = u.username
                if u.password:
                    mysql_pass = u.password
                if u.path and len(u.path) > 1:
                    mysql_db = u.path.lstrip("/")
            except Exception:
                # Ignore parsing errors and keep existing values
                pass

        # Assign
        self.MYSQL_HOST = mysql_host
        self.MYSQL_PORT = int(mysql_port)
        self.MYSQL_USER = mysql_user
        self.MYSQL_PASSWORD = mysql_pass
        self.MYSQL_DATABASE = mysql_db

        # MySQL Connection Pool Settings
        self.MYSQL_POOL_SIZE = int(os.getenv("MYSQL_POOL_SIZE", "10"))
        self.MYSQL_MAX_OVERFLOW = int(os.getenv("MYSQL_MAX_OVERFLOW", "20"))
        self.MYSQL_ECHO = os.getenv("MYSQL_ECHO", "False").lower() == "true"

        # Legacy Supabase Configuration (for backward compatibility)
        self.SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

        # JWT Configuration
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        # CORS Settings
        self.ALLOWED_ORIGINS = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            os.getenv("PUBLIC_FRONTEND_ORIGIN", "https://your-frontend-domain.com"),
        ]

settings = Settings()
