"""
Campus Connect API - FastAPI with MySQL
Main application file with MySQL database integration
"""

import os
import sys
from datetime import timedelta, datetime, time
from typing import Optional, List
import traceback

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import mysql.connector
from mysql.connector import Error

# Local imports
import schemas
import auth
from database import get_db, get_mysql_connection
from config import settings
from ai_scheduler import ai_scheduler

# Import additional endpoints
from additional_endpoints import (
    get_student_timetable, get_faculty_timetable, update_timetable_entry,
    get_student_skills, add_student_skill, add_certification,
    get_learning_resources, upload_resource, download_resource,
    get_notices, create_notice, mark_notice_read, get_notice_stats
)

# Import advanced features
from advanced_features import (
    create_lost_found_item, get_lost_found_items, mark_item_resolved,
    get_events_by_interests, rsvp_to_event, update_user_interests,
    get_available_resources, get_user_bookings,
    register_notification_token, send_bulk_notification
)

# Initialize FastAPI app
app = FastAPI(
    title="Campus Connect API",
    description="Campus networking and collaboration platform with MySQL backend",
    version="2.0.0"
)

# Simple health endpoint to verify service and DB connectivity
@app.get("/health")
async def health():
    from database import test_connection
    db_ok = False
    try:
        db_ok = test_connection()
    except Exception:
        db_ok = False
    return {"status": "ok", "db": db_ok}

# Include AI routers (if available)
try:
    from ai_endpoints import ai_router as advanced_ai_router
    app.include_router(advanced_ai_router)
except Exception:
    pass

try:
    from ai_api import router as basic_ai_router
    app.include_router(basic_ai_router)
except Exception:
    pass

# Gemini AI router
try:
    from ai_gemini import router as gemini_router
    app.include_router(gemini_router)
except Exception:
    pass

# Communications (club notifications) and room booking router
try:
    from club_notifications_and_rooms import router as comms_router
    app.include_router(comms_router)
except Exception:
    # This router is optional; continue even if import fails
    pass

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Helpers

