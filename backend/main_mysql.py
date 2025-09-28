"""
Campus Connect API - FastAPI with MySQL
Main application file with MySQL database integration
"""

import os
import sys
from datetime import timedelta
from typing import Optional, List
import traceback

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import mysql.connector
from mysql.connector import Error

# Local imports
import schemas
import auth
from database import get_db, get_mysql_connection
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Campus Connect API",
    description="Campus networking and collaboration platform with MySQL backend",
    version="2.0.0"
)

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

@app.get("/events")
async def get_events(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get upcoming events for the current user's college"""
    try:
        college_id = current_user.get("college_id")
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get upcoming events from the same college with organizer info
        query = """
            SELECT e.*, u.full_name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.college_id = %s AND e.start_time >= NOW() 
            ORDER BY e.start_time
        """
        cursor.execute(query, (college_id,))
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

@app.get("/canteen/menu")
async def get_canteen_menu(db = Depends(get_db)):
    """Get canteen menu"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM canteen_menu_items WHERE is_available = TRUE")
        menu_items = cursor.fetchall()
        
        return {"menu": menu_items}
    except mysql.connector.Error as e:
        return {"menu": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/canteen/order")
async def place_canteen_order(order_data: dict, current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Place a canteen order"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Insert order
        cursor.execute(
            """
            INSERT INTO canteen_orders (user_id, total_amount, status, order_date)
            VALUES (%s, %s, 'pending', NOW())
            """,
            (current_user["id"], order_data["total_amount"])
        )
        
        connection.commit()
        order_id = cursor.lastrowid
        
        # Insert order items
        for item in order_data["items"]:
            cursor.execute(
                """
                INSERT INTO canteen_order_items (order_id, menu_item_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item["menu_item_id"], item["quantity"], item["price"])
            )
        
        connection.commit()
        
        return {
            "message": "Order placed successfully",
            "order_id": order_id,
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
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
