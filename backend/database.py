import mysql.connector
from mysql.connector import Error
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
from config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLAlchemy setup
Base = declarative_base()

# Create MySQL engine
def create_mysql_engine():
    try:
        # Log sanitized config for diagnostics (no password)
        logger.info(
            "MySQL config => host=%s port=%s user=%s db=%s",
            settings.MYSQL_HOST,
            settings.MYSQL_PORT,
            settings.MYSQL_USER,
            settings.MYSQL_DATABASE,
        )
        mysql_url = f"mysql+mysqlconnector://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"
        engine = create_engine(
            mysql_url,
            echo=settings.MYSQL_ECHO,
            pool_size=settings.MYSQL_POOL_SIZE,
            max_overflow=settings.MYSQL_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        logger.info("✅ MySQL engine created successfully")
        return engine
    except Exception as e:
        logger.error(f"❌ Failed to create MySQL engine: {str(e)}")
        raise

# Create engine instance
engine = create_mysql_engine()

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Direct MySQL connection for raw queries
def get_mysql_connection():
    """Get direct MySQL connection for raw SQL queries"""
    try:
        logger.info(
            "Connecting to MySQL host=%s port=%s user=%s db=%s",
            settings.MYSQL_HOST,
            settings.MYSQL_PORT,
            settings.MYSQL_USER,
            settings.MYSQL_DATABASE,
        )
        connection = mysql.connector.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE,
            autocommit=True,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        logger.info("✅ Direct MySQL connection established")
        return connection
    except Error as e:
        logger.error(
            "❌ MySQL connection error: %s (host=%s port=%s user=%s db=%s)",
            str(e),
            settings.MYSQL_HOST,
            settings.MYSQL_PORT,
            settings.MYSQL_USER,
            settings.MYSQL_DATABASE,
        )
        raise

# SQLAlchemy session dependency
def get_db():
    """Dependency to get SQLAlchemy database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Context manager for database sessions
@contextmanager
def get_db_session():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Direct connection for AI service and complex queries
def get_db_connection():
    """Get database connection for AI service and complex operations"""
    return get_mysql_connection()

# Test database connection
def test_connection():
    """Test MySQL database connection"""
    try:
        with get_mysql_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            logger.info(f"✅ Database connection test successful: {result}")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {str(e)}")
        return False

# Initialize database tables
def init_db():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database tables: {str(e)}")
        raise

# Legacy function name for backward compatibility
def get_supabase():
    """Legacy function - now returns MySQL connection"""
    logger.warning("⚠️  get_supabase() is deprecated, use get_db() or get_mysql_connection() instead")
    return get_mysql_connection()