def _as_pytime(v):
    """Convert MySQL TIME (which may come as timedelta) to datetime.time."""
    if isinstance(v, timedelta):
        total_seconds = int(v.total_seconds())
        h = (total_seconds // 3600) % 24
        m = (total_seconds % 3600) // 60
        s = total_seconds % 60
        return time(hour=h, minute=m, second=s)
    return v

# Simple helper for notifications

def _ensure_notification_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          club_id INT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'system',
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          target_role VARCHAR(20) NULL,
          created_by INT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notification_recipients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          notification_id INT NOT NULL,
          user_id INT NOT NULL,
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          read_at DATETIME NULL,
          UNIQUE KEY uq_notification_user (notification_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

def _create_notification(cursor, title: str, message: str, category: str, target_role: str, created_by: int, priority: str = "medium") -> int:
    _ensure_notification_tables(cursor)
    cursor.execute(
        """
        INSERT INTO notifications (title, message, category, priority, target_role, created_by, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """,
        (title, message, category, priority, target_role, created_by)
    )
    return cursor.lastrowid

def _notify_user(cursor, user_id: int, title: str, message: str, category: str = 'system', created_by: int = 0):
    nid = _create_notification(cursor, title, message, category, target_role='', created_by=created_by)
    cursor.execute("INSERT IGNORE INTO notification_recipients (notification_id, user_id) VALUES (%s, %s)", (nid, user_id))

# Ensure org membership table exists
def _ensure_org_memberships(cursor):
    # Base table (minimal) so it can be created even if older versions exist
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS organization_memberships (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NOT NULL,
          user_id INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    # Try to add optional columns/indexes if they don't exist
    try:
        cursor.execute("ALTER TABLE organization_memberships ADD COLUMN status VARCHAR(20) DEFAULT 'member'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE organization_memberships ADD COLUMN joined_at DATETIME DEFAULT CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("CREATE INDEX idx_org_id ON organization_memberships (organization_id)")
    except Exception:
        pass
    try:
        cursor.execute("CREATE INDEX idx_user_id ON organization_memberships (user_id)")
    except Exception:
        pass

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/auth/register", response_model=schemas.Token)
async def register_user(user: schemas.UserRegister, db = Depends(get_db)):
    """Register a new user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (user.email, user.username)
        )
        existing_user = cursor.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Hash password
        hashed_password = auth.get_password_hash(user.password)
        
        # Insert new user
        insert_query = """
            INSERT INTO users (
                username, email, password_hash, full_name, role, college_id,
                student_id, course, branch, semester, academic_year, batch,
                employee_id, designation, specialization, organization_type,
                department, bio, phone_number, is_active, is_verified
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        cursor.execute(insert_query, (
            user.username, user.email, hashed_password, user.full_name,
            user.role, user.college_id, user.student_id, user.course,
            user.branch, user.semester, user.academic_year, user.batch,
            user.employee_id, user.designation, user.specialization,
            user.organization_type, user.department, user.bio,
            user.phone_number, True, False
        ))
        
        connection.commit()
        user_id = cursor.lastrowid
        
        # Get the created user
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        db_user = cursor.fetchone()
        
        # Remove password hash from response
        db_user.pop("password_hash", None)
        
        # Ensure all required fields are present for the response model
        if db_user.get("bio") is None:
            db_user["bio"] = ""  # Set empty string instead of None for required field
        if db_user.get("department") is None:
            db_user["department"] = ""  # Ensure department is not None
        if db_user.get("college_id") is None:
            db_user["college_id"] = 1  # Default college_id if missing
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": db_user["username"], "user_id": db_user["id"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/auth/login", response_model=schemas.Token)
async def login_user(user_credentials: schemas.UserLogin, db = Depends(get_db)):
    """Login user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        print(f"🔍 Login attempt for email: {user_credentials.email}")
        
        # Get user by email
        cursor.execute("SELECT * FROM users WHERE email = %s", (user_credentials.email,))
        user = cursor.fetchone()
        
        if not user:
            print("❌ No user found with this email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"✅ User found: {user.get('full_name', 'Unknown')} ({user.get('role', 'Unknown role')})")
        
        # Check if frontend is sending hash instead of plain password (common error)
        if user_credentials.password.startswith('$'):
            print(f"❌ FRONTEND ERROR: Password field contains a hash instead of plain text!")
            print(f"❌ Received password: {user_credentials.password}")
            print(f"❌ Expected password: testpassword123 (plain text)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Frontend error: Password field should contain plain text, not a hash. Use 'testpassword123' for all test users."
            )
        
        # Verify password
        password_verified = auth.verify_password(user_credentials.password, user["password_hash"])
        print(f"🔐 Password verification: {password_verified}")
        
        if not password_verified:
            print("❌ Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.get("is_active", True):
            print("❌ User account is deactivated")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        print("✅ Login successful, creating token...")
        
        # Update last login
        try:
            cursor.execute(
                "UPDATE users SET last_login = NOW() WHERE id = %s",
                (user["id"],)
            )
            connection.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not update last login: {e}")
        
        # Remove password hash from response
        user.pop("password_hash", None)
        
        # Ensure all required fields are present for the response model
        if user.get("bio") is None:
            user["bio"] = ""  # Set empty string instead of None for required field
        if user.get("department") is None:
            user["department"] = ""  # Ensure department is not None
        if user.get("college_id") is None:
            user["college_id"] = 1  # Default college_id if missing
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user["username"], "user_id": user["id"]},
            expires_delta=access_token_expires
        )
        
        print("🎉 Token created successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    except HTTPException:
        raise
    except mysql.connector.Error as e:
        print(f"💥 Database error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during login"
        )
    except Exception as e:
        print(f"💥 Unexpected login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/auth/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user = Depends(auth.get_current_user)):
    """Get current user information"""
    return current_user

@app.get("/auth/get-sample-users")
async def get_sample_users(db = Depends(get_db)):
    """Get sample users for testing (faculty and students)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            "SELECT id, username, email, full_name, role, college_id FROM users LIMIT 10"
        )
        users = cursor.fetchall()
        
        return {
            "message": "Sample users retrieved from MySQL",
            "users": users,
            "count": len(users)
        }
    except mysql.connector.Error as e:
        return {
            "error": str(e),
            "message": "Failed to fetch users from MySQL"
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# DATA ENDPOINTS
# ============================================================================

@app.get("/organizations")
async def list_organizations(current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        cursor.execute(
            """
            SELECT od.id, od.organization_name, od.description, od.user_id as owner_user_id,
                   COALESCE((SELECT COUNT(*) FROM organization_memberships om WHERE om.organization_id = od.id), 0) as member_count
            FROM organization_details od
            ORDER BY od.organization_name
            """
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/organizations/{org_id}/join")
async def join_organization(org_id: int, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can join organizations")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        # Check organization exists
        cursor.execute("SELECT id FROM organization_details WHERE id = %s", (org_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Organization not found")
        # Check existing membership
        cursor.execute("SELECT * FROM organization_memberships WHERE organization_id = %s AND user_id = %s", (org_id, current_user["id"]))
        if cursor.fetchone():
            return {"message": "Already a member"}
        # Robust insert that tolerates different schema definitions of `status`
        try:
            cursor.execute(
                "INSERT INTO organization_memberships (organization_id, user_id, status) VALUES (%s, %s, 'member')",
                (org_id, current_user["id"]))
            connection.commit()
        except Exception:
            try:
                cursor.execute(
                    "INSERT INTO organization_memberships (organization_id, user_id) VALUES (%s, %s)",
                    (org_id, current_user["id"]))
                connection.commit()
            except Exception:
                # Final fallback: try numeric status column with 1
                try:
                    cursor.execute(
                        "INSERT INTO organization_memberships (organization_id, user_id, status) VALUES (%s, %s, %s)",
                        (org_id, current_user["id"], 1))
                    connection.commit()
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to join organization: {e}")
        return {"message": "Joined organization", "organization_id": org_id}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/organizations/mine")
async def my_organization(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "organization":
        return {}
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM organization_details WHERE user_id = %s", (current_user["id"],))
        return cursor.fetchone() or {}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/organizations/mine/members")
async def my_org_members(
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Organization account required")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        cursor.execute("SELECT id FROM organization_details WHERE user_id = %s", (current_user["id"],))
        row = cursor.fetchone()
        if not row:
            return []
        org_id = row["id"]
        # Build status filter
        params = [org_id]
        where = "WHERE om.organization_id = %s"
        if status:
            statuses = [s.strip() for s in status.split(',') if s.strip()]
            if statuses:
                placeholders = ",".join(["%s"] * len(statuses))
                where += f" AND om.status IN ({placeholders})"
                params.extend(statuses)
        else:
            # Default: only active members (treat NULL as active)
            where += " AND (om.status IN ('member','approved','selected') OR om.status IS NULL)"
        query = f"""
            SELECT u.id, u.full_name, u.email,
                   u.course AS course, u.semester AS semester,
                   u.department AS department, u.bio AS bio,
                   om.joined_at, om.status
            FROM organization_memberships om
            JOIN users u ON u.id = om.user_id
            {where}
            ORDER BY om.joined_at DESC
            """
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/organizations/{org_id}/members")
async def organization_members(
    org_id: int,
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        # Build status filter
        params = [org_id]
        where = "WHERE om.organization_id = %s"
        if status:
            statuses = [s.strip() for s in status.split(',') if s.strip()]
            if statuses:
                placeholders = ",".join(["%s"] * len(statuses))
                where += f" AND om.status IN ({placeholders})"
                params.extend(statuses)
        else:
            where += " AND (om.status IN ('member','approved','selected') OR om.status IS NULL)"
        query = f"""
            SELECT u.id, u.full_name, u.email,
                   u.course AS course, u.semester AS semester,
                   u.department AS department, u.bio AS bio,
                   om.joined_at, om.status
            FROM organization_memberships om
            JOIN users u ON u.id = om.user_id
            {where}
            ORDER BY om.joined_at DESC
            """
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/organizations/members/{user_id}/status")
async def update_member_status(user_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    """Update a member's status in the calling org (organization role only)."""
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Organization account required")
    new_status = (payload or {}).get("status")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        cursor.execute("SELECT id FROM organization_details WHERE user_id = %s", (current_user["id"],))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="Organization not found for user")
        org_id = row["id"]
        # Try text update; if fails, try numeric fallback
        try:
            if new_status is not None:
                cursor.execute(
                    "UPDATE organization_memberships SET status = %s WHERE organization_id = %s AND user_id = %s",
                    (new_status, org_id, user_id))
            else:
                cursor.execute(
                    "UPDATE organization_memberships SET status = status WHERE organization_id = %s AND user_id = %s",
                    (org_id, user_id))
            connection.commit()
        except Exception:
            try:
                cursor.execute(
                    "UPDATE organization_memberships SET status = %s WHERE organization_id = %s AND user_id = %s",
                    (1, org_id, user_id))
                connection.commit()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to update status: {e}")
        # Notify the member
        try:
            member_title = "Application Update"
            member_msg = f"Your application status was updated to '{new_status}'."
            _notify_user(cursor, user_id, member_title, member_msg, category='recruitment', created_by=current_user["id"])
            connection.commit()
        except Exception:
            pass
        return {"message": "Status updated"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/organizations/mine/stats")
async def my_org_stats(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Organization account required")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_org_memberships(cursor)
        # get org_id
        cursor.execute("SELECT id FROM organization_details WHERE user_id = %s", (current_user["id"],))
        row = cursor.fetchone()
        if not row:
            return {"members": 0, "events": 0, "upcoming_events": 0}
        org_id = row["id"]
        # members (only active)
        cursor.execute(
            "SELECT COUNT(*) AS c FROM organization_memberships WHERE organization_id = %s AND (status IN ('member','approved','selected') OR status IS NULL)",
            (org_id,)
        )
        members = cursor.fetchone().get("c", 0)
        # events by this organizer
        cursor.execute("SELECT COUNT(*) AS c FROM events WHERE organizer_id = %s", (current_user["id"],))
        events = cursor.fetchone().get("c", 0)
        # upcoming events
        cursor.execute("SELECT COUNT(*) AS c FROM events WHERE organizer_id = %s AND (event_date > CURDATE() OR (event_date = CURDATE() AND start_time >= CURTIME()))", (current_user["id"],))
        upcoming = cursor.fetchone().get("c", 0)
        return {"members": members, "events": events, "upcoming_events": upcoming}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/colleges")
async def get_colleges(db = Depends(get_db)):
    """Get all colleges"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM colleges WHERE is_active = TRUE")
        colleges = cursor.fetchall()
        
        return {"colleges": colleges}
    except mysql.connector.Error as e:
        return {"colleges": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/clubs")
async def get_clubs(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get clubs for the current user's college"""
    try:
        college_id = current_user.get("college_id")
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get clubs from the same college
        cursor.execute(
            "SELECT * FROM clubs WHERE college_id = %s AND is_active = TRUE",
            (college_id,)
        )
        clubs = cursor.fetchall()
        
        # Add member count for each club
        for club in clubs:
            cursor.execute(
                "SELECT COUNT(*) as member_count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                (club["id"],)
            )
            count_result = cursor.fetchone()
            club["member_count"] = count_result["member_count"] if count_result else 0
        
        return clubs
    except mysql.connector.Error as e:
        return {"error": str(e), "clubs": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/clubs", response_model=schemas.ClubResponse)
async def create_club(club_data: schemas.ClubCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create a new club (Faculty/Admin only)"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can create clubs")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO clubs (name, description, category, college_id, max_members, created_by, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            """,
            (club_data.name, club_data.description, club_data.category, 
             club_data.college_id, club_data.max_members, current_user["id"])
        )
        connection.commit()
        club_id = cursor.lastrowid
        
        # Get the created club
        cursor.execute("SELECT * FROM clubs WHERE id = %s", (club_id,))
        club = cursor.fetchone()
        club["member_count"] = 0
        
        return club
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/clubs/apply")
async def apply_to_club(application: schemas.ClubApplicationCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Apply to join a club"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply to clubs")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if already applied or member
        cursor.execute(
            "SELECT * FROM club_memberships WHERE club_id = %s AND user_id = %s",
            (application.club_id, current_user["id"])
        )
        existing = cursor.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already applied or member of this club")
        
        # Insert application
        cursor.execute(
            """
            INSERT INTO club_memberships (club_id, user_id, status, joined_at, application_message)
            VALUES (%s, %s, 'pending', NOW(), %s)
            """,
            (application.club_id, current_user["id"], application.application_message)
        )
        connection.commit()
        
        return {"message": "Application submitted successfully", "status": "pending"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/clubs/{club_id}/applications")
async def get_club_applications(club_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get pending applications for a club (Club admin/Faculty only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user is club admin or faculty
        if current_user.get("role") == "faculty":
            # Faculty can view all applications
            pass
        else:
            # Check if user is club admin
            cursor.execute(
                "SELECT * FROM clubs WHERE id = %s AND created_by = %s",
                (club_id, current_user["id"])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to view applications")
        
        # Get applications
        cursor.execute(
            """
            SELECT cm.*, u.full_name, u.email, u.course, u.semester
            FROM club_memberships cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = %s AND cm.status = 'pending'
            ORDER BY cm.joined_at DESC
            """,
            (club_id,)
        )
        applications = cursor.fetchall()
        
        return applications
    except mysql.connector.Error as e:
        return {"error": str(e), "applications": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/clubs/applications/review")
async def review_club_application(action: schemas.ClubApplicationAction, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Approve or reject club application"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can review applications")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get application details
        cursor.execute(
            """
            SELECT cm.*, c.name as club_name 
            FROM club_memberships cm 
            JOIN clubs c ON cm.club_id = c.id 
            WHERE cm.id = %s
            """,
            (action.application_id,)
        )
        application = cursor.fetchone()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Update application status
        new_status = "approved" if action.action == "approve" else "rejected"
        cursor.execute(
            """
            UPDATE club_memberships 
            SET status = %s, reviewed_at = NOW(), reviewed_by = %s 
            WHERE id = %s
            """,
            (new_status, current_user["id"], action.application_id)
        )
        connection.commit()
        
        return {
            "message": f"Application {new_status} successfully",
            "application_id": action.application_id,
            "status": new_status
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/clubs/{club_id}/members")
async def get_club_members(club_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get club members"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email,
                   NULL AS course, NULL AS semester,
                   cm.joined_at, cm.status
            FROM club_memberships cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = %s AND cm.status = 'approved'
            ORDER BY cm.joined_at DESC
            """,
            (club_id,)
        )
        members = cursor.fetchall()
        
        return members
    except mysql.connector.Error as e:
        return {"error": str(e), "members": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/my-clubs")
async def get_my_clubs(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get clubs user is member of or applied to"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT c.*, cm.status, cm.joined_at
            FROM clubs c
            JOIN club_memberships cm ON c.id = cm.club_id
            WHERE cm.user_id = %s
            ORDER BY cm.joined_at DESC
            """,
            (current_user["id"],)
        )
        clubs = cursor.fetchall()
        
        return clubs
    except mysql.connector.Error as e:
        return {"error": str(e), "clubs": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Alias: organizations the current student is a member of
@app.get("/organizations/my")
async def my_organizations(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Helper to check for table existence
        def table_exists(name: str) -> bool:
            cursor.execute("SHOW TABLES LIKE %s", (name,))
            return cursor.fetchone() is not None
        
        if table_exists("club_memberships") and table_exists("clubs"):
            # Treat clubs as organizations and include only approved memberships
            cursor.execute(
                """
                SELECT c.id, c.name AS organization_name, c.description, c.category,
                       cm.joined_at
                FROM clubs c
                JOIN club_memberships cm ON c.id = cm.club_id
                WHERE cm.user_id = %s AND cm.status = 'approved'
                ORDER BY cm.joined_at DESC
                """,
                (current_user["id"],)
            )
            return cursor.fetchall()
        
        # Fallback to organization_details + organization_memberships
        cursor.execute("SHOW COLUMNS FROM organization_details")
        cols = {c["Field"] for c in cursor.fetchall()}
        name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else "id")
        cursor.execute(
            f"""
            SELECT od.id, od.{name_col} AS organization_name, om.joined_at, om.status
            FROM organization_details od
            JOIN organization_memberships om ON od.id = om.organization_id
            WHERE om.user_id = %s AND (om.status IN ('member','approved','selected') OR om.status IS NULL)
            ORDER BY om.joined_at DESC
            """,
            (current_user["id"],)
        )
        return cursor.fetchall()
    except mysql.connector.Error as e:
        return {"organizations": [], "error": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ============================================================================
# EVENT MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/events")
async def get_events(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get upcoming events. Adjusted for events schema (event_date, start_time, end_time)."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)

        # Upcoming = today or later, and start time not passed today
        query = """
            SELECT e.*, u.full_name as organizer_name
            FROM events e
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.is_active = 1
              AND (e.event_date > CURDATE() OR (e.event_date = CURDATE() AND e.start_time >= CURTIME()))
            ORDER BY e.event_date, e.start_time
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Normalize payload to include ISO start/end for frontend
        events = []
        for r in rows:
            ev_date = r.get("event_date")
            st = r.get("start_time")
            et = r.get("end_time")
            start_iso = None
            end_iso = None
            try:
                st_py = _as_pytime(st)
                et_py = _as_pytime(et)
                if ev_date and st_py:
                    start_iso = datetime.combine(ev_date, st_py).isoformat()
                if ev_date and et_py:
                    end_iso = datetime.combine(ev_date, et_py).isoformat()
            except Exception:
                pass
            r["start_time"] = start_iso or (str(st))
            r["end_time"] = end_iso or (str(et))
            events.append(r)
        return events
    except mysql.connector.Error as e:
        return {"error": str(e), "events": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/events")
async def create_event(event_data: schemas.EventCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create a new event (Faculty/Admin/Organization) against the existing events schema."""
    if current_user.get("role") not in ["faculty", "admin", "organization"]:
        raise HTTPException(status_code=403, detail="Only faculty, admin, and organization can create events")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)

        # Parse incoming datetimes into date + time fields
        try:
            sd = event_data.start_time if isinstance(event_data.start_time, str) else str(event_data.start_time)
            ed = event_data.end_time if isinstance(event_data.end_time, str) else str(event_data.end_time)
            start_dt = datetime.fromisoformat(sd.replace('Z',''))
            end_dt = datetime.fromisoformat(ed.replace('Z',''))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid start_time/end_time format; expected ISO 8601")

        event_date = start_dt.date()
        start_time = start_dt.time()
        end_time = end_dt.time()

        # Organization association is optional; keep NULL to avoid FK issues across datasets
        org_id = None

        # Map event_type -> category, ignore columns not present in schema
        cursor.execute(
            """
            INSERT INTO events (title, description, event_date, start_time, end_time, venue,
                                organizer_id, organization_id, category, max_participants, registration_required, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 1)
            """,
            (
                event_data.title,
                event_data.description,
                event_date,
                start_time,
                end_time,
                event_data.venue,
                current_user["id"],
                org_id,
                event_data.event_type,
                event_data.max_participants or None,
            )
        )
        connection.commit()
        event_id = cursor.lastrowid

        # Build normalized return shape
        cursor.execute(
            """
            SELECT e.*, u.full_name as organizer_name
            FROM events e
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.id = %s
            """,
            (event_id,)
        )
        event = cursor.fetchone()
        if event:
            st_py = _as_pytime(event.get("start_time"))
            et_py = _as_pytime(event.get("end_time"))
            event["start_time"] = datetime.combine(event["event_date"], st_py).isoformat() if st_py else None
            event["end_time"] = datetime.combine(event["event_date"], et_py).isoformat() if et_py else None
            event["current_participants"] = 0
        return event
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/events/rsvp")
async def rsvp_event(rsvp_data: schemas.EventRSVP, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """RSVP to an event"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if event exists and is still open for registration
        cursor.execute("SELECT * FROM events WHERE id = %s", (rsvp_data.event_id,))
        event = cursor.fetchone()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        if event["registration_deadline"] and datetime.now() > event["registration_deadline"]:
            raise HTTPException(status_code=400, detail="Registration deadline has passed")
        
        # Check if already RSVPed
        cursor.execute(
            "SELECT * FROM event_rsvps WHERE event_id = %s AND user_id = %s",
            (rsvp_data.event_id, current_user["id"])
        )
        existing_rsvp = cursor.fetchone()
        
        if existing_rsvp:
            # Update existing RSVP
            cursor.execute(
                "UPDATE event_rsvps SET response = %s, rsvp_date = NOW() WHERE event_id = %s AND user_id = %s",
                (rsvp_data.response, rsvp_data.event_id, current_user["id"])
            )
        else:
            # Create new RSVP
            cursor.execute(
                "INSERT INTO event_rsvps (event_id, user_id, response, rsvp_date) VALUES (%s, %s, %s, NOW())",
                (rsvp_data.event_id, current_user["id"], rsvp_data.response)
            )
        
        connection.commit()
        
        return {
            "message": f"RSVP updated to '{rsvp_data.response}' successfully",
            "event_id": rsvp_data.event_id,
            "response": rsvp_data.response
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/events/{event_id}")
async def get_event_details(event_id: int, current_user = Depends(auth.get_current_user)):
    """Get event details by id"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT e.*, u.full_name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = %s
            """,
            (event_id,)
        )
        event = cursor.fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        # Add participant count
        cursor.execute(
            "SELECT COUNT(*) as participant_count FROM event_rsvps WHERE event_id = %s AND response = 'attending'",
            (event_id,)
        )
        count_result = cursor.fetchone()
        event["current_participants"] = count_result["participant_count"] if count_result else 0
        return event
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.put("/events/{event_id}")
async def update_event(event_id: int, event_data: dict, current_user = Depends(auth.get_current_user)):
    """Update event (Organizer/Faculty/Admin only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Authorization: organizer or faculty/admin
        cursor.execute("SELECT organizer_id FROM events WHERE id = %s", (event_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        if current_user.get("role") not in ["faculty", "admin"] and row["organizer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to update this event")
        # Build dynamic update
        fields = []
        values = []
        for key in ["title", "description", "event_type", "start_time", "end_time", "venue", "max_participants", "registration_deadline", "is_public"]:
            if key in event_data:
                fields.append(f"{key} = %s")
                values.append(event_data[key])
        if not fields:
            return {"message": "No changes"}
        values.append(event_id)
        cursor.execute(f"UPDATE events SET {', '.join(fields)} WHERE id = %s", tuple(values))
        connection.commit()
        return {"message": "Event updated"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.delete("/events/{event_id}")
async def delete_event(event_id: int, current_user = Depends(auth.get_current_user)):
    """Delete event (Organizer/Faculty/Admin only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT organizer_id FROM events WHERE id = %s", (event_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        if current_user.get("role") not in ["faculty", "admin"] and row["organizer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this event")
        cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
        connection.commit()
        return {"message": "Event deleted"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/events/{event_id}/participants")
async def get_event_participants(event_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get event participants (Organizer/Faculty only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user is organizer or faculty
        if current_user.get("role") != "faculty":
            cursor.execute("SELECT * FROM events WHERE id = %s AND organizer_id = %s", (event_id, current_user["id"]))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to view participants")
        
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email,
                   NULL AS course, NULL AS semester,
                   er.response, er.rsvp_date
            FROM event_rsvps er
            JOIN users u ON er.user_id = u.id
            WHERE er.event_id = %s
            ORDER BY er.rsvp_date DESC
            """,
            (event_id,)
        )
        participants = cursor.fetchall()
        
        return participants
    except mysql.connector.Error as e:
        return {"error": str(e), "participants": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/my-events")
async def get_my_events(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get events user has RSVPed to"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT e.*, er.response, er.rsvp_date, u.full_name as organizer_name
            FROM events e
            JOIN event_rsvps er ON e.id = er.event_id
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE er.user_id = %s
            ORDER BY e.start_time DESC
            """,
            (current_user["id"],)
        )
        events = cursor.fetchall()
        
        return events
    except mysql.connector.Error as e:
        return {"error": str(e), "events": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/networking/recommendations")
async def get_networking_recommendations(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get networking recommendations for the current user"""
    try:
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get students from the same college (excluding current user)
        cursor.execute(
            """
            SELECT id, full_name, username, course, department, bio 
            FROM users 
            WHERE college_id = %s AND role = 'student' AND id != %s 
            LIMIT 10
            """,
            (college_id, user_id)
        )
        recommendations = cursor.fetchall()
        
        return recommendations
    except mysql.connector.Error as e:
        return {"error": str(e), "recommendations": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/user/activity")
async def get_user_activity(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get recent activity for the current user"""
    try:
        user_id = current_user.get("id")
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        activities = []
        
        # Get recent club joins
        cursor.execute(
            """
            SELECT cm.created_at, c.name as club_name 
            FROM club_memberships cm 
            JOIN clubs c ON cm.club_id = c.id 
            WHERE cm.user_id = %s 
            ORDER BY cm.created_at DESC 
            LIMIT 5
            """,
            (user_id,)
        )
        club_joins = cursor.fetchall()
        
        for membership in club_joins:
            activities.append({
                "type": "club_join",
                "action": f"Joined {membership['club_name']}",
                "time": membership["created_at"].isoformat() if membership["created_at"] else None,
                "color": "bg-blue-500"
            })
        
        # Get recent event RSVPs
        cursor.execute(
            """
            SELECT er.created_at, e.title as event_title 
            FROM event_rsvps er 
            JOIN events e ON er.event_id = e.id 
            WHERE er.user_id = %s 
            ORDER BY er.created_at DESC 
            LIMIT 5
            """,
            (user_id,)
        )
        event_rsvps = cursor.fetchall()
        
        for rsvp in event_rsvps:
            activities.append({
                "type": "event_rsvp",
                "action": f"RSVP'd to {rsvp['event_title']}",
                "time": rsvp["created_at"].isoformat() if rsvp["created_at"] else None,
                "color": "bg-green-500"
            })
        
        # Sort by time
        activities.sort(key=lambda x: x["time"] or "", reverse=True)
        
        return activities[:10]
    except mysql.connector.Error as e:
        return {"error": str(e), "activities": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# ADMIN ROLES ENDPOINTS
# ============================================================================

def _ensure_admin_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) UNIQUE,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_user_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role_id INT NOT NULL,
          user_id INT NOT NULL,
          assigned_by INT NULL,
          assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_role_user (role_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

def _seed_admin_roles(cursor):
    defaults = [
        ("classroom_admin", "Classroom Admin", "Manages classrooms, schedules, and allocations."),
        ("special_rooms_admin", "Special Rooms Admin", "Manages labs, auditoriums and special rooms."),
        ("canteen_admin", "Canteen Admin", "Oversees canteen orders, menus, and operations."),
        ("logs_admin", "Logs Admin", "Monitors system logs and audit trails."),
        ("domestic_admin", "Domestic Admin", "Handles housekeeping and campus domestic services."),
        ("security_admin", "Security Admin", "Manages access, identity, and safety protocols."),
    ]
    cursor.execute("SELECT COUNT(*) AS c FROM admin_roles")
    if (cursor.fetchone() or {}).get("c", 0) == 0:
        cursor.executemany("INSERT INTO admin_roles (code, name, description) VALUES (%s, %s, %s)", defaults)

@app.get("/admin/roles")
async def get_admin_roles(current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        _seed_admin_roles(cursor)
        cursor.execute("SELECT * FROM admin_roles ORDER BY name")
        rows = cursor.fetchall()
        return rows
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/admin/roles")
async def create_admin_role(payload: dict, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        cursor.execute("INSERT INTO admin_roles (code, name, description) VALUES (%s, %s, %s)", (
            payload.get("code"), payload.get("name"), payload.get("description")
        ))
        connection.commit()
        return {"id": cursor.lastrowid}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.delete("/admin/roles/{role_id}")
async def delete_admin_role(role_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        cursor.execute("DELETE FROM admin_roles WHERE id = %s", (role_id,))
        connection.commit()
        return {"deleted": True}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/admin/roles/{role_id}/users")
async def get_role_users(role_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        cursor.execute(
            """
            SELECT aur.user_id, u.full_name, u.email
            FROM admin_user_roles aur
            JOIN users u ON u.id = aur.user_id
            WHERE aur.role_id = %s
            ORDER BY u.full_name
            """,
            (role_id,)
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/admin/roles/{role_id}/users")
async def assign_role_user(role_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    user_id = (payload or {}).get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        cursor.execute("INSERT IGNORE INTO admin_user_roles (role_id, user_id, assigned_by) VALUES (%s, %s, %s)", (role_id, user_id, current_user["id"]))
        connection.commit()
        return {"assigned": True}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.delete("/admin/roles/{role_id}/users/{user_id}")
async def remove_role_user(role_id: int, user_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        cursor.execute("DELETE FROM admin_user_roles WHERE role_id = %s AND user_id = %s", (role_id, user_id))
        connection.commit()
        return {"removed": True}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ============================================================================
# HOSTEL MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/rooms")
async def get_rooms(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get available rooms"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM rooms WHERE is_available = TRUE")
        rooms = cursor.fetchall()
        
        return {"rooms": rooms}
    except mysql.connector.Error as e:
        return {"rooms": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/rooms/book")
async def book_room(booking_data: dict, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Book a room"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Insert booking
        cursor.execute(
            """
            INSERT INTO room_bookings (user_id, room_id, start_date, end_date, purpose, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
            """,
            (
                current_user["id"],
                booking_data["room_id"],
                booking_data["start_date"],
                booking_data["end_date"],
                booking_data.get("purpose", "")
            )
        )
        
        connection.commit()
        booking_id = cursor.lastrowid
        
        return {
            "message": "Room booked successfully",
            "booking_id": booking_id,
            "status": "pending"
        }
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# CANTEEN MANAGEMENT ENDPOINTS
# ============================================================================

# Ensure canteen tables

def _ensure_canteen_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS canteen_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(20) NOT NULL,
          payment_status VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, preparing, ready, served, cancelled
          qr_token VARCHAR(64) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_qr_token (qr_token),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS canteen_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          item_id VARCHAR(50) NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          quantity INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

from secrets import token_hex

@app.post("/canteen/order")
async def canteen_place_order(payload: dict, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    items = payload.get("items") or []
    total_amount = payload.get("total_amount") or 0
    payment_method = payload.get("payment_method") or "pay_now"
    payment_status = payload.get("payment_status") or ("paid" if payment_method == "pay_now" else "pending")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        qr = token_hex(16)
        cursor.execute(
            """
            INSERT INTO canteen_orders (user_id, total_amount, payment_method, payment_status, status, qr_token)
            VALUES (%s, %s, %s, %s, 'queued', %s)
            """,
            (current_user["id"], total_amount, payment_method, payment_status, qr)
        )
        order_id = cursor.lastrowid
        # items
        for it in items:
            cursor.execute(
                """
                INSERT INTO canteen_order_items (order_id, item_id, item_name, price, quantity)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (order_id, str(it.get("id")), it.get("name"), float(it.get("price", 0)), int(it.get("quantity", 1)))
            )
        connection.commit()
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=CANTEEN_{qr}"
        return {"order_id": order_id, "qr_token": qr, "qr_url": qr_url, "status": "queued", "payment_status": payment_status}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/orders")
async def list_canteen_orders(status: Optional[str] = None, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        sql = "SELECT * FROM canteen_orders"
        params: List = []
        if status:
            sql += " WHERE status = %s"
            params.append(status)
        sql += " ORDER BY created_at DESC LIMIT 500"
        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/canteen/orders/{order_id}/status")
async def canteen_update_status(order_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    # Allow admin or canteen admin (for demo, allow admin role)
    if current_user.get("role") not in ["admin", "faculty", "organization", "student"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    new_status = (payload or {}).get("status")
    if new_status not in ["queued","preparing","ready","served","cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        cursor.execute("UPDATE canteen_orders SET status = %s WHERE id = %s", (new_status, order_id))
        # Notify the student owner
        try:
            cursor.execute("SELECT user_id FROM canteen_orders WHERE id = %s", (order_id,))
            row = cursor.fetchone()
            if row:
                title = "Canteen Order Update"
                msg = f"Your order #{order_id} status is now '{new_status}'."
                _notify_user(cursor, row["user_id"], title, msg, category='canteen', created_by=current_user["id"])
        except Exception:
            pass
        connection.commit()
        return {"message": "updated"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/canteen/scan")
async def canteen_scan(payload: dict, current_user = Depends(auth.get_current_user)):
    # Assume canteen staff uses this endpoint; allow admin/org/faculty for demo
    if current_user.get("role") not in ["admin", "faculty", "organization"]:
        raise HTTPException(status_code=403, detail="Staff only")
    qr = (payload or {}).get("qr_token")
    if not qr:
        raise HTTPException(status_code=400, detail="qr_token required")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        cursor.execute("SELECT * FROM canteen_orders WHERE qr_token = %s", (qr,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("status") == "served":
            return {"valid": False, "message": "Already served"}
        # Mark served
        cursor.execute("UPDATE canteen_orders SET status = 'served' WHERE id = %s", (order["id"],))
        connection.commit()
        return {"valid": True, "message": "Order verified and marked served", "order_id": order["id"]}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ============================================================================
# CANTEEN MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/canteen/menu")
async def get_canteen_menu(db = Depends(get_db)):
    """Get canteen menu"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM canteen_menu_items WHERE is_available = TRUE ORDER BY category, name")
        menu_items = cursor.fetchall()
        
        # Group by category
        menu_by_category = {}
        for item in menu_items:
            category = item["category"]
            if category not in menu_by_category:
                menu_by_category[category] = []
            menu_by_category[category].append(item)
        
        return {"menu": menu_by_category, "items": menu_items}
    except mysql.connector.Error as e:
        return {"menu": {}, "items": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/canteen/menu", response_model=schemas.MenuItemResponse)
async def add_menu_item(item_data: schemas.MenuItemCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Add new menu item (Admin/Faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can add menu items")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO canteen_menu_items (name, description, price, category, is_vegetarian, is_available)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (item_data.name, item_data.description, item_data.price, 
             item_data.category, item_data.is_vegetarian, item_data.is_available)
        )
        connection.commit()
        item_id = cursor.lastrowid
        
        # Get the created item
        cursor.execute("SELECT * FROM canteen_menu_items WHERE id = %s", (item_id,))
        item = cursor.fetchone()
        
        return item
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/canteen/order", response_model=schemas.CanteenOrderResponse)
async def place_canteen_order(order_data: schemas.CanteenOrderCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Place a canteen order"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Calculate total amount
        total_amount = 0
        order_items = []
        
        for item in order_data.items:
            cursor.execute("SELECT * FROM canteen_menu_items WHERE id = %s AND is_available = TRUE", (item.menu_item_id,))
            menu_item = cursor.fetchone()
            
            if not menu_item:
                raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found or unavailable")
            
            item_total = menu_item["price"] * item.quantity
            total_amount += item_total
            
            order_items.append({
                "menu_item_id": item.menu_item_id,
                "name": menu_item["name"],
                "price": menu_item["price"],
                "quantity": item.quantity,
                "subtotal": item_total
            })
        
        # Insert order
        cursor.execute(
            """
            INSERT INTO canteen_orders (user_id, total_amount, status, special_instructions, order_date)
            VALUES (%s, %s, 'pending', %s, NOW())
            """,
            (current_user["id"], total_amount, order_data.special_instructions)
        )
        connection.commit()
        order_id = cursor.lastrowid
        
        # Insert order items
        for item in order_data.items:
            cursor.execute("SELECT price FROM canteen_menu_items WHERE id = %s", (item.menu_item_id,))
            price = cursor.fetchone()["price"]
            
            cursor.execute(
                """
                INSERT INTO canteen_order_items (order_id, menu_item_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item.menu_item_id, item.quantity, price)
            )
        
        connection.commit()
        
        return {
            "id": order_id,
            "user_id": current_user["id"],
            "total_amount": total_amount,
            "status": "pending",
            "special_instructions": order_data.special_instructions,
            "order_date": datetime.now(),
            "items": order_items
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/canteen/orders")
async def get_my_orders(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get user's canteen orders"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT co.*, 
                   GROUP_CONCAT(CONCAT(cmi.name, ' x', coi.quantity) SEPARATOR ', ') as items_summary
            FROM canteen_orders co
            LEFT JOIN canteen_order_items coi ON co.id = coi.order_id
            LEFT JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
            WHERE co.user_id = %s
            GROUP BY co.id
            ORDER BY co.order_date DESC
            """,
            (current_user["id"],)
        )
        orders = cursor.fetchall()
        
        # Get detailed items for each order
        for order in orders:
            cursor.execute(
                """
                SELECT coi.*, cmi.name, cmi.category
                FROM canteen_order_items coi
                JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
                WHERE coi.order_id = %s
                """,
                (order["id"],)
            )
            order["items"] = cursor.fetchall()
        
        return orders
    except mysql.connector.Error as e:
        return {"orders": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.put("/canteen/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Update order status (Admin/Faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can update order status")
    
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            "UPDATE canteen_orders SET status = %s WHERE id = %s",
            (status, order_id)
        )
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"message": f"Order status updated to {status}", "order_id": order_id, "status": status}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/canteen/orders/all")
async def get_all_orders(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get all canteen orders (Admin/Faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can view all orders")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT co.*, u.full_name, u.email,
                   GROUP_CONCAT(CONCAT(cmi.name, ' x', coi.quantity) SEPARATOR ', ') as items_summary
            FROM canteen_orders co
            JOIN users u ON co.user_id = u.id
            LEFT JOIN canteen_order_items coi ON co.id = coi.order_id
            LEFT JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
            GROUP BY co.id
            ORDER BY co.order_date DESC
            """,
        )
        orders = cursor.fetchall()
        
        return orders
    except mysql.connector.Error as e:
        return {"orders": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# TEACHER SCHEDULING ENDPOINTS
# ============================================================================

@app.post("/faculty/extra-lectures", response_model=schemas.ExtraLectureResponse)
async def create_extra_lecture(lecture_data: schemas.ExtraLectureCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create extra lecture (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can create extra lectures")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO extra_lectures (faculty_id, subject, topic, date, start_time, end_time, 
                                      venue, max_students, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (current_user["id"], lecture_data.subject, lecture_data.topic, lecture_data.date,
             lecture_data.start_time, lecture_data.end_time, lecture_data.venue,
             lecture_data.max_students, lecture_data.description)
        )
        connection.commit()
        lecture_id = cursor.lastrowid
        
        # Get the created lecture
        cursor.execute(
            """
            SELECT el.*, u.full_name as faculty_name
            FROM extra_lectures el
            JOIN users u ON el.faculty_id = u.id
            WHERE el.id = %s
            """,
            (lecture_id,)
        )
        lecture = cursor.fetchone()
        lecture["enrolled_students"] = 0
        
        return lecture
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/faculty/extra-lectures")
async def get_extra_lectures(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get available extra lectures"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT el.*, u.full_name as faculty_name,
                   COUNT(ele.id) as enrolled_students
            FROM extra_lectures el
            JOIN users u ON el.faculty_id = u.id
            LEFT JOIN extra_lecture_enrollments ele ON el.id = ele.lecture_id
            WHERE el.date >= CURDATE()
            GROUP BY el.id
            ORDER BY el.date, el.start_time
            """,
        )
        lectures = cursor.fetchall()
        
        return lectures
    except mysql.connector.Error as e:
        return {"lectures": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/faculty/extra-lectures/{lecture_id}/enroll")
async def enroll_in_extra_lecture(lecture_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Enroll in extra lecture (Students only)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can enroll in extra lectures")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if lecture exists and has capacity
        cursor.execute(
            """
            SELECT el.*, COUNT(ele.id) as enrolled_count
            FROM extra_lectures el
            LEFT JOIN extra_lecture_enrollments ele ON el.id = ele.lecture_id
            WHERE el.id = %s
            GROUP BY el.id
            """,
            (lecture_id,)
        )
        lecture = cursor.fetchone()
        
        if not lecture:
            raise HTTPException(status_code=404, detail="Extra lecture not found")
        
        if lecture["enrolled_count"] >= lecture["max_students"]:
            raise HTTPException(status_code=400, detail="Lecture is full")
        
        # Check if already enrolled
        cursor.execute(
            "SELECT * FROM extra_lecture_enrollments WHERE lecture_id = %s AND student_id = %s",
            (lecture_id, current_user["id"])
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already enrolled in this lecture")
        
        # Enroll student
        cursor.execute(
            "INSERT INTO extra_lecture_enrollments (lecture_id, student_id, enrolled_at) VALUES (%s, %s, NOW())",
            (lecture_id, current_user["id"])
        )
        connection.commit()
        
        return {"message": "Successfully enrolled in extra lecture", "lecture_id": lecture_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/faculty/consultation-slots", response_model=schemas.ConsultationSlotCreate)
async def create_consultation_slot(slot_data: schemas.ConsultationSlotCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create consultation slot (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can create consultation slots")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO consultation_slots (faculty_id, date, start_time, end_time, subject, max_bookings)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (current_user["id"], slot_data.date, slot_data.start_time, 
             slot_data.end_time, slot_data.subject, slot_data.max_bookings)
        )
        connection.commit()
        
        return {"message": "Consultation slot created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/faculty/consultation-slots")
async def get_consultation_slots(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get available consultation slots"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT cs.*, u.full_name as faculty_name,
                   COUNT(cb.id) as booked_count
            FROM consultation_slots cs
            JOIN users u ON cs.faculty_id = u.id
            LEFT JOIN consultation_bookings cb ON cs.id = cb.slot_id AND cb.status = 'confirmed'
            WHERE cs.date >= CURDATE()
            GROUP BY cs.id
            HAVING booked_count < cs.max_bookings
            ORDER BY cs.date, cs.start_time
            """,
        )
        slots = cursor.fetchall()
        
        return slots
    except mysql.connector.Error as e:
        return {"slots": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/faculty/consultation-slots/{slot_id}/book")
async def book_consultation_slot(slot_id: int, booking_data: schemas.ConsultationBooking, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Book consultation slot (Students only)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can book consultation slots")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check slot availability
        cursor.execute(
            """
            SELECT cs.*, COUNT(cb.id) as booked_count
            FROM consultation_slots cs
            LEFT JOIN consultation_bookings cb ON cs.id = cb.slot_id AND cb.status = 'confirmed'
            WHERE cs.date >= CURDATE()
            GROUP BY cs.id
            """,
            (slot_id,)
        )
        slot = cursor.fetchone()
        
        if not slot:
            raise HTTPException(status_code=404, detail="Consultation slot not found")
        
        if slot["booked_count"] >= slot["max_bookings"]:
            raise HTTPException(status_code=400, detail="Consultation slot is full")
        
        # Book the slot
        cursor.execute(
            """
            INSERT INTO consultation_bookings (slot_id, student_id, purpose, status, booking_date)
            VALUES (%s, %s, %s, 'confirmed', NOW())
            """,
            (slot_id, current_user["id"], booking_data.purpose)
        )
        connection.commit()
        
        return {"message": "Consultation slot booked successfully", "slot_id": slot_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/my-consultations")
async def get_my_consultations(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get user's consultation bookings"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        if current_user.get("role") == "student":
            # Student: get their bookings
            cursor.execute(
                """
                SELECT cb.*, cs.date, cs.start_time, cs.end_time, cs.subject,
                       u.full_name as faculty_name
                FROM consultation_bookings cb
                JOIN consultation_slots cs ON cb.slot_id = cs.id
                JOIN users u ON cs.faculty_id = u.id
                WHERE cb.student_id = %s
                ORDER BY cs.date DESC, cs.start_time DESC
                """,
                (current_user["id"],)
            )
        elif current_user.get("role") == "faculty":
            # Faculty: get bookings for their slots
            cursor.execute(
                """
                SELECT cb.*, cs.date, cs.start_time, cs.end_time, cs.subject,
                       u.full_name as student_name
                FROM consultation_bookings cb
                JOIN consultation_slots cs ON cb.slot_id = cs.id
                JOIN users u ON cb.student_id = u.id
                WHERE cs.faculty_id = %s
                ORDER BY cs.date DESC, cs.start_time DESC
                """,
                (current_user["id"],)
            )
        else:
            return {"consultations": []}
        
        consultations = cursor.fetchall()
        return consultations
    except mysql.connector.Error as e:
        return {"consultations": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# ROOM MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/rooms/available")
async def get_available_rooms(date: str, start_time: str, end_time: str, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get available rooms for booking"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT r.* FROM rooms r
            WHERE r.id NOT IN (
                SELECT rb.room_id FROM room_bookings rb
                WHERE rb.date = %s 
                AND rb.status IN ('confirmed', 'pending')
                AND (
                    (rb.start_time <= %s AND rb.end_time > %s) OR
                    (rb.start_time < %s AND rb.end_time >= %s) OR
                    (rb.start_time >= %s AND rb.end_time <= %s)
                )
            )
            AND r.is_available = 1
            ORDER BY r.name
            """,
            (date, start_time, start_time, end_time, end_time, start_time, end_time)
        )
        rooms = cursor.fetchall()
        
        return rooms
    except mysql.connector.Error as e:
        return {"rooms": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/rooms/book")
async def book_room(booking_data: schemas.RoomBookingCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Book a room"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if room is available
        cursor.execute(
            """
            SELECT COUNT(*) as count FROM room_bookings
            WHERE room_id = %s AND date = %s 
            AND status IN ('confirmed', 'pending')
            AND (
                (start_time <= %s AND end_time > %s) OR
                (start_time < %s AND end_time >= %s) OR
                (start_time >= %s AND end_time <= %s)
            )
            """,
            (booking_data.room_id, booking_data.date, booking_data.start_time, 
             booking_data.start_time, booking_data.end_time, booking_data.end_time,
             booking_data.start_time, booking_data.end_time)
        )
        
        if cursor.fetchone()["count"] > 0:
            raise HTTPException(status_code=400, detail="Room is not available for the specified time")
        
        # Create booking
        cursor.execute(
            """
            INSERT INTO room_bookings (room_id, user_id, date, start_time, end_time, 
                                     purpose, status, booking_date)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())
            """,
            (booking_data.room_id, current_user["id"], booking_data.date,
             booking_data.start_time, booking_data.end_time, booking_data.purpose)
        )
        connection.commit()
        booking_id = cursor.lastrowid
        
        return {"message": "Room booking request submitted", "booking_id": booking_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/my-room-bookings")
async def get_my_room_bookings(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get user's room bookings"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT rb.*, r.name as room_name, r.location, r.capacity
            FROM room_bookings rb
            JOIN rooms r ON rb.room_id = r.id
            WHERE rb.user_id = %s
            ORDER BY rb.date DESC, rb.start_time DESC
            """,
            (current_user["id"],)
        )
        bookings = cursor.fetchall()
        
        return bookings
    except mysql.connector.Error as e:
        return {"bookings": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/maintenance/requests")
async def create_maintenance_request(request_data: schemas.MaintenanceRequestCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create maintenance request"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO maintenance_requests (user_id, category, location, description, 
                                            priority, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', NOW())
            """,
            (current_user["id"], request_data.category, request_data.location,
             request_data.description, request_data.priority)
        )
        connection.commit()
        request_id = cursor.lastrowid
        
        return {"message": "Maintenance request submitted", "request_id": request_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/my-maintenance-requests")
async def get_my_maintenance_requests(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get user's maintenance requests"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT * FROM maintenance_requests
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (current_user["id"],)
        )
        requests = cursor.fetchall()
        
        return requests
    except mysql.connector.Error as e:
        return {"requests": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/hostel/my-room")
async def get_my_hostel_room(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get student's hostel room information"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access hostel information")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT hr.*, h.name as hostel_name, h.location as hostel_location,
                   h.warden_name, h.warden_contact
            FROM hostel_rooms hr
            JOIN hostels h ON hr.hostel_id = h.id
            WHERE hr.student_id = %s
            """,
            (current_user["id"],)
        )
        room_info = cursor.fetchone()
        
        if not room_info:
            return {"message": "No hostel room assigned"}
        
        return room_info
    except mysql.connector.Error as e:
        return {"room": None, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Admin endpoints for room management
@app.get("/admin/room-bookings")
async def get_all_room_bookings(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get all room bookings (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT rb.*, r.name as room_name, r.location, u.full_name as user_name
            FROM room_bookings rb
            JOIN rooms r ON rb.room_id = r.id
            JOIN users u ON rb.user_id = u.id
            ORDER BY rb.date DESC, rb.start_time DESC
            """,
        )
        bookings = cursor.fetchall()
        
        return bookings
    except mysql.connector.Error as e:
        return {"bookings": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.put("/admin/room-bookings/{booking_id}/status")
async def update_room_booking_status(booking_id: int, status_data: schemas.StatusUpdate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Update room booking status (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            "UPDATE room_bookings SET status = %s WHERE id = %s",
            (status_data.status, booking_id)
        )
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Room booking not found")
        
        return {"message": "Room booking status updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/admin/maintenance-requests")
async def get_all_maintenance_requests(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get all maintenance requests (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT mr.*, u.full_name as user_name
            FROM maintenance_requests mr
            JOIN users u ON mr.user_id = u.id
            ORDER BY mr.priority DESC, mr.created_at DESC
            """,
        )
        requests = cursor.fetchall()
        
        return requests
    except mysql.connector.Error as e:
        return {"requests": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.put("/admin/maintenance-requests/{request_id}/status")
async def update_maintenance_request_status(request_id: int, status_data: schemas.StatusUpdate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Update maintenance request status (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            "UPDATE maintenance_requests SET status = %s WHERE id = %s",
            (status_data.status, request_id)
        )
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Maintenance request not found")
        
        return {"message": "Maintenance request status updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# ACADEMIC FEATURES
# ============================================================================

@app.post("/assignments")
async def create_assignment(assignment_data: schemas.AssignmentCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create assignment (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can create assignments")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO assignments (faculty_id, title, description, subject, due_date, 
                                   max_marks, instructions, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """,
            (current_user["id"], assignment_data.title, assignment_data.description,
             assignment_data.subject, assignment_data.due_date, assignment_data.max_marks,
             assignment_data.instructions)
        )
        connection.commit()
        assignment_id = cursor.lastrowid
        
# Notify students about the new assignment
        try:
            _create_notification(
                cursor,
                title=f"New assignment: {assignment_data.title}",
                message=f"Subject: {assignment_data.subject}, Due: {assignment_data.due_date}",
                category="assignment",
                target_role="student",
                created_by=current_user["id"],
                priority="high"
            )
            connection.commit()
        except Exception:
            pass
        
        return {"message": "Assignment created successfully", "assignment_id": assignment_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/assignments")
async def get_assignments(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get assignments based on user role"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        if current_user.get("role") == "student":
            # Students see all assignments
            cursor.execute(
                """
                SELECT a.*, u.full_name as faculty_name,
                       sub.submission_date, sub.status as submission_status,
                       sub.marks_obtained
                FROM assignments a
                JOIN users u ON a.faculty_id = u.id
                LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id 
                    AND sub.student_id = %s
                WHERE a.due_date >= CURDATE() - INTERVAL 30 DAY
                ORDER BY a.due_date ASC
                """,
                (current_user["id"],)
            )
        elif current_user.get("role") == "faculty":
            # Faculty see their assignments
            cursor.execute(
                """
                SELECT a.*, u.full_name as faculty_name,
                       COUNT(sub.id) as total_submissions,
                       COUNT(CASE WHEN sub.status = 'graded' THEN 1 END) as graded_submissions
                FROM assignments a
                JOIN users u ON a.faculty_id = u.id
                LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id
                WHERE a.faculty_id = %s
                GROUP BY a.id
                ORDER BY a.due_date DESC
                """,
                (current_user["id"],)
            )
        else:
            return {"assignments": []}
        
        assignments = cursor.fetchall()
        return assignments
    except mysql.connector.Error as e:
        return {"assignments": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/assignments/{assignment_id}/submit")
async def submit_assignment(assignment_id: int, submission_data: schemas.AssignmentSubmissionCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Submit assignment (Students only)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if assignment exists and is still open
        cursor.execute(
            "SELECT * FROM assignments WHERE id = %s AND due_date >= NOW()",
            (assignment_id,)
        )
        assignment = cursor.fetchone()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found or deadline passed")
        
        # Check if already submitted
        cursor.execute(
            "SELECT * FROM assignment_submissions WHERE assignment_id = %s AND student_id = %s",
            (assignment_id, current_user["id"])
        )
        existing_submission = cursor.fetchone()
        
        if existing_submission:
            # Update existing submission
            cursor.execute(
                """
                UPDATE assignment_submissions 
                SET content = %s, file_path = %s, submission_date = NOW(), status = 'submitted'
                WHERE assignment_id = %s AND student_id = %s
                """,
                (submission_data.content, submission_data.file_path, assignment_id, current_user["id"])
            )
        else:
            # Create new submission
            cursor.execute(
                """
                INSERT INTO assignment_submissions (assignment_id, student_id, content, 
                                                  file_path, submission_date, status)
                VALUES (%s, %s, %s, %s, NOW(), 'submitted')
                """,
                (assignment_id, current_user["id"], submission_data.content, submission_data.file_path)
            )
        
        connection.commit()
        return {"message": "Assignment submitted successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get assignment submissions (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can view submissions")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verify assignment belongs to faculty
        cursor.execute(
            "SELECT * FROM assignments WHERE id = %s AND faculty_id = %s",
            (assignment_id, current_user["id"])
        )
        assignment = cursor.fetchone()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        cursor.execute(
            """
            SELECT sub.*, u.full_name as student_name, u.email as student_email
            FROM assignment_submissions sub
            JOIN users u ON sub.student_id = u.id
            WHERE sub.assignment_id = %s
            ORDER BY sub.submission_date ASC
            """,
            (assignment_id,)
        )
        submissions = cursor.fetchall()
        
        return submissions
    except mysql.connector.Error as e:
        return {"submissions": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.put("/assignments/submissions/{submission_id}/grade")
async def grade_assignment_submission(submission_id: int, grade_data: schemas.GradeSubmission, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Grade assignment submission (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can grade assignments")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verify submission belongs to faculty's assignment
        cursor.execute(
            """
            SELECT sub.*, a.faculty_id, a.max_marks
            FROM assignment_submissions sub
            JOIN assignments a ON sub.assignment_id = a.id
            WHERE sub.id = %s AND a.faculty_id = %s
            """,
            (submission_id, current_user["id"])
        )
        submission = cursor.fetchone()
        
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        if grade_data.marks_obtained > submission["max_marks"]:
            raise HTTPException(status_code=400, detail="Marks cannot exceed maximum marks")
        
        cursor.execute(
            """
            UPDATE assignment_submissions 
            SET marks_obtained = %s, feedback = %s, status = 'graded', graded_date = NOW()
            WHERE id = %s
            """,
            (grade_data.marks_obtained, grade_data.feedback, submission_id)
        )
        connection.commit()
        
        return {"message": "Assignment graded successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/attendance/mark")
async def mark_attendance(attendance_data: schemas.AttendanceCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Mark attendance (Faculty only)"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can mark attendance")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if attendance already marked for this date/subject/student
        cursor.execute(
            """
            SELECT * FROM attendance 
            WHERE student_id = %s AND subject = %s AND date = %s
            """,
            (attendance_data.student_id, attendance_data.subject, attendance_data.date)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing attendance
            cursor.execute(
                """
                UPDATE attendance 
                SET status = %s, marked_by = %s, marked_at = NOW()
                WHERE id = %s
                """,
                (attendance_data.status, current_user["id"], existing["id"])
            )
        else:
            # Create new attendance record
            cursor.execute(
                """
                INSERT INTO attendance (student_id, subject, date, status, marked_by, marked_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (attendance_data.student_id, attendance_data.subject, attendance_data.date,
                 attendance_data.status, current_user["id"])
            )
        
        connection.commit()
        return {"message": "Attendance marked successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/attendance/my")
async def get_my_attendance(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get student's attendance"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view their attendance")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT a.*, u.full_name as marked_by_name
            FROM attendance a
            JOIN users u ON a.marked_by = u.id
            WHERE a.student_id = %s
            ORDER BY a.date DESC
            """,
            (current_user["id"],)
        )
        attendance = cursor.fetchall()
        
        # Calculate attendance percentage by subject
        cursor.execute(
            """
            SELECT subject,
                   COUNT(*) as total_classes,
                   SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_classes,
                   ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
            FROM attendance
            WHERE student_id = %s
            GROUP BY subject
            """,
            (current_user["id"],)
        )
        summary = cursor.fetchall()
        
        return {"attendance": attendance, "summary": summary}
    except mysql.connector.Error as e:
        return {"attendance": [], "summary": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/grades/my")
async def get_my_grades(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get student's grades"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view their grades")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT sub.*, a.title as assignment_title, a.subject, a.max_marks,
                   u.full_name as faculty_name
            FROM assignment_submissions sub
            JOIN assignments a ON sub.assignment_id = a.id
            JOIN users u ON a.faculty_id = u.id
            WHERE sub.student_id = %s AND sub.status = 'graded'
            ORDER BY sub.graded_date DESC
            """,
            (current_user["id"],)
        )
        grades = cursor.fetchall()
        
        return grades
    except mysql.connector.Error as e:
        return {"grades": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# NOTIFICATION SYSTEM
# ============================================================================

@app.post("/notifications/create")
async def create_notification(notification_data: schemas.NotificationCreate, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Create notification (Admin and Faculty)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can create notifications")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO notifications (title, message, category, priority, 
                                     target_role, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """,
            (notification_data.title, notification_data.message, notification_data.category,
             notification_data.priority, notification_data.target_role, current_user["id"])
        )
        connection.commit()
        notification_id = cursor.lastrowid
        
        return {"message": "Notification created successfully", "notification_id": notification_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/notifications")
async def get_notifications(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get notifications for current user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT n.*, u.full_name as created_by_name,
                   ur.read_at, ur.is_read
            FROM notifications n
            JOIN users u ON n.created_by = u.id
            LEFT JOIN user_notification_reads ur ON n.id = ur.notification_id 
                AND ur.user_id = %s
            WHERE n.target_role IN ('all', %s)
            ORDER BY n.priority DESC, n.created_at DESC
            """,
            (current_user["id"], current_user["role"])
        )
        notifications = cursor.fetchall()
        
        return notifications
    except mysql.connector.Error as e:
        return {"notifications": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/notifications/{notification_id}/read")
async def mark_notification_read_endpoint(notification_id: int, current_user = Depends(auth.get_current_user)):
    """Mark notification as read"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if already marked as read
        cursor.execute(
            "SELECT * FROM user_notification_reads WHERE notification_id = %s AND user_id = %s",
            (notification_id, current_user["id"])
        )
        existing = cursor.fetchone()
        
        if existing:
            return {"message": "Notification already marked as read"}
        
        # Mark as read
        cursor.execute(
            """
            INSERT INTO user_notification_reads (notification_id, user_id, read_at, is_read)
            VALUES (%s, %s, NOW(), 1)
            """,
            (notification_id, current_user["id"])
        )
        connection.commit()

        return {"message": "Notification marked as read"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/notifications/unread-count")
async def get_unread_notification_count(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get unread notification count"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT COUNT(*) as unread_count
            FROM notifications n
            LEFT JOIN user_notification_reads ur ON n.id = ur.notification_id 
                AND ur.user_id = %s
            WHERE n.target_role IN ('all', %s)
            AND ur.is_read IS NULL
            """,
            (current_user["id"], current_user["role"])
        )
        result = cursor.fetchone()
        
        return {"unread_count": result["unread_count"]}
    except mysql.connector.Error as e:
        return {"unread_count": 0, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/notifications/{notification_id}/delete")
async def delete_notification(notification_id: int, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Delete notification (Admin only or creator)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user can delete this notification
        cursor.execute(
            "SELECT * FROM notifications WHERE id = %s",
            (notification_id,)
        )
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        if current_user.get("role") != "admin" and notification["created_by"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own notifications")
        
        # Delete notification and related reads
        cursor.execute("DELETE FROM user_notification_reads WHERE notification_id = %s", (notification_id,))
        cursor.execute("DELETE FROM notifications WHERE id = %s", (notification_id,))
        connection.commit()
        
        return {"message": "Notification deleted successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        connection = get_mysql_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        
        return {
            "status": "healthy",
            "message": "Campus Connect API is running with MySQL backend",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": "Campus Connect API is running but database connection failed",
            "database": "disconnected",
            "error": str(e)
        }
    finally:
        if 'cursor' in locals():
            cursor.close()

# ============================================================================
# ADDITIONAL ENDPOINTS FOR FRONTEND FEATURES
# ============================================================================

# ---------------------------------------------------------------------------
# Organizations aliases (map to Clubs)
# ---------------------------------------------------------------------------
@app.get("/organizations")
async def get_organizations_alias(current_user = Depends(auth.get_current_user)):
    """Alias: return clubs (or organization_details) as organizations for frontend"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        # Detect which table exists
        def table_exists(name: str) -> bool:
            cursor.execute("SHOW TABLES LIKE %s", (name,))
            return cursor.fetchone() is not None
        if table_exists("clubs"):
            cursor.execute(
                "SELECT * FROM clubs WHERE (college_id = %s OR %s IS NULL) AND is_active = TRUE",
                (college_id, college_id)
            )
            rows = cursor.fetchall()
            # add member_count via club_memberships
            for r in rows:
                cursor.execute(
                    "SELECT COUNT(*) as member_count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                    (r["id"],)
                )
                cnt = cursor.fetchone()
                r["member_count"] = cnt["member_count"] if cnt else 0
            return rows
        # Fallback to organization_details + organization_memberships
        cursor.execute("SHOW COLUMNS FROM organization_details")
        cols = {c["Field"] for c in cursor.fetchall()}
        name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else None)
        type_col = "organization_type" if "organization_type" in cols else None
        # If college filtering column exists
        college_col = "college_id" if "college_id" in cols else None
        select_sql = f"SELECT id, {name_col} as name" + (f", {type_col} as category" if type_col else "") + (f", {college_col} as college_id" if college_col else "") + ", user_id FROM organization_details"
        where = ""
        params = []
        if college_col and college_id:
            where = f" WHERE {college_col} = %s"
            params.append(college_id)
        cursor.execute(select_sql + where, tuple(params))
        orgs = cursor.fetchall()
        # member_count from organization_memberships if present
        if table_exists("organization_memberships"):
            for o in orgs:
                cursor.execute(
                    "SELECT COUNT(*) as member_count FROM organization_memberships WHERE organization_id = %s AND status = 'approved'",
                    (o["id"],)
                )
                cnt = cursor.fetchone()
                o["member_count"] = cnt["member_count"] if cnt else 0
        return orgs
    except mysql.connector.Error as e:
        return {"organizations": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/organizations/{org_id}/join")
async def join_organization_alias(org_id: int, current_user = Depends(auth.get_current_user)):
    """Apply to a club/org using organizations join route.
    Uses club_memberships if available, else organization_memberships.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can join organizations")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Helper
        def table_exists(name: str) -> bool:
            cursor.execute("SHOW TABLES LIKE %s", (name,))
            return cursor.fetchone() is not None
        if table_exists("club_memberships"):
            cursor.execute(
                "SELECT id FROM club_memberships WHERE club_id = %s AND user_id = %s",
                (org_id, current_user["id"]) 
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Already applied or member")
            cursor.execute(
                """
                INSERT INTO club_memberships (club_id, user_id, status, joined_at, application_message)
                VALUES (%s, %s, 'pending', NOW(), %s)
                """,
                (org_id, current_user["id"], "Applied via /organizations/join")
            )
        else:
            # organization_memberships fallback
            cursor.execute(
                "SELECT id FROM organization_memberships WHERE organization_id = %s AND user_id = %s",
                (org_id, current_user["id"]) 
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Already applied or member")
            cursor.execute(
                """
                INSERT INTO organization_memberships (organization_id, user_id, status, joined_at, application_message)
                VALUES (%s, %s, 'pending', NOW(), %s)
                """,
                (org_id, current_user["id"], "Applied via /organizations/join")
            )
        connection.commit()
        return {"message": "Application submitted", "status": "pending"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# User details for review (organizations)
@app.get("/users/{user_id}/details")
async def get_user_details(user_id: int, current_user = Depends(auth.get_current_user)):
    """Return user profile details plus interests and skills for review panels."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Basic profile
        cursor.execute(
            """
            SELECT id, full_name, email, username, role, college_id,
                   course, semester, department, bio, phone_number
            FROM users WHERE id = %s
            """,
            (user_id,)
        )
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Interests
        interests: List[str] = []
        try:
            cursor.execute(
                "SELECT category FROM user_interest_categories WHERE user_id = %s",
                (user_id,)
            )
            rows = cursor.fetchall()
            interests = [r["category"] for r in rows]
        except Exception:
            interests = []
        # Skills
        skills: List[dict] = []
        try:
            cursor.execute(
                """
                SELECT s.name as skill_name, s.category, ss.proficiency_level
                FROM student_skills ss
                JOIN skills s ON ss.skill_id = s.id
                WHERE ss.student_id = %s
                ORDER BY ss.proficiency_level DESC, s.name
                """,
                (user_id,)
            )
            skills = cursor.fetchall()
        except Exception:
            skills = []
        return {"user": user, "interests": interests, "skills": skills}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# Recruitment post for clubs (organizations)
@app.post("/organizations/{org_id}/recruitment-post")
async def create_recruitment_post(org_id: int, data: dict, current_user = Depends(auth.get_current_user)):
    """Create a recruitment announcement as a notification to students"""
    if current_user.get("role") not in ["faculty", "admin"]:
        # Also allow club creator
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT created_by FROM clubs WHERE id = %s", (org_id,))
        row = cursor.fetchone()
        allowed = bool(row and row.get("created_by") == current_user["id"])
        cursor.close()
        connection.close()
        if not allowed:
            raise HTTPException(status_code=403, detail="Not authorized")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        title = data.get("title", "Recruitment Open")
        description = data.get("description", "Join our team")
        _create_notification(cursor, title=f"{title}", message=description, category="recruitment", target_role="student", created_by=current_user["id"], priority="normal")
        connection.commit()
        return {"message": "Recruitment post created"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ---------------------------------------------------------------------------
# Users listing (basic) for faculty dashboard
# ---------------------------------------------------------------------------
@app.get("/users")
async def list_users(role: Optional[str] = None, limit: int = 50, current_user = Depends(auth.get_current_user)):
    """List users, optionally filtered by role. Limited for dashboard views."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if role:
            cursor.execute(
                "SELECT id, full_name, email, role, course, semester, department FROM users WHERE role = %s LIMIT %s",
                (role, limit)
            )
        else:
            cursor.execute(
                "SELECT id, full_name, email, role, course, semester, department FROM users LIMIT %s",
                (limit,)
            )
        return cursor.fetchall()
    except mysql.connector.Error as e:
        return {"users": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ---------------------------------------------------------------------------
# Resources/Bookings aliases expected by frontend
# ---------------------------------------------------------------------------
@app.get("/resources/rooms")
async def list_available_rooms(date: Optional[str] = None, start_time: Optional[str] = None, end_time: Optional[str] = None, current_user = Depends(auth.get_current_user)):
    """Alias: List available rooms. If no time provided, use default 09:00-17:00."""
    # Defaults
    date = date or datetime.now().date().isoformat()
    start_time = start_time or "09:00:00"
    end_time = end_time or "17:00:00"
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT r.* FROM rooms r
            WHERE r.id NOT IN (
                SELECT rb.room_id FROM room_bookings rb
                WHERE rb.date = %s 
                AND rb.status IN ('confirmed', 'pending')
                AND (
                    (rb.start_time <= %s AND rb.end_time > %s) OR
                    (rb.start_time < %s AND rb.end_time >= %s) OR
                    (rb.start_time >= %s AND rb.end_time <= %s)
                )
            )
            AND r.is_available = 1
            ORDER BY r.name
            """,
            (date, start_time, start_time, end_time, end_time, start_time, end_time)
        )
        return cursor.fetchall()
    except mysql.connector.Error as e:
        return {"rooms": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/resources/book")
async def alias_book_resource(booking_data: dict, current_user = Depends(auth.get_current_user)):
    """Alias: Map to room booking create."""
    # Expect fields: room_id, date, start_time, end_time, purpose
    required = ["room_id", "date", "start_time", "end_time", "purpose"]
    for f in required:
        if f not in booking_data:
            raise HTTPException(status_code=400, detail=f"Missing field: {f}")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO room_bookings (room_id, user_id, date, start_time, end_time, purpose, status, booking_date)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())
            """,
            (booking_data["room_id"], current_user["id"], booking_data["date"], booking_data["start_time"], booking_data["end_time"], booking_data["purpose"])
        )
        connection.commit()
        return {"message": "Room booking request submitted", "booking_id": cursor.lastrowid}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/resources/my-bookings")
async def alias_my_bookings(current_user = Depends(auth.get_current_user)):
    """Alias: map to user's room bookings"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT rb.*, r.name as room_name, r.location, r.capacity
            FROM room_bookings rb
            JOIN rooms r ON rb.room_id = r.id
            WHERE rb.user_id = %s
            ORDER BY rb.date DESC, rb.start_time DESC
            """,
            (current_user["id"],)
        )
        return cursor.fetchall()
    except mysql.connector.Error as e:
        return {"bookings": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.delete("/resources/bookings/{booking_id}/cancel")
async def alias_cancel_booking(booking_id: int, current_user = Depends(auth.get_current_user)):
    """Alias: cancel a room booking if owned by user or admin."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Ensure ownership unless admin
        if current_user.get("role") != "admin":
            cursor.execute("SELECT user_id FROM room_bookings WHERE id = %s", (booking_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Booking not found")
            if row["user_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
        cursor.execute("UPDATE room_bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
        connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking cancelled"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ---------------------------------------------------------------------------
# Skills and Connections aliases
# ---------------------------------------------------------------------------
@app.get("/skills/student")
async def alias_skills_student(current_user = Depends(auth.get_current_user)):
    """Alias for frontend expecting /skills/student"""
    return get_student_skills(current_user)

@app.get("/connections")
async def alias_connections(current_user = Depends(auth.get_current_user)):
    """Alias: return networking recommendations as connections"""
    return await get_networking_recommendations(current_user)

@app.get("/connections/recommendations")
async def alias_connections_recommendations(current_user = Depends(auth.get_current_user)):
    """Alias: return networking recommendations"""
    return await get_networking_recommendations(current_user)

# ---------------------------------------------------------------------------
# Notifications stats alias and PUT /notifications/{id}/read compatibility
# ---------------------------------------------------------------------------
@app.put("/notifications/{notification_id}/read")
async def mark_notification_read_put(notification_id: int, current_user = Depends(auth.get_current_user)):
    return await mark_notification_read(notification_id, current_user)

@app.get("/notifications/stats")
async def notifications_stats_alias(current_user = Depends(auth.get_current_user)):
    """Alias to return unread count and basic stats for frontend"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Unread count
        cursor.execute(
            """
            SELECT COUNT(*) as unread_count
            FROM notifications n
            LEFT JOIN user_notification_reads ur ON n.id = ur.notification_id 
                AND ur.user_id = %s
            WHERE n.target_role IN ('all', %s)
            AND (ur.is_read IS NULL OR ur.is_read = 0)
            """,
            (current_user["id"], current_user["role"])
        )
        unread = cursor.fetchone()
        # Total notifications (last 30 days)
        cursor.execute(
            """
            SELECT COUNT(*) as total
            FROM notifications
            WHERE created_at >= NOW() - INTERVAL 30 DAY
            AND target_role IN ('all', %s)
            """,
            (current_user["role"],)
        )
        total = cursor.fetchone()
        return {"unread_count": unread.get("unread_count", 0), "total_last_30_days": total.get("total", 0)}
    except mysql.connector.Error as e:
        return {"unread_count": 0, "total_last_30_days": 0, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Timetable endpoints
@app.get("/timetable/student")
async def student_timetable_endpoint(current_user = Depends(auth.get_current_user)):
    """Get student's weekly timetable"""
    return get_student_timetable(current_user)

@app.get("/timetable/faculty")
async def faculty_timetable_endpoint(current_user = Depends(auth.get_current_user)):
    """Get faculty's weekly timetable"""
    return get_faculty_timetable(current_user)

@app.put("/timetable/update")
async def update_timetable_endpoint(entry_data: dict, current_user = Depends(auth.get_current_user)):
    """Update timetable entry (Faculty/Admin only)"""
    result = update_timetable_entry(entry_data, current_user)
    # Create a generic notification for timetable change
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _create_notification(
            cursor,
            title="Timetable updated",
            message=f"Timetable entry {entry_data.get('id')} has been updated.",
            category="timetable",
            target_role="student",
            created_by=current_user["id"],
            priority="normal"
        )
        connection.commit()
    except Exception:
        pass
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
    return result

@app.post("/timetable/change")
async def timetable_change_announce(change: dict, current_user = Depends(auth.get_current_user)):
    """Announce a timetable change and notify students"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty/admin can announce timetable changes")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        title = change.get("title", "Timetable update")
        msg = change.get("message", "A timetable change has been announced.")
        _create_notification(cursor, title=title, message=msg, category="timetable", target_role="student", created_by=current_user["id"], priority="high")
        connection.commit()
        return {"message": "Timetable change announced"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Skills endpoints
@app.get("/skills/my")
async def my_skills_endpoint(current_user = Depends(auth.get_current_user)):
    """Get student's skills and progress"""
    return get_student_skills(current_user)

@app.post("/skills/add")
async def add_skill_endpoint(skill_data: dict, current_user = Depends(auth.get_current_user)):
    """Add or update student skill"""
    return add_student_skill(skill_data, current_user)

@app.post("/skills/certification")
async def add_certification_endpoint(cert_data: dict, current_user = Depends(auth.get_current_user)):
    """Add student certification"""
    return add_certification(cert_data, current_user)

# Resources endpoints
@app.get("/resources")
async def resources_endpoint(current_user = Depends(auth.get_current_user)):
    """Get learning resources for current user"""
    return get_learning_resources(current_user)

# Alias expected by frontend services
@app.get("/resources/learning")
async def resources_learning_alias(current_user = Depends(auth.get_current_user)):
    """Alias: Get learning resources (same as /resources)"""
    return get_learning_resources(current_user)

@app.post("/resources/upload")
async def upload_resource_endpoint(resource_data: dict, current_user = Depends(auth.get_current_user)):
    """Upload learning resource (Faculty/Admin only)"""
    return upload_resource(resource_data, current_user)

@app.post("/resources/{resource_id}/download")
async def download_resource_endpoint(resource_id: int, current_user = Depends(auth.get_current_user)):
    """Track resource download"""
    return download_resource(resource_id, current_user)

# ============================================================================
# TIMETABLE ENDPOINTS
# ============================================================================

@app.get("/timetable/student")
async def student_timetable_endpoint(current_user = Depends(auth.get_current_user)):
    """Get student's weekly timetable"""
    return get_student_timetable(current_user)

@app.get("/timetable/faculty")
async def faculty_timetable_endpoint(current_user = Depends(auth.get_current_user)):
    """Get faculty's weekly timetable"""
    return get_faculty_timetable(current_user)

@app.put("/timetable/update")
async def update_timetable_endpoint(entry_data: dict, current_user = Depends(auth.get_current_user)):
    """Update timetable entry (Faculty/Admin only)"""
    return update_timetable_entry(entry_data, current_user)

# ============================================================================
# AI-POWERED SCHEDULING ENDPOINTS  
# ============================================================================

@app.post("/ai/reschedule-suggest")
async def suggest_reschedule_endpoint(
    request_data: dict, 
    current_user = Depends(auth.get_current_user)
):
    """AI-based rescheduling suggestions for cancelled classes"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can access rescheduling")
    
    class_id = request_data.get("class_id")
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")
    
    return ai_scheduler.suggest_reschedule_slot(class_id, current_user["id"])

@app.post("/ai/emergency-cancel")
async def emergency_cancel_endpoint(
    request_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """One-click emergency class cancellation with notifications"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can cancel classes")
    
    class_id = request_data.get("class_id")
    reason = request_data.get("reason", "")
    
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")
    
    return ai_scheduler.emergency_cancel_class(class_id, current_user["id"], reason)

@app.get("/ai/free-classrooms")
async def free_classrooms_endpoint(
    day: Optional[str] = None,
    time_slot: Optional[str] = None,
    current_user = Depends(auth.get_current_user)
):
    """Get currently available classrooms for student use"""
    return ai_scheduler.find_free_classrooms(day, time_slot)

@app.post("/ai/smart-booking")
async def smart_booking_endpoint(
    booking_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """Smart resource booking with conflict resolution"""
    required_fields = ["resource_type", "resource_id", "date", "start_time", "end_time", "purpose"]
    
    for field in required_fields:
        if field not in booking_data:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    
    return ai_scheduler.book_resource(
        current_user["id"],
        booking_data["resource_type"],
        booking_data["resource_id"],
        booking_data["date"],
        booking_data["start_time"],
        booking_data["end_time"],
        booking_data["purpose"]
    )

@app.post("/ai/event-conflict-check")
async def event_conflict_check_endpoint(
    event_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """Check for event scheduling conflicts and suggest alternatives"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can schedule events")
    
    required_fields = ["event_date", "start_time", "end_time"]
    
    for field in required_fields:
        if field not in event_data:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    
    return ai_scheduler.detect_event_conflicts(
        event_data["event_date"],
        event_data["start_time"], 
        event_data["end_time"],
        event_data.get("venue_id")
    )

# ============================================================================
# LOST & FOUND ENDPOINTS
# ============================================================================

@app.post("/lost-found/create")
async def create_lost_found_endpoint(item_data: dict, current_user = Depends(auth.get_current_user)):
    """Post a lost or found item"""
    return create_lost_found_item(item_data, current_user)

@app.get("/lost-found")
async def get_lost_found_endpoint(
    item_type: Optional[str] = None,
    category: Optional[str] = None, 
    search: Optional[str] = None,
    current_user = Depends(auth.get_current_user)
):
    """Get lost and found items with filters"""
    return get_lost_found_items(item_type, category, search, current_user)

@app.put("/lost-found/{item_id}/resolve")
async def resolve_lost_found_endpoint(item_id: int, current_user = Depends(auth.get_current_user)):
    """Mark lost/found item as resolved"""
    return mark_item_resolved(item_id, current_user)

# ============================================================================
# EVENT DISCOVERY ENDPOINTS
# ============================================================================

@app.get("/events/discover")
async def discover_events_endpoint(current_user = Depends(auth.get_current_user)):
    """Get events based on user interests with smart filtering"""
    return get_events_by_interests(current_user)

@app.post("/events/{event_id}/rsvp")
async def rsvp_event_endpoint(event_id: int, rsvp_data: dict, current_user = Depends(auth.get_current_user)):
    """RSVP to an event with calendar sync"""
    return rsvp_to_event(event_id, rsvp_data, current_user)

@app.put("/user/interests")
async def update_interests_endpoint(interests_data: dict, current_user = Depends(auth.get_current_user)):
    """Update user's interest categories for better event recommendations"""
    return update_user_interests(interests_data, current_user)

# Alias expected by some frontend code
@app.put("/interests/update")
async def update_interests_alias(interests: dict, current_user = Depends(auth.get_current_user)):
    """Alias for updating interests"""
    # Some frontends send { interests: {...} }
    payload = interests if "interests" in interests else {"interests": interests}
    return update_user_interests(payload, current_user)

# ============================================================================
# RESOURCE BOOKING ENDPOINTS
# ============================================================================

@app.get("/resources/available")
async def available_resources_endpoint(
    resource_type: str,
    date: str,
    start_time: str,
    end_time: str,
    current_user = Depends(auth.get_current_user)
):
    """Get available resources for booking"""
    return get_available_resources(resource_type, date, start_time, end_time, current_user)

@app.get("/bookings/my")
async def my_bookings_endpoint(current_user = Depends(auth.get_current_user)):
    """Get all bookings for current user"""
    return get_user_bookings(current_user)

# ---------------------------------------------------------------------------
# Student aggregated recommendations
# ---------------------------------------------------------------------------
@app.get("/student/recommendations")
async def student_recommendations(current_user = Depends(auth.get_current_user)):
    """Aggregate personalized suggestions: clubs, events, networking"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Clubs from same college (top by member_count)
        cursor.execute(
            """
            SELECT c.*, (
                SELECT COUNT(*) FROM club_memberships m 
                WHERE m.club_id = c.id AND m.status = 'approved') AS member_count
            FROM clubs c
            WHERE c.college_id = %s AND c.is_active = TRUE
            ORDER BY member_count DESC
            LIMIT 6
            """,
            (current_user["college_id"],)
        )
        clubs = cursor.fetchall()
        # Upcoming events
        cursor.execute(
            """
            SELECT e.*, u.full_name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.college_id = %s AND e.start_time >= NOW() 
            ORDER BY e.start_time
            LIMIT 6
            """,
            (current_user["college_id"],)
        )
        events = cursor.fetchall()
        # Networking suggestions (reuse existing endpoint logic via function)
        # Simulate lightweight call
        cursor.execute(
            """
            SELECT id, full_name, username, course, department, bio 
            FROM users 
            WHERE college_id = %s AND role = 'student' AND id != %s 
            LIMIT 6
            """,
            (current_user["college_id"], current_user["id"])
        )
        networking = cursor.fetchall()
        return {"clubs": clubs, "events": events, "networking": networking}
    except mysql.connector.Error as e:
        return {"clubs": [], "events": [], "networking": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# PUSH NOTIFICATIONS ENDPOINTS
# ============================================================================

@app.post("/notifications/register-token")
async def register_token_endpoint(token_data: dict, current_user = Depends(auth.get_current_user)):
    """Register FCM token for push notifications"""
    return register_notification_token(token_data, current_user)

@app.post("/notifications/send-bulk")
async def send_bulk_endpoint(notification_data: dict, current_user = Depends(auth.get_current_user)):
    """Send bulk notifications (Faculty/Admin only)"""
    return send_bulk_notification(notification_data, current_user)

# Notices endpoints
@app.get("/notices")
async def notices_endpoint(current_user = Depends(auth.get_current_user)):
    """Get notices for current user"""
    return get_notices(current_user)

@app.post("/notices/create")
async def create_notice_endpoint(notice_data: dict, current_user = Depends(auth.get_current_user)):
    """Create notice (Faculty/Admin only)"""
    return create_notice(notice_data, current_user)

@app.post("/notices/{notice_id}/read")
async def mark_notice_read_endpoint(notice_id: int, current_user = Depends(auth.get_current_user)):
    """Mark notice as read"""
    return mark_notice_read(notice_id, current_user)

@app.get("/notices/stats")
async def notice_stats_endpoint(current_user = Depends(auth.get_current_user)):
    """Get notice statistics"""
    return get_notice_stats(current_user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
