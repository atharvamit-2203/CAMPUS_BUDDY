"""
Campus Connect API - FastAPI with MySQL
Main application file with MySQL database integration
"""

import os
import sys
import uuid
from datetime import timedelta, datetime, time
from typing import Optional, List
import traceback
import logging
from secrets import token_hex

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True  # Force reconfiguration
)
logger = logging.getLogger(__name__)

# Configure uvicorn logger
uvicorn_logger = logging.getLogger("uvicorn.access")
uvicorn_logger.setLevel(logging.INFO)

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, status, Query, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import time as time_module
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

# Import notifications router
from notifications import router as notifications_router

# Import clubs API (replaces organizations)
from clubs_api import (
    get_all_clubs, get_detailed_clubs, apply_to_club, join_club_simple,
    get_my_clubs, get_my_managed_clubs, get_club_members, update_member_status,
    get_my_club_stats, create_recruitment_post, search_clubs, get_club_categories
)

# Import club events API
from club_events_api import (
    create_club_event, get_club_events, get_all_club_events, approve_club_event,
    create_club_timeline, get_club_timeline, update_club_timeline, delete_club_timeline,
    sync_timeline_to_events, register_for_event, bulk_import_calendar_events,
    get_student_council_dashboard, mark_student_council
)

# Import admin user management
from admin_user_management import (
    add_student_manual, add_teacher_manual, bulk_upload_students_csv,
    bulk_upload_teachers_csv, get_import_logs, get_user_statistics, search_users
)

# Import club events calendar
from club_events_calendar import (
    create_club_event_calendar, get_club_calendar, get_all_clubs_calendar,
    subscribe_to_club_calendar, get_club_calendar_subscriptions,
    update_club_calendar_settings, get_upcoming_events_all_clubs
)

# Initialize FastAPI app
app = FastAPI(
    title="Campus Connect API",
    description="Campus networking and collaboration platform with MySQL backend",
    version="2.0.0"
)

# Include routers first (before individual routes to avoid conflicts)
# Notifications router
try:
    app.include_router(notifications_router)
    logger.info("✅ Notifications router included")
except Exception as e:
    logger.error(f"❌ Failed to include notifications router: {e}")

# Communications (club notifications) and room booking router
try:
    from club_notifications_and_rooms import router as comms_router
    app.include_router(comms_router)
    logger.info("✅ Communications router included")
except Exception as e:
    logger.error(f"❌ Failed to include communications router: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware - added after CORS middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time_module.time()
    method = request.method
    url = request.url.path
    
    # Log the incoming request with more visibility
    print("\n" + "="*50, flush=True)
    print(f"🚀 INCOMING REQUEST: {method} {url}", flush=True)
    print(f"📅 TIME: {datetime.now().strftime('%H:%M:%S')}", flush=True)
    print(f"🔍 QUERY PARAMS: {request.query_params}", flush=True)
    print("="*50 + "\n", flush=True)
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time_module.time() - start_time
    
    # Log the request details with high visibility
    print("\n" + "*"*50, flush=True)
    print(f"✅ COMPLETED: {method} {url}", flush=True)
    print(f"🔢 STATUS: {response.status_code}", flush=True)
    print(f"⏱️ DURATION: {process_time:.4f}s", flush=True)
    print("*"*50 + "\n", flush=True)
    
    # Also log to the logger for file logging if configured
    logger.info(f"API CALL: {method} {url} - Status: {response.status_code} - Time: {process_time:.4f}s")
    
    return response

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Campus Connect API is ready!")
    logger.info("API calls will now be logged in the terminal")
    logger.info("Access API docs at: http://localhost:8000/docs")

# Simple health endpoint to verify service and DB connectivity
@app.get("/health")
async def health():
    print("🏥 Health endpoint called!", flush=True)
    logger.info("🏥 Health endpoint accessed")
    db_ok = False
    try:
        # Test database connection directly
        connection = get_mysql_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        db_ok = True
        cursor.close()
        connection.close()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_ok = False
    return {"status": "ok", "db": db_ok}

# Test endpoint to verify logging
@app.get("/test-logging")
async def test_logging():
    logger.info("🧪 Test logging endpoint called!")
    return {"message": "Logging test successful!", "timestamp": datetime.now().isoformat()}

# Debug endpoint to check user memberships
@app.get("/debug/user-memberships")
async def debug_user_memberships(current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        debug_info = {
            "user_id": current_user["id"],
            "user_role": current_user.get("role"),
            "club_memberships": [],
            "organization_memberships": [],
            "available_tables": []
        }
        
        # Check available tables
        cursor.execute("SHOW TABLES")
        tables = [table[list(table.keys())[0]] for table in cursor.fetchall()]
        debug_info["available_tables"] = tables
        
        # Check club memberships if table exists
        if "club_memberships" in tables:
            cursor.execute("SELECT * FROM club_memberships WHERE user_id = %s", (current_user["id"],))
            debug_info["club_memberships"] = cursor.fetchall()
        
        # Check organization memberships if table exists
        if "organization_memberships" in tables:
            cursor.execute("SELECT * FROM organization_memberships WHERE user_id = %s", (current_user["id"],))
            debug_info["organization_memberships"] = cursor.fetchall()
            
        return debug_info
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# Test AI recommendations endpoint
@app.get("/test-ai-recommendations")
async def test_ai_recommendations(current_user = Depends(auth.get_current_user)):
    try:
        from ai_recommender import club_recommender, UserProfile
        
        # Create a test user profile
        user_profile = UserProfile(
            interests=["technology", "programming", "artificial intelligence"],
            skills=["python", "javascript", "machine learning"],
            year_of_study=2,
            department="Computer Science",
            preferred_activities=["coding", "hackathons", "workshops"],
            time_commitment="high",
            leadership_interest=True
        )
        
        recommendations = club_recommender.recommend_clubs(user_profile, top_k=5)
        
        return {
            "message": "AI recommendations test successful!",
            "user_profile": user_profile.dict(),
            "recommendations": recommendations,
            "total_recommendations": len(recommendations)
        }
        
    except Exception as e:
        return {"error": f"AI recommendation test failed: {str(e)}", "traceback": traceback.format_exc()}

# ============================================================================
# ENHANCED CANTEEN PAYMENT SYSTEM
# ============================================================================

def _ensure_canteen_tables(cursor):
    """Ensure canteen tables exist with proper schema"""
    # Create canteen_orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS canteen_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'cash',
            payment_status VARCHAR(50) DEFAULT 'pending',
            status VARCHAR(50) DEFAULT 'queued',
            qr_token VARCHAR(100) UNIQUE,
            order_token VARCHAR(100) UNIQUE,
            transaction_id VARCHAR(100),
            payment_details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_order_token (order_token),
            INDEX idx_qr_token (qr_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Add missing columns to existing canteen_orders table
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN status VARCHAR(50) DEFAULT 'queued'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN qr_token VARCHAR(100) UNIQUE")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN order_token VARCHAR(100) UNIQUE")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN transaction_id VARCHAR(100)")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN payment_details TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    except Exception:
        pass

    # Create canteen_order_items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS canteen_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            item_id VARCHAR(100),
            item_name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE,
            INDEX idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

@app.post("/canteen/order")
async def place_canteen_order(order_data: dict, current_user=Depends(auth.get_current_user)):
    """Place a canteen order directly (for canteen-enhanced frontend)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")

    items = order_data.get("items", [])
    special_instructions = order_data.get("special_instructions", "")

    if not items:
        raise HTTPException(status_code=400, detail="No items in order")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)

        # Calculate total
        total_amount = sum(float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in items)

        # Generate tokens
        import uuid
        from secrets import token_hex
        order_token = str(uuid.uuid4())
        qr_token = token_hex(16)

        # Create order
        cursor.execute("""
            INSERT INTO canteen_orders (user_id, total_amount, payment_method, payment_status, status, qr_token, order_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (current_user["id"], total_amount, "cash", "pending_at_counter", "queued", qr_token, order_token))

        order_id = cursor.lastrowid

        # Insert order items
        for item in items:
            cursor.execute("""
                INSERT INTO canteen_order_items (order_id, item_id, item_name, price, quantity)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, str(item.get("menu_item_id", "")), item.get("name", ""),
                  float(item.get("price", 0)), int(item.get("quantity", 1))))

        connection.commit()

        return {
            "order_id": order_id,
            "order_token": order_token,
            "qr_token": qr_token,
            "total_amount": total_amount,
            "status": "queued",
            "message": "Order placed successfully. Show QR code at counter to pay."
        }

    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/canteen/payment/initiate")
async def initiate_payment(payload: dict, current_user = Depends(auth.get_current_user)):
    """Initiate payment process - either online or generate QR for pay later"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    items = payload.get("items", [])
    total_amount = payload.get("total_amount", 0)
    payment_method = payload.get("payment_method", "pay_later")  # pay_now or pay_later
    
    if not items or total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order data")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Generate unique order token
        order_token = str(uuid.uuid4())
        qr_token = token_hex(16)
        
        # Create order with pending status
        payment_status = "pending" if payment_method == "pay_now" else "pending_at_counter"
        order_status = "payment_pending" if payment_method == "pay_now" else "queued"
        
        cursor.execute("""
            INSERT INTO canteen_orders (user_id, total_amount, payment_method, payment_status, status, qr_token, order_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (current_user["id"], total_amount, payment_method, payment_status, order_status, qr_token, order_token))
        
        order_id = cursor.lastrowid
        
        # Insert order items
        for item in items:
            cursor.execute("""
                INSERT INTO canteen_order_items (order_id, item_id, item_name, price, quantity)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, str(item.get("id", "")), item.get("name", ""), 
                  float(item.get("price", 0)), int(item.get("quantity", 1))))
        
        connection.commit()
        
        # Generate QR code data
        qr_data = f"CANTEEN_ORDER_{qr_token}_{order_id}"
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_data}"
        
        response_data = {
            "order_id": order_id,
            "order_token": order_token,
            "qr_token": qr_token,
            "qr_url": qr_url,
            "qr_data": qr_data,
            "payment_method": payment_method,
            "payment_status": payment_status,
            "total_amount": total_amount,
            "items": items
        }
        
        if payment_method == "pay_now":
            # Generate payment gateway URL (mock implementation)
            payment_url = f"/dashboard/student/canteen/payment/gateway?order_token={order_token}&amount={total_amount}"
            response_data["payment_url"] = payment_url
            response_data["message"] = "Redirect to payment gateway"
        else:
            response_data["message"] = "QR code generated for pay-at-counter"
        
        return response_data
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/payment/gateway")
async def payment_gateway(order_token: str, amount: float):
    """Mock payment gateway interface"""
    return {
        "payment_gateway": "Mock Payment Gateway",
        "order_token": order_token,
        "amount": amount,
        "payment_methods": ["Credit Card", "Debit Card", "UPI", "Net Banking"],
        "redirect_url": f"/canteen/payment/success?order_token={order_token}"
    }

@app.post("/canteen/payment/process")
async def process_payment(payload: dict, current_user = Depends(auth.get_current_user)):
    """Process online payment (mock implementation)"""
    order_token = payload.get("order_token")
    payment_method_type = payload.get("payment_method_type", "credit_card")
    payment_details = payload.get("payment_details", {})
    
    if not order_token:
        raise HTTPException(status_code=400, detail="Order token required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Find order by token
        cursor.execute("SELECT * FROM canteen_orders WHERE order_token = %s AND user_id = %s", 
                      (order_token, current_user["id"]))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["payment_status"] == "paid":
            raise HTTPException(status_code=400, detail="Order already paid")
        
        # Mock payment processing (in real implementation, integrate with payment gateway)
        payment_success = True  # Simulate successful payment
        transaction_id = f"TXN_{token_hex(8)}"
        
        if payment_success:
            # Update order status
            cursor.execute("""
                UPDATE canteen_orders 
                SET payment_status = 'paid', status = 'queued', payment_details = %s, transaction_id = %s
                WHERE id = %s
            """, (str(payment_details), transaction_id, order["id"]))
            connection.commit()
            
            # Generate pickup QR code
            qr_data = f"CANTEEN_PICKUP_{order['qr_token']}_{order['id']}"
            qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_data}"
            
            return {
                "success": True,
                "message": "Payment successful!",
                "order_id": order["id"],
                "transaction_id": transaction_id,
                "qr_token": order["qr_token"],
                "qr_url": qr_url,
                "qr_data": qr_data,
                "pickup_instructions": "Show this QR code at the canteen counter for pickup"
            }
        else:
            return {
                "success": False,
                "message": "Payment failed. Please try again."
            }
            
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/order/{order_id}/status")
async def get_order_status(order_id: int, current_user = Depends(auth.get_current_user)):
    """Get order status and details"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get order details
        cursor.execute("""
            SELECT o.*, u.full_name as customer_name 
            FROM canteen_orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = %s AND (o.user_id = %s OR %s IN ('admin', 'faculty', 'organization'))
        """, (order_id, current_user["id"], current_user.get("role", "")))
        
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get order items
        cursor.execute("SELECT * FROM canteen_order_items WHERE order_id = %s", (order_id,))
        items = cursor.fetchall()
        
        # Generate QR code based on payment status
        if order["payment_status"] == "paid":
            qr_data = f"CANTEEN_PICKUP_{order['qr_token']}_{order_id}"
            qr_message = "Show this QR code for pickup"
        else:
            qr_data = f"CANTEEN_PAY_{order['qr_token']}_{order_id}"
            qr_message = "Show this QR code to pay at counter"
        
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_data}"
        
        return {
            "order": order,
            "items": items,
            "qr_url": qr_url,
            "qr_data": qr_data,
            "qr_message": qr_message
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

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

# Routers have been moved to the top after app creation

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add simple logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        start_time = time_module.time()
        
        # Log the incoming request
        print(f"🚀 {request.method} {request.url.path}", flush=True)
        
        # Process the request
        response = await call_next(request)
        
        # Log the response
        process_time = time_module.time() - start_time
        status_emoji = "✅" if response.status_code < 400 else "❌"
        print(f"{status_emoji} {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s", flush=True)
        
        return response
    except Exception as e:
        logger.error(f"❌ Middleware error: {e}")
        # Re-raise the exception to let FastAPI handle it
        raise

print("Simple request logging middleware registered!", flush=True)

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
    # The notifications table already exists with a different structure
    # We'll work with the existing structure: [id, user_id, title, message, type, is_read, priority, created_at, expires_at, club_id]
    # Just ensure notification_recipients table exists for compatibility
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
    # Use existing notifications table structure: user_id, title, message, type, priority, expires_at
    # Map category to type, and use created_by as user_id for now
    cursor.execute(
        """
        INSERT INTO notifications (user_id, title, message, type, priority)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (created_by, title, message, category, priority)
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

# Ensure organization applications table exists
def _ensure_org_applications(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS organization_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NOT NULL,
          user_id INT NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          batch VARCHAR(50),
          year_of_study VARCHAR(50),
          sap_id VARCHAR(50),
          department_to_join VARCHAR(255),
          why_join TEXT,
          what_contribute TEXT,
          can_stay_longer_hours BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'pending',
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME NULL,
          reviewed_by INT NULL,
          FOREIGN KEY (organization_id) REFERENCES organization_details(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_org_app_org (organization_id),
          INDEX idx_org_app_user (user_id),
          INDEX idx_org_app_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

# Check if a column exists in a table
def _has_column(cursor, table_name: str, column_name: str) -> bool:
    try:
        cursor.execute(
            """
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = %s AND column_name = %s
            LIMIT 1
            """,
            (table_name, column_name)
        )
        return cursor.fetchone() is not None
    except Exception:
        return False

# Ensure users table has course and semester columns
def _ensure_user_course_semester(cursor):
    # Add columns at the end if missing (avoid AFTER dependency order)
    try:
        if not _has_column(cursor, 'users', 'course'):
            cursor.execute("ALTER TABLE users ADD COLUMN course VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'semester'):
            cursor.execute("ALTER TABLE users ADD COLUMN semester INT NULL")
    except Exception:
        pass

# Ensure users table has preferences json columns
def _ensure_user_preferences(cursor):
    try:
        if not _has_column(cursor, 'users', 'interests_json'):
            cursor.execute("ALTER TABLE users ADD COLUMN interests_json TEXT NULL AFTER bio")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'skills_json'):
            cursor.execute("ALTER TABLE users ADD COLUMN skills_json TEXT NULL AFTER interests_json")
    except Exception:
        pass

# Ensure college_id column supports up to 15 chars
def _ensure_user_college_id_text(cursor):
    try:
        # Try to modify to VARCHAR(15) if not already
        cursor.execute("ALTER TABLE users MODIFY COLUMN college_id VARCHAR(15) NULL")
    except Exception:
        # If column doesn't exist, add it
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN college_id VARCHAR(15) NULL")
        except Exception:
            pass

# Ensure all columns used in /auth/register exist to avoid 42S22 errors
def _ensure_user_register_columns(cursor):
    try:
        if not _has_column(cursor, 'users', 'student_id'):
            cursor.execute("ALTER TABLE users ADD COLUMN student_id VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'branch'):
            cursor.execute("ALTER TABLE users ADD COLUMN branch VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'academic_year'):
            cursor.execute("ALTER TABLE users ADD COLUMN academic_year VARCHAR(20) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'batch'):
            cursor.execute("ALTER TABLE users ADD COLUMN batch VARCHAR(50) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'employee_id'):
            cursor.execute("ALTER TABLE users ADD COLUMN employee_id VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'designation'):
            cursor.execute("ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'specialization'):
            cursor.execute("ALTER TABLE users ADD COLUMN specialization VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'organization_type'):
            cursor.execute("ALTER TABLE users ADD COLUMN organization_type VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'department'):
            cursor.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'bio'):
            cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'phone_number'):
            cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30) NULL")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'is_active'):
            cursor.execute("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1")
    except Exception:
        pass
    try:
        if not _has_column(cursor, 'users', 'is_verified'):
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0")
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
        
        # Ensure columns exist to avoid 42S22 errors
        _ensure_user_register_columns(cursor)
        _ensure_user_course_semester(cursor)
        _ensure_user_college_id_text(cursor)
        connection.commit()

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
            user.role.value, user.college_id, user.student_id, user.course,
            user.branch, user.semester, user.academic_year, user.batch,
            user.employee_id, user.designation, user.specialization,
            user.organization_type, user.department, user.bio,
            user.phone_number, True, False
        ))
        
        connection.commit()
        user_id = cursor.lastrowid
        
        # Optionally store interests/skills JSON
        try:
            _ensure_user_preferences(cursor)
            import json as _json
            interests_json = _json.dumps(user.interests or [])
            skills_json = _json.dumps(user.skills or [])
            cursor.execute("UPDATE users SET interests_json = %s, skills_json = %s WHERE id = %s", (interests_json, skills_json, user_id))
            connection.commit()
        except Exception:
            pass

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
        
        # Generate AI club recommendations for new users with interests/skills
        recommendations = []
        if user.role == "student" and (user.interests or user.skills):
            try:
                from ai_recommender import club_recommender, UserProfile
                user_profile = UserProfile(
                    interests=user.interests or [],
                    skills=user.skills or [],
                    year_of_study=int(user.semester) if user.semester and user.semester.isdigit() else 1,
                    department=user.department or "General",
                    preferred_activities=user.interests or [],
                    time_commitment="medium",
                    leadership_interest=False
                )
                recommendations = club_recommender.recommend_clubs(user_profile, top_k=5)
                logger.info(f"✨ Generated {len(recommendations)} AI club recommendations for new user {user.username}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to generate AI recommendations for new user: {e}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user,
            "ai_recommendations": recommendations
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

@app.get("/users/{user_id}/details")
async def get_user_details(user_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, email, role, course, semester, department, bio, phone_number, interests_json, skills_json FROM users WHERE id = %s", (user_id,))
        u = cursor.fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        # Parse json
        import json as _json
        interests = []
        skills_free = []
        try:
            if u.get("interests_json"):
                interests = _json.loads(u.get("interests_json") or "[]")
        except Exception:
            interests = []
        try:
            if u.get("skills_json"):
                skills_free = _json.loads(u.get("skills_json") or "[]")
        except Exception:
            skills_free = []
        # Structured skills from student_skills if exists
        detailed_skills = []
        try:
            cursor.execute(
                """
                SELECT ss.proficiency_level, s.name AS skill_name, s.category
                FROM student_skills ss JOIN skills s ON ss.skill_id = s.id
                WHERE ss.student_id = %s
                ORDER BY ss.proficiency_level DESC
                """,
                (user_id,)
            )
            detailed_skills = cursor.fetchall() or []
        except Exception:
            detailed_skills = []
        # If no detailed skills, map free skills into objects
        if not detailed_skills and skills_free:
            detailed_skills = [{"skill_name": sk, "category": "", "proficiency_level": ""} for sk in skills_free]
        # Build response
        return {
            "user": {
                "id": u["id"],
                "full_name": u.get("full_name"),
                "email": u.get("email"),
                "role": u.get("role"),
                "course": u.get("course"),
                "semester": u.get("semester"),
                "department": u.get("department"),
                "bio": u.get("bio"),
                "phone_number": u.get("phone_number"),
            },
            "interests": interests,
            "skills": detailed_skills,
        }
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

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
# CLUBS ENDPOINTS (Replacing Organizations)
# ============================================================================

async def get_all_clubs(current_user):
    """Get all clubs with basic information for listing"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
        
        # Check which table to use
        def table_exists(name: str) -> bool:
            cursor.execute("SHOW TABLES LIKE %s", (name,))
            return cursor.fetchone() is not None
        
        if table_exists("clubs"):
            # Get clubs with basic information
            cursor.execute(
                """
                SELECT c.*, 
                       COUNT(DISTINCT cm.user_id) as member_count
                FROM clubs c
                LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.status = 'approved'
                WHERE c.is_active = TRUE
                GROUP BY c.id
                ORDER BY c.name
                """,
            )
            clubs = cursor.fetchall()
            
            # Add compatibility fields and membership status for current user
            for club in clubs:
                # Add organization_name for compatibility
                club["organization_name"] = club.get("name")
                
                try:
                    cursor.execute(
                        "SELECT status FROM club_memberships WHERE club_id = %s AND user_id = %s",
                        (club["id"], user_id)
                    )
                    membership = cursor.fetchone()
                    club["membership_status"] = membership.get("status") if membership else None
                    club["is_member"] = club["membership_status"] in ("member", "approved", "active") if club["membership_status"] else False
                except Exception:
                    club["membership_status"] = None
                    club["is_member"] = False
            
            return clubs
        else:
            # Fallback to organization_details
            cursor.execute(
                """
                SELECT od.*, 
                       COUNT(DISTINCT om.user_id) as member_count
                FROM organization_details od
                LEFT JOIN organization_memberships om ON od.id = om.organization_id AND om.status = 'approved'
                WHERE od.is_active = TRUE
                GROUP BY od.id
                ORDER BY od.organization_name
                """
            )
            orgs = cursor.fetchall()
            
            # Add membership status for current user
            for org in orgs:
                try:
                    cursor.execute(
                        "SELECT status FROM organization_memberships WHERE organization_id = %s AND user_id = %s",
                        (org["id"], user_id)
                    )
                    membership = cursor.fetchone()
                    org["membership_status"] = membership.get("status") if membership else None
                    org["is_member"] = org["membership_status"] in ("member", "approved", "active") if org["membership_status"] else False
                except Exception:
                    org["membership_status"] = None
                    org["is_member"] = False
            
            return orgs
            
    except Exception as e:
        print(f"Error in get_all_clubs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get clubs: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/clubs")
async def list_clubs(current_user = Depends(auth.get_current_user)):
    """Get all clubs - primary endpoint"""
    return await get_all_clubs(current_user)

@app.get("/clubs/public")
async def list_clubs_public():
    """Get all clubs without authentication for testing"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT c.*, 
                   COUNT(DISTINCT cm.user_id) as member_count
            FROM clubs c
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.status = 'approved'
            WHERE c.is_active = TRUE
            GROUP BY c.id
            ORDER BY c.name
            """
        )
        clubs = cursor.fetchall()
        
        # Add compatibility fields
        for club in clubs:
            club["organization_name"] = club.get("name")
            club["membership_status"] = None
            club["is_member"] = False
        
        return {"clubs": clubs, "count": len(clubs)}
        
    except Exception as e:
        return {"error": str(e), "clubs": [], "count": 0}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_detailed_clubs(current_user):
    """Get detailed clubs information with additional metadata"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
        
        # Check which table to use
        def table_exists(name: str) -> bool:
            cursor.execute("SHOW TABLES LIKE %s", (name,))
            return cursor.fetchone() is not None
        
        if table_exists("clubs"):
            # Get clubs with detailed information
            cursor.execute(
                """
                SELECT c.*, 
                       u.full_name as created_by_name,
                       COUNT(DISTINCT cm.user_id) as member_count
                FROM clubs c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.status = 'approved'
                WHERE (c.college_id = %s OR %s IS NULL) AND c.is_active = TRUE
                GROUP BY c.id
                ORDER BY c.name
                """,
                (college_id, college_id)
            )
            clubs = cursor.fetchall()
            
            # Add membership status for current user
            for club in clubs:
                # Add organization_name for compatibility
                club["organization_name"] = club.get("name")
                
                try:
                    cursor.execute(
                        "SELECT status FROM club_memberships WHERE club_id = %s AND user_id = %s",
                        (club["id"], user_id)
                    )
                    membership = cursor.fetchone()
                    club["membership_status"] = membership.get("status") if membership else None
                    club["is_member"] = club["membership_status"] in ("member", "approved", "active") if club["membership_status"] else False
                except Exception:
                    club["membership_status"] = None
                    club["is_member"] = False
            
            return clubs
        else:
            # Fallback to organization_details
            cursor.execute(
                """
                SELECT od.*, 
                       u.full_name as created_by_name,
                       COUNT(DISTINCT om.user_id) as member_count
                FROM organization_details od
                LEFT JOIN users u ON od.user_id = u.id
                LEFT JOIN organization_memberships om ON od.id = om.organization_id AND om.status = 'approved'
                WHERE od.is_active = TRUE
                GROUP BY od.id
                ORDER BY od.organization_name
                """
            )
            orgs = cursor.fetchall()
            
            # Add membership status for current user
            for org in orgs:
                try:
                    cursor.execute(
                        "SELECT status FROM organization_memberships WHERE organization_id = %s AND user_id = %s",
                        (org["id"], user_id)
                    )
                    membership = cursor.fetchone()
                    org["membership_status"] = membership.get("status") if membership else None
                    org["is_member"] = org["membership_status"] in ("member", "approved", "active") if org["membership_status"] else False
                except Exception:
                    org["membership_status"] = None
                    org["is_member"] = False
            
            return orgs
            
    except Exception as e:
        print(f"Error in get_detailed_clubs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get detailed clubs: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/organizations/detailed")
async def organizations_detailed_alias(current_user = Depends(auth.get_current_user)):
    """Alias: return detailed clubs as organizations"""
    return await get_detailed_clubs(current_user)

@app.get("/clubs/detailed")
async def clubs_detailed(current_user = Depends(auth.get_current_user)):
    """Get detailed clubs information"""
    return await get_detailed_clubs(current_user)

@app.post("/organizations/{org_id}/join")
async def join_organization_alias(org_id: int, current_user = Depends(auth.get_current_user)):
    """Alias: join club through organizations endpoint"""
    return await join_club_simple(org_id, current_user)

@app.post("/clubs/{club_id}/join")
async def join_club(club_id: int, current_user = Depends(auth.get_current_user)):
    """Join a club - primary endpoint"""
    return await join_club_simple(club_id, current_user)

@app.get("/organizations/mine")
async def my_organization_alias(current_user = Depends(auth.get_current_user)):
    """Alias: get managed clubs as organizations"""
    return await get_my_managed_clubs(current_user)

@app.get("/clubs/mine")
async def my_managed_clubs(current_user = Depends(auth.get_current_user)):
    """Get clubs managed by current user"""
    return await get_my_managed_clubs(current_user)

@app.get("/organizations/mine/members")
async def my_org_members_alias(
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    """Get all members/applications from organizations managed by current user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get all clubs managed by current user
        cursor.execute(
            "SELECT id FROM clubs WHERE created_by = %s",
            (current_user["id"],)
        )
        managed_clubs = cursor.fetchall()
        
        if not managed_clubs:
            return []
        
        club_ids = [club["id"] for club in managed_clubs]
        placeholders = ",".join(["%s"] * len(club_ids))
        
        # Filter by status if provided  
        status_filter = ""
        params = list(club_ids)
        if status:
            # Map frontend status names to backend status names
            status_list = []
            for s in status.split(","):
                s = s.strip()
                if s in ["active", "member"]:
                    status_list.append("approved")
                elif s == "pending":
                    status_list.append("pending")
                elif s == "rejected":
                    status_list.append("rejected")
                else:
                    status_list.append(s)  # Use as-is for other statuses
            
            status_filter = " AND cm.status IN (%s)" % ",".join(["%s"] * len(status_list))
            params.extend(status_list)
        
        # Get all applications from both tables
        applications = []
        
        # From club_memberships table
        query = f"""
            SELECT cm.id as application_id, cm.club_id, cm.status, cm.joined_at, cm.application_message,
                   u.id, u.full_name, u.email, u.course, u.semester, u.phone_number,
                   c.name as club_name, 'club_membership' as application_type
            FROM club_memberships cm
            JOIN users u ON cm.user_id = u.id
            JOIN clubs c ON cm.club_id = c.id
            WHERE cm.club_id IN ({placeholders}) {status_filter}
            ORDER BY cm.joined_at DESC
        """
        cursor.execute(query, params)
        club_apps = cursor.fetchall()
        applications.extend(club_apps)
        
        # From organization_applications table
        query = f"""
            SELECT oa.*, 
                   oa.full_name,  -- Use application form name
                   u.email, 
                   oa.batch as course,  -- Use application batch as course
                   oa.year_of_study as semester,  -- Use application year as semester
                   u.phone_number, 
                   u.id as user_id,
                   c.name as club_name, 
                   'organization_application' as application_type,
                   oa.created_at as joined_at
            FROM organization_applications oa
            JOIN users u ON oa.user_id = u.id
            JOIN clubs c ON oa.club_id = c.id
            WHERE oa.club_id IN ({placeholders}) {status_filter.replace('cm.status', 'oa.status')}
            ORDER BY oa.created_at DESC
        """
        cursor.execute(query, params)
        org_apps = cursor.fetchall()
        applications.extend(org_apps)
        
        # Sort all applications by date
        applications.sort(key=lambda x: x['joined_at'], reverse=True)
        
        return applications
    except mysql.connector.Error as e:
        return {"error": str(e), "applications": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/clubs/mine/members")
async def my_club_members(
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    """Get members of all clubs managed by current user"""
    # This endpoint returns members from all managed clubs
    # For specific club, use /clubs/{club_id}/members
    return []

@app.get("/organizations/{org_id}/members")
async def organization_members_alias(
    org_id: int,
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    """Alias: get club members through organizations endpoint"""
    return await get_club_members(org_id, status, current_user)

@app.get("/clubs/{club_id}/members")
async def club_members(
    club_id: int,
    status: Optional[str] = Query(None, description="Comma-separated statuses to include"),
    current_user = Depends(auth.get_current_user)
):
    """Get members of a specific club"""
    return await get_club_members(club_id, status, current_user)

@app.post("/organizations/members/{user_id}/status")
async def update_member_status_alias(user_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    """Alias: update club member status through organizations endpoint"""
    return await update_member_status(user_id, payload, current_user)

@app.post("/clubs/members/{user_id}/status")
async def update_club_member_status(user_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    """Update a member's status in clubs"""
    return await update_member_status(user_id, payload, current_user)

@app.get("/organizations/mine/stats")
async def my_org_stats_alias(current_user = Depends(auth.get_current_user)):
    """Alias: get club stats through organizations endpoint"""
    return await get_my_club_stats(current_user)

@app.get("/clubs/mine/stats")
async def my_club_stats(current_user = Depends(auth.get_current_user)):
    """Get statistics for clubs managed by current user"""
    return await get_my_club_stats(current_user)

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

@app.post("/admin/migrate-organization-names")
async def migrate_organization_names(current_user = Depends(auth.get_current_user)):
    """Admin endpoint to migrate organization names to club names"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get clubs and organizations
        cursor.execute("SELECT id, name, category FROM clubs ORDER BY id LIMIT 20")
        clubs = cursor.fetchall()
        
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id LIMIT 20")
        orgs = cursor.fetchall()
        
        if not clubs or not orgs:
            return {"success": False, "message": "No clubs or organizations found"}
        
        # Perform migration
        updates = []
        for i, org in enumerate(orgs):
            if i < len(clubs):
                club = clubs[i]
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (club['name'], club.get('category', 'General'), org['id'])
                )
                updates.append(f"{org['organization_name']} → {club['name']}")
        
        connection.commit()
        
        return {
            "success": True,
            "message": f"Successfully migrated {len(updates)} organizations",
            "updates": updates
        }
        
    except mysql.connector.Error as e:
        return {"success": False, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Maintenance endpoint: backfill student course and semester
@app.post("/admin/backfill-students-course-semester")
async def backfill_students_course_semester(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_user_course_semester(cursor)
        # Assign courses in a simple round-robin based on id
        cursor.execute(
            """
            UPDATE users SET course = CASE (id % 3)
              WHEN 0 THEN 'MBA TECH'
              WHEN 1 THEN 'B TECH CE'
              ELSE 'B TECH AIDS' END
            WHERE role = 'student' AND (course IS NULL OR course = '')
            """
        )
        affected_course = cursor.rowcount
        # Assign semesters in a simple round-robin among 1,3,5,7
        cursor.execute(
            """
            UPDATE users SET semester = CASE (id % 4)
              WHEN 0 THEN 1
              WHEN 1 THEN 3
              WHEN 2 THEN 5
              ELSE 7 END
            WHERE role = 'student' AND (semester IS NULL OR semester = 0)
            """
        )
        affected_sem = cursor.rowcount
        connection.commit()
        return {"status": "ok", "updated_course": affected_course, "updated_semester": affected_sem}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/clubs")
async def get_clubs_main(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get clubs for the current user's college - main endpoint"""
    return await get_all_clubs(current_user)

@app.get("/clubs/search")
async def search_clubs_endpoint(
    query: str = "",
    category: str = "",
    current_user = Depends(auth.get_current_user)
):
    """Search and filter clubs"""
    return await search_clubs(current_user, query, category)

@app.get("/clubs/categories")
async def get_club_categories_endpoint():
    """Get all available club categories"""
    return get_club_categories()

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

@app.get("/organizations/my")
async def my_organizations_alias(current_user = Depends(auth.get_current_user)):
    """Alias: get user's clubs as organizations"""
    return await get_my_clubs(current_user)

@app.get("/clubs/my")
async def my_clubs(current_user = Depends(auth.get_current_user)):
    """Get clubs the current user is a member of"""
    return await get_my_clubs(current_user)

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

            # Notify organization members about the new event
            try:
                # Get organization members
                cursor.execute(
                    """
                    SELECT u.id, u.full_name
                    FROM organization_memberships om
                    JOIN users u ON om.user_id = u.id
                    WHERE om.organization_id = (
                        SELECT od.id FROM organization_details od WHERE od.user_id = %s
                    ) AND om.status IN ('member', 'active', 'approved')
                    """,
                    (current_user["id"],)
                )
                members = cursor.fetchall()
                if members:
                    title = f"New Event: {event_data.title}"
                    message = f"Your organization has scheduled a new event: {event_data.title} on {event['event_date']} at {event_data.start_time.split('T')[1][:5] if 'T' in event_data.start_time else event_data.start_time}"
                    for member in members:
                        _notify_user(cursor, member["id"], title, message, category='event', created_by=current_user["id"])
                    connection.commit()
            except Exception as e:
                logger.warning(f"Failed to notify organization members about event: {e}")

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
          status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, preparing, ready, served, cancelled, payment_pending
          qr_token VARCHAR(64) NOT NULL,
          order_token VARCHAR(64),
          transaction_id VARCHAR(100),
          payment_details TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_qr_token (qr_token),
          INDEX idx_status (status),
          INDEX idx_order_token (order_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    # Add missing columns to existing canteen_orders table
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'queued'")
    except Exception:
        pass  # Column might already exist
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN order_token VARCHAR(64)")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN transaction_id VARCHAR(100)")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN payment_details TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD UNIQUE KEY uq_qr_token (qr_token)")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD INDEX idx_status (status)")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE canteen_orders ADD INDEX idx_order_token (order_token)")
    except Exception:
        pass

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
    # Ensure canteen menu items table exists
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS canteen_menu_items (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(200) NOT NULL,
              description TEXT NULL,
              price DECIMAL(10,2) NOT NULL DEFAULT 0,
              category VARCHAR(100) NOT NULL DEFAULT 'General',
              is_vegetarian TINYINT(1) NOT NULL DEFAULT 0,
              is_available TINYINT(1) NOT NULL DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
    except Exception:
        pass
    # Ensure canteen menu assets (binary uploads)
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS canteen_menu_assets (
              id INT AUTO_INCREMENT PRIMARY KEY,
              file_name VARCHAR(255) NOT NULL,
              mime_type VARCHAR(100) NOT NULL,
              content LONGBLOB NOT NULL,
              uploaded_by INT NOT NULL,
              active TINYINT(1) NOT NULL DEFAULT 1,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
    except Exception:
        pass

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
        order_token = token_hex(16)  # Generate order token for payment processing
        cursor.execute(
            """
            INSERT INTO canteen_orders (user_id, total_amount, payment_method, payment_status, status, qr_token, order_token)
            VALUES (%s, %s, %s, %s, 'queued', %s, %s)
            """,
            (current_user["id"], total_amount, payment_method, payment_status, qr, order_token)
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
        return {
            "order_id": order_id, 
            "qr_token": qr, 
            "order_token": order_token,  # Return order token for payment
            "qr_url": qr_url, 
            "status": "queued", 
            "payment_status": payment_status
        }
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


@app.get("/canteen/staff/orders")
async def get_staff_canteen_orders(
    payment_status: Optional[str] = None,
    current_user = Depends(auth.get_current_user)
):
    """Get all paid canteen orders for staff verification - visible to staff/faculty/admin/organization"""
    # Only staff can view all orders
    if current_user.get("role") not in ["admin", "faculty", "organization", "staff", "canteen_staff"]:
        raise HTTPException(status_code=403, detail="Staff only - requires staff, faculty, admin, or organization role")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Get orders with user details
        sql = """
            SELECT co.*, 
                   u.full_name as student_name, 
                   u.email as student_email,
                   u.student_id
            FROM canteen_orders co
            LEFT JOIN users u ON co.user_id = u.id
            WHERE 1=1
        """
        params: List = []
        
        # Filter by payment status if provided
        if payment_status:
            sql += " AND co.payment_status = %s"
            params.append(payment_status)
        else:
            # By default, show only paid orders that need verification
            sql += " AND co.payment_status = 'paid'"
        
        sql += " ORDER BY co.id DESC LIMIT 500"
        
        cursor.execute(sql, tuple(params))
        orders = cursor.fetchall()
        
        # Get order items for each order
        for order in orders:
            cursor.execute(
                """
                SELECT * FROM canteen_order_items 
                WHERE order_id = %s
                """,
                (order['id'],)
            )
            order['items'] = cursor.fetchall()
        
        return {"orders": orders, "total": len(orders)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/canteen/orders/{order_id}/status")
async def canteen_update_status(order_id: int, payload: dict, current_user = Depends(auth.get_current_user)):
    # Allow staff to update order status
    if current_user.get("role") not in ["admin", "faculty", "organization", "staff", "canteen_staff"]:
        raise HTTPException(status_code=403, detail="Staff access required")
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
    """Enhanced canteen QR scanning for payment and pickup"""
    # Allow canteen staff
    if current_user.get("role") not in ["admin", "faculty", "organization", "staff", "canteen_staff"]:
        raise HTTPException(status_code=403, detail="Staff access required")
    
    qr_data = (payload or {}).get("qr_data") or (payload or {}).get("qr_token")
    if not qr_data:
        raise HTTPException(status_code=400, detail="QR data required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Parse QR data to understand the operation
        if qr_data.startswith("CANTEEN_PAY_"):
            # Pay Later - Process payment at counter
            qr_token = qr_data.replace("CANTEEN_PAY_", "").split("_")[0]
            cursor.execute("SELECT * FROM canteen_orders WHERE qr_token = %s", (qr_token,))
            order = cursor.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order["payment_status"] == "paid":
                return {"valid": False, "message": "Order already paid", "order": order}
            
            # Process payment at counter
            cursor.execute("""
                UPDATE canteen_orders 
                SET payment_status = 'paid', status = 'preparing', updated_at = NOW()
                WHERE id = %s
            """, (order["id"],))
            connection.commit()
            
            return {
                "valid": True, 
                "message": f"Payment received: ₹{order['total_amount']}. Order sent to kitchen.",
                "order_id": order["id"],
                "action": "payment_processed",
                "amount": order["total_amount"]
            }
            
        elif qr_data.startswith("CANTEEN_PICKUP_"):
            # Pickup - Order already paid online
            qr_token = qr_data.replace("CANTEEN_PICKUP_", "").split("_")[0]
            cursor.execute("SELECT * FROM canteen_orders WHERE qr_token = %s", (qr_token,))
            order = cursor.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order["payment_status"] != "paid":
                return {"valid": False, "message": "Payment not completed", "order": order}
            
            if order["status"] == "served":
                return {"valid": False, "message": "Order already served", "order": order}
            
            # Mark as served
            cursor.execute("""
                UPDATE canteen_orders 
                SET status = 'served', updated_at = NOW()
                WHERE id = %s
            """, (order["id"],))
            connection.commit()
            
            return {
                "valid": True,
                "message": "Order served successfully",
                "order_id": order["id"],
                "action": "order_served"
            }
            
        elif qr_data.startswith("CANTEEN_ORDER_"):
            # Legacy format - handle both payment and pickup
            qr_token = qr_data.replace("CANTEEN_ORDER_", "").split("_")[0]
            cursor.execute("SELECT * FROM canteen_orders WHERE qr_token = %s", (qr_token,))
            order = cursor.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order["status"] == "served":
                return {"valid": False, "message": "Order already served", "order": order}
            
            # Handle based on payment status
            if order["payment_status"] == "pending_at_counter":
                # Process payment first
                cursor.execute("""
                    UPDATE canteen_orders 
                    SET payment_status = 'paid', status = 'preparing', updated_at = NOW()
                    WHERE id = %s
                """, (order["id"],))
                connection.commit()
                
                return {
                    "valid": True,
                    "message": f"Payment received: ₹{order['total_amount']}. Order sent to kitchen.",
                    "order_id": order["id"],
                    "action": "payment_processed",
                    "amount": order["total_amount"]
                }
            else:
                # Mark as served
                cursor.execute("""
                    UPDATE canteen_orders 
                    SET status = 'served', payment_status = 'paid', updated_at = NOW()
                    WHERE id = %s
                """, (order["id"],))
                connection.commit()
                
                return {
                    "valid": True,
                    "message": "Order served successfully",
                    "order_id": order["id"],
                    "action": "order_served"
                }
        else:
            # Try to find by qr_token directly (fallback)
            cursor.execute("SELECT * FROM canteen_orders WHERE qr_token = %s", (qr_data,))
            order = cursor.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="Invalid QR code")
            
            # Legacy handling
            cursor.execute("""
                UPDATE canteen_orders 
                SET status = 'served', payment_status = 'paid', updated_at = NOW()
                WHERE id = %s
            """, (order["id"],))
            connection.commit()
            
            return {
                "valid": True,
                "message": "Order processed successfully",
                "order_id": order["id"],
                "action": "legacy_processed"
            }
            
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ============================================================================
# CANTEEN MANAGEMENT ENDPOINTS
# ============================================================================

from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse

@app.post("/canteen/menu/upload")
async def upload_canteen_menu(file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    """Upload canteen menu (image/pdf). Store content in DB and mark latest."""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin/faculty can upload menu")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        # Deactivate previous assets
        try:
            cursor.execute("UPDATE canteen_menu_assets SET active = 0 WHERE active = 1")
        except Exception:
            pass
        cursor.execute(
            """
            INSERT INTO canteen_menu_assets (file_name, mime_type, content, uploaded_by, active)
            VALUES (%s, %s, %s, %s, 1)
            """,
            (file.filename or 'menu', file.content_type or 'application/octet-stream', content, current_user["id"])
        )
        connection.commit()
        return {"id": cursor.lastrowid, "file_name": file.filename, "mime_type": file.content_type}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/menu/latest-asset")
async def get_latest_canteen_menu_asset(current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        cursor.execute("SELECT id, file_name, mime_type, created_at FROM canteen_menu_assets WHERE active = 1 ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        return {"asset": row}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/menu/assets/{asset_id}/content")
async def stream_canteen_menu_asset(asset_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor()
        _ensure_canteen_tables(cursor)
        cursor.execute("SELECT mime_type, content FROM canteen_menu_assets WHERE id = %s", (asset_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asset not found")
        mime, content = row
        return StreamingResponse(iter([content]), media_type=mime)
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/canteen/menu")
async def get_canteen_menu(db = Depends(get_db)):
    """Get canteen menu and include latest uploaded asset metadata if present"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        cursor.execute("SELECT * FROM canteen_menu_items WHERE is_available = TRUE ORDER BY category, name")
        menu_items = cursor.fetchall()
        # Group by category
        menu_by_category = {}
        for item in menu_items:
            category = item["category"]
            if category not in menu_by_category:
                menu_by_category[category] = []
            menu_by_category[category].append(item)
        # Latest active asset
        latest_asset = None
        try:
            cursor.execute("SELECT id, file_name, mime_type, created_at FROM canteen_menu_assets WHERE active = 1 ORDER BY created_at DESC LIMIT 1")
            latest_asset = cursor.fetchone()
        except Exception:
            latest_asset = None
        resp = {"menu": menu_by_category, "items": menu_items}
        if latest_asset:
            resp["latest_asset"] = latest_asset
        return resp
    except mysql.connector.Error as e:
        return {"menu": {}, "items": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/canteen/menu/categories")
async def get_menu_categories():
    """Get all available menu categories"""
    categories = [
        {"id": "breakfast", "name": "Breakfast", "icon": "☕", "description": "Morning meals and beverages"},
        {"id": "lunch", "name": "Lunch", "icon": "🍽️", "description": "Afternoon main courses"},
        {"id": "dinner", "name": "Dinner", "icon": "🌙", "description": "Evening meals"},
        {"id": "snacks", "name": "Snacks", "icon": "🍪", "description": "Light snacks and appetizers"},
        {"id": "beverages", "name": "Beverages", "icon": "🥤", "description": "Drinks and refreshments"},
        {"id": "desserts", "name": "Desserts", "icon": "🍰", "description": "Sweet treats and desserts"}
    ]
    return {"categories": categories}

@app.get("/canteen/menu/by-category/{category}")
async def get_menu_by_category(category: str):
    """Get menu items by specific category"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        cursor.execute(
            "SELECT * FROM canteen_menu_items WHERE category = %s AND is_available = TRUE ORDER BY name",
            (category,)
        )
        items = cursor.fetchall()
        
        return {"category": category, "items": items}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
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
        _ensure_canteen_tables(cursor)
        
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

@app.put("/canteen/menu/{item_id}")
async def update_menu_item(item_id: int, item_data: dict, current_user = Depends(auth.get_current_user)):
    """Update menu item (Admin only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can update menu items")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        allowed_fields = ['name', 'description', 'price', 'category', 'is_vegetarian', 'is_available']
        
        for field in allowed_fields:
            if field in item_data:
                update_fields.append(f"{field} = %s")
                update_values.append(item_data[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        update_values.append(item_id)
        query = f"UPDATE canteen_menu_items SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, update_values)
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        # Return updated item
        cursor.execute("SELECT * FROM canteen_menu_items WHERE id = %s", (item_id,))
        updated_item = cursor.fetchone()
        
        return {"message": "Menu item updated successfully", "item": updated_item}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.delete("/canteen/menu/{item_id}")
async def delete_menu_item(item_id: int, current_user = Depends(auth.get_current_user)):
    """Delete menu item (Admin only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can delete menu items")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        cursor.execute("DELETE FROM canteen_menu_items WHERE id = %s", (item_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        return {"message": "Menu item deleted successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.patch("/canteen/menu/{item_id}")
async def patch_menu_item(item_id: int, update_data: dict, current_user = Depends(auth.get_current_user)):
    """Patch/update specific fields of a menu item (Admin/Faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin and faculty can update menu items")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        allowed_fields = ['name', 'description', 'price', 'category', 'is_vegetarian', 'is_available']
        
        for field in allowed_fields:
            if field in update_data:
                update_fields.append(f"{field} = %s")
                update_values.append(update_data[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        update_values.append(item_id)
        query = f"UPDATE canteen_menu_items SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, update_values)
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        # Return updated item
        cursor.execute("SELECT * FROM canteen_menu_items WHERE id = %s", (item_id,))
        updated_item = cursor.fetchone()
        
        return {"message": "Menu item updated successfully", "item": updated_item}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.delete("/canteen/menu/clear")
async def clear_all_menu_items(current_user = Depends(auth.get_current_user)):
    """Clear all menu items (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can clear all menu items")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Get count before deletion
        cursor.execute("SELECT COUNT(*) as count FROM canteen_menu_items")
        count_before = cursor.fetchone()["count"]
        
        cursor.execute("DELETE FROM canteen_menu_items")
        connection.commit()
        
        return {
            "message": f"Successfully cleared {count_before} menu items",
            "items_deleted": count_before
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/canteen/menu/verify-visibility")
async def verify_menu_visibility(current_user = Depends(auth.get_current_user)):
    """Verify that uploaded menu is visible across all roles"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_canteen_tables(cursor)
        
        # Check total menu items
        cursor.execute("SELECT COUNT(*) as total_items FROM canteen_menu_items WHERE is_available = TRUE")
        total_items = cursor.fetchone()["total_items"]
        
        # Check items by category
        cursor.execute(
            """
            SELECT category, COUNT(*) as count 
            FROM canteen_menu_items 
            WHERE is_available = TRUE 
            GROUP BY category 
            ORDER BY category
            """
        )
        categories = cursor.fetchall()
        
        # Check latest uploaded asset
        cursor.execute(
            """
            SELECT id, file_name, mime_type, created_at 
            FROM canteen_menu_assets 
            WHERE active = 1 
            ORDER BY created_at DESC 
            LIMIT 1
            """
        )
        latest_asset = cursor.fetchone()
        
        verification_result = {
            "total_items": total_items,
            "categories": categories,
            "latest_asset": latest_asset,
            "visibility_status": "verified" if total_items > 0 else "no_items",
            "timestamp": datetime.now().isoformat()
        }
        
        return verification_result
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

# @app.get("/notifications") - COMMENTED OUT - Using router-based endpoint instead
# async def get_notifications(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
#     """Get notifications for current user"""
#     try:
#         connection = get_mysql_connection()
#         cursor = connection.cursor(dictionary=True)
#         
#         cursor.execute(
#             """
#             SELECT n.*, u.full_name as created_by_name,
#                    ur.read_at, ur.is_read
#             FROM notifications n
#             JOIN users u ON n.created_by = u.id
#             LEFT JOIN user_notification_reads ur ON n.id = ur.notification_id 
#                 AND ur.user_id = %s
#             WHERE n.target_role IN ('all', %s)
#               AND (n.expires_at IS NULL OR n.expires_at >= NOW())
#             ORDER BY n.priority DESC, n.created_at DESC
#             """,
#             (current_user["id"], current_user["role"])
#         )
#         notifications = cursor.fetchall()
#         
#         return notifications
#     except mysql.connector.Error as e:
#         return {"notifications": [], "error": str(e)}
#     finally:
#         if 'cursor' in locals():
#             cursor.close()
#         if 'connection' in locals():
#             connection.close()

# @app.post("/notifications/{notification_id}/read") - COMMENTED OUT - Using router-based endpoint instead
# async def mark_notification_read_endpoint(notification_id: int, current_user = Depends(auth.get_current_user)):
#     """Mark notification as read"""
#     try:
#         connection = get_mysql_connection()
#         cursor = connection.cursor(dictionary=True)
#         
#         # Check if already marked as read
#         cursor.execute(
#             "SELECT * FROM user_notification_reads WHERE notification_id = %s AND user_id = %s",
#             (notification_id, current_user["id"])
#         )
#         existing = cursor.fetchone()
#         
#         if existing:
#             return {"message": "Notification already marked as read"}
#         
#         # Mark as read
#         cursor.execute(
#             """
#             INSERT INTO user_notification_reads (notification_id, user_id, read_at, is_read)
#             VALUES (%s, %s, NOW(), 1)
#             """,
#             (notification_id, current_user["id"])
#         )
#         connection.commit()

#         return {"message": "Notification marked as read"}
#     except mysql.connector.Error as e:
#         raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
#     finally:
#         if 'cursor' in locals():
#             cursor.close()
#         if 'connection' in locals():
#             connection.close()

# @app.get("/notifications/unread-count") - COMMENTED OUT - Using router-based endpoint instead
# async def get_unread_notification_count(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
#     """Get unread notification count"""
#     try:
#         connection = get_mysql_connection()
#         cursor = connection.cursor(dictionary=True)

#         cursor.execute(
#             """
#             SELECT COUNT(*) as unread_count
#             FROM notifications
#             WHERE user_id = %s AND is_read = 0
#             """,
#             (current_user["id"],)
#         )
#         result = cursor.fetchone()

#         return {"unread_count": result["unread_count"]}
#     except mysql.connector.Error as e:
#         return {"unread_count": 0}
#     finally:
#         if 'cursor' in locals():
#             cursor.close()
#         if 'connection' in locals():
#             connection.close()

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

# Lightweight canteen staff management (uses users.department = 'canteen')
@app.get("/canteen/staff")
async def list_canteen_staff(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, email, department FROM users WHERE department = 'canteen' ORDER BY full_name")
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.post("/canteen/staff/promote")
async def promote_to_canteen_staff(payload: dict, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    user_id = (payload or {}).get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor()
        cursor.execute("UPDATE users SET department = 'canteen' WHERE id = %s", (user_id,))
        connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"promoted": True}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ============================================================================
# ADDITIONAL ENDPOINTS FOR FRONTEND FEATURES
# ============================================================================

# ---------------------------------------------------------------------------
# Organizations aliases (map to Clubs)
# ---------------------------------------------------------------------------
@app.get("/organizations")
async def get_organizations_alias(current_user = Depends(auth.get_current_user)):
    """Alias: return clubs (or organization_details) as organizations for frontend.
    Always includes organization_name and membership_status for current user."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
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
            # add member_count and membership_status via club_memberships
            for r in rows:
                # normalize name -> organization_name
                r["organization_name"] = r.get("name")
                cursor.execute(
                    "SELECT COUNT(*) as member_count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                    (r["id"],)
                )
                cnt = cursor.fetchone()
                r["member_count"] = cnt["member_count"] if cnt else 0
                # membership status for current user
                try:
                    cursor.execute(
                        "SELECT status FROM club_memberships WHERE club_id = %s AND user_id = %s",
                        (r["id"], user_id)
                    )
                    ms = cursor.fetchone()
                    r["membership_status"] = ms.get("status") if ms else None
                    r["is_member"] = r["membership_status"] in ("member", "approved", "selected")
                except Exception:
                    r["membership_status"] = None
                    r["is_member"] = False
            return rows
        # Fallback to organization_details + organization_memberships
        cursor.execute("SHOW COLUMNS FROM organization_details")
        cols = {c["Field"] for c in cursor.fetchall()}
        name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else None)
        type_col = "organization_type" if "organization_type" in cols else None
        # If college filtering column exists
        college_col = "college_id" if "college_id" in cols else None
        select_sql = f"SELECT id, {name_col} as organization_name" + (f", {type_col} as category" if type_col else "") + (f", {college_col} as college_id" if college_col else "") + ", user_id FROM organization_details"
        where = ""
        params = []
        if college_col and college_id:
            where = f" WHERE {college_col} = %s"
            params.append(college_id)
        cursor.execute(select_sql + where, tuple(params))
        orgs = cursor.fetchall()
        # member_count and membership_status from organization_memberships if present
        if table_exists("organization_memberships"):
            for o in orgs:
                cursor.execute(
                    "SELECT COUNT(*) as member_count FROM organization_memberships WHERE organization_id = %s AND status = 'approved'",
                    (o["id"],)
                )
                cnt = cursor.fetchone()
                o["member_count"] = cnt["member_count"] if cnt else 0
                try:
                    cursor.execute(
                        "SELECT status FROM organization_memberships WHERE organization_id = %s AND user_id = %s",
                        (o["id"], user_id)
                    )
                    ms = cursor.fetchone()
                    o["membership_status"] = ms.get("status") if ms else None
                    o["is_member"] = o["membership_status"] in ("member", "approved", "selected")
                except Exception:
                    o["membership_status"] = None
                    o["is_member"] = False
        return orgs
    except mysql.connector.Error as e:
        return {"organizations": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/organizations/{org_id}/apply")
async def apply_to_organization_alias(org_id: int, application_data: dict, current_user = Depends(auth.get_current_user)):
    """Alias: apply to club through organizations endpoint"""
    return await apply_to_club(org_id, application_data, current_user)

async def apply_to_club(club_id: int, application_data: dict, current_user):
    """Apply to join a club with detailed form data"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply to clubs")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if club exists and is active
        cursor.execute("SELECT id, name FROM clubs WHERE id = %s AND is_active = TRUE", (club_id,))
        club = cursor.fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check if user already has an application
        cursor.execute(
            "SELECT id, status FROM organization_applications WHERE club_id = %s AND user_id = %s",
            (club_id, current_user["id"])
        )
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"You already have a {existing['status']} application for this club")
        
        # Insert new application
        cursor.execute(
            """
            INSERT INTO organization_applications 
            (club_id, user_id, full_name, batch, year_of_study, sap_id, department_to_join, why_join, what_contribute, can_stay_longer_hours, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
            """,
            (
                club_id,
                current_user["id"],
                application_data.get("full_name", ""),
                application_data.get("batch", ""),
                application_data.get("year_of_study", ""),
                application_data.get("sap_id", ""),
                application_data.get("department_to_join", ""),
                application_data.get("why_join", ""),
                application_data.get("contribution", ""),  # Map 'contribution' to 'what_contribute'
                application_data.get("can_stay_longer", False)
            )
        )
        
        application_id = cursor.lastrowid
        connection.commit()
        
        return {
            "message": "Application submitted successfully",
            "application_id": application_id,
            "club_name": club["name"],
            "status": "pending"
        }
        
    except mysql.connector.Error as e:
        print(f"Database error in apply_to_club: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        print(f"Error in apply_to_club: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/clubs/{club_id}/apply")
async def apply_to_club_endpoint(club_id: int, application_data: dict, current_user = Depends(auth.get_current_user)):
    """Apply to join a club with detailed form data"""
    return await apply_to_club(club_id, application_data, current_user)

@app.post("/organizations/{org_id}/join")
async def join_organization_alias(org_id: int, current_user = Depends(auth.get_current_user)):
    """Legacy join endpoint - redirects to apply with basic info"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can join organizations")

    # Get basic user info to pre-fill application
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT full_name, batch, semester, student_id FROM users WHERE id = %s",
            (current_user["id"],)
        )
        user_info = cursor.fetchone()
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        # Create basic application data
        application_data = {
            "full_name": user_info["full_name"],
            "batch": user_info.get("batch", ""),
            "year_of_study": str(user_info.get("semester", "")),
            "sap_id": user_info.get("student_id", ""),
            "department_to_join": "",
            "why_join": "Interested in joining the organization",
            "what_contribute": "Will contribute to the best of my abilities",
            "can_stay_longer_hours": False
        }

        # Close connection before calling apply
        cursor.close()
        connection.close()

        # Call the apply endpoint
        return await apply_to_organization(org_id, application_data, current_user)

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

@app.post("/organizations/{org_id}/recruitment-post")
async def create_recruitment_post_alias(org_id: int, data: dict, current_user = Depends(auth.get_current_user)):
    """Alias: create club recruitment post through organizations endpoint"""
    return await create_recruitment_post(org_id, data, current_user)

@app.get("/organizations/{org_id}/applications")
async def get_organization_applications(org_id: int, current_user = Depends(auth.get_current_user)):
    """Get all applications for an organization/club (includes both club_memberships and organization_applications)"""
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
                (org_id, current_user["id"])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to view applications")
        
        # Get applications from both tables
        applications = []
        
        # Get from club_memberships (new system)
        cursor.execute(
            """
            SELECT cm.*, u.full_name, u.email, u.course, u.semester, u.phone_number,
                   'club_membership' as application_type, cm.id as application_id
            FROM club_memberships cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = %s AND cm.status = 'pending'
            ORDER BY cm.joined_at DESC
            """,
            (org_id,)
        )
        club_applications = cursor.fetchall()
        applications.extend(club_applications)
        
        # Get from organization_applications (legacy system)
        cursor.execute(
            """
            SELECT oa.*, 
                   oa.full_name,  -- Use application form name
                   u.email, 
                   oa.batch as course,  -- Use application batch as course
                   oa.year_of_study as semester,  -- Use application year as semester
                   u.phone_number,
                   'organization_application' as application_type, oa.id as application_id,
                   oa.created_at as joined_at
            FROM organization_applications oa
            JOIN users u ON oa.user_id = u.id
            WHERE oa.club_id = %s AND oa.status = 'pending'
            ORDER BY oa.created_at DESC
            """,
            (org_id,)
        )
        org_applications = cursor.fetchall()
        applications.extend(org_applications)
        
        # Sort all applications by date
        applications.sort(key=lambda x: x['joined_at'], reverse=True)
        
        return {"applications": applications, "total": len(applications)}
    except mysql.connector.Error as e:
        return {"error": str(e), "applications": [], "total": 0}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.get("/organizations/{org_id}/applications/{user_id}")
async def get_organization_application_details(org_id: int, user_id: int, current_user = Depends(auth.get_current_user)):
    """Get detailed application information for a specific user applying to an organization/club"""
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
                (org_id, current_user["id"])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to view application details")
        
        # Look for application in both tables
        application = None
        
        # First check club_memberships (basic application)
        cursor.execute(
            """
            SELECT cm.*, u.full_name, u.email, u.course, u.semester, u.phone_number,
                   'club_membership' as application_type
            FROM club_memberships cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = %s AND cm.user_id = %s
            """,
            (org_id, user_id)
        )
        application = cursor.fetchone()
        
        # Check organization_applications for detailed form responses (priority over basic membership)
        cursor.execute(
            """
            SELECT oa.*, 
                   oa.full_name as application_full_name,  -- Form response name
                   u.email, 
                   u.full_name as user_full_name,  -- User profile name
                   oa.batch as course,  -- Use application batch as course
                   oa.year_of_study as semester,  -- Use application year as semester
                   u.phone_number,
                   'organization_application' as application_type,
                   oa.created_at as joined_at
            FROM organization_applications oa
            JOIN users u ON oa.user_id = u.id
            WHERE oa.club_id = %s AND oa.user_id = %s
            """,
            (org_id, user_id)
        )
        detailed_application = cursor.fetchone()
        
        # If we have detailed application form responses, use those
        if detailed_application:
            application = detailed_application
            # Structure the form responses for frontend display
            form_responses = {
                "personal_info": {
                    "full_name": detailed_application.get('application_full_name'),
                    "batch": detailed_application.get('batch'),
                    "year_of_study": detailed_application.get('year_of_study'),
                    "sap_id": detailed_application.get('sap_id'),
                },
                "organization_preferences": {
                    "department_to_join": detailed_application.get('department_to_join'),
                },
                "application_questions": {
                    "why_join": detailed_application.get('why_join'),
                    "what_contribute": detailed_application.get('what_contribute'),
                    "can_stay_longer_hours": detailed_application.get('can_stay_longer_hours', False)
                },
                "status_info": {
                    "status": detailed_application.get('status', 'pending'),
                    "applied_at": detailed_application.get('created_at'),
                    "reviewed_at": detailed_application.get('reviewed_at'),
                    "reviewed_by": detailed_application.get('reviewed_by')
                }
            }
            application['form_responses'] = form_responses
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        return application
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.post("/clubs/{club_id}/recruitment-post")
async def create_club_recruitment_post(club_id: int, data: dict, current_user = Depends(auth.get_current_user)):
    """Create a recruitment post for a club"""
    return await create_recruitment_post(club_id, data, current_user)

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

@app.get("/timetable/upcoming")
async def upcoming_classes(window: int = 10, current_user = Depends(auth.get_current_user)):
    """Return upcoming classes within next `window` minutes for the current user.
    Students: personal timetable (user_timetable_entries) + extra lectures from mapped teachers.
    Faculty: extra lectures they scheduled (and optionally future: their standard schedule).
    Also creates a one-off notification for each upcoming item if not already created recently.
    """
    from datetime import datetime, timedelta, date, time as dtime
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        now = datetime.now()
        upcoming = []
        role = current_user.get("role")

        def safe_time_convert(time_obj):
            """Safely convert various time formats to datetime.time object"""
            if time_obj is None:
                return None
            if isinstance(time_obj, str):
                try:
                    parts = time_obj.split(":")
                    return dtime(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
                except:
                    return None
            if isinstance(time_obj, timedelta):
                total_seconds = int(time_obj.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return dtime(hours, minutes)
            if isinstance(time_obj, dtime):
                return time_obj
            return None

        if role == "student":
            today_name = now.strftime('%A')
            # Personal timetable for today
            cursor.execute(
                """
                SELECT id, day_of_week, start_time, end_time, subject, room, faculty
                FROM user_timetable_entries
                WHERE user_id = %s AND day_of_week = %s
                ORDER BY start_time
                """,
                (current_user["id"], today_name)
            )
            rows = cursor.fetchall() or []
            for r in rows:
                try:
                    st = safe_time_convert(r.get("start_time"))
                    et = safe_time_convert(r.get("end_time"))
                    
                    if not st:
                        continue
                    
                    # Combine with today's date and compute minutes until
                    st_dt = datetime.combine(date.today(), st)
                    minutes_until = int((st_dt - now).total_seconds() // 60)
                    
                    if 0 <= minutes_until <= max(1, window):
                        key = f"{today_name}-{st.strftime('%H:%M')}-{r.get('subject') or ''}"
                        upcoming.append({
                            "key": key,
                            "type": "class",
                            "day_of_week": today_name,
                            "start_time": st.strftime('%H:%M'),
                            "end_time": et.strftime('%H:%M') if et else None,
                            "subject": r.get("subject"),
                            "room": r.get("room"),
                            "faculty": r.get("faculty"),
                            "minutes_until": minutes_until,
                        })
                except Exception as e:
                    print(f"Error processing timetable entry {r.get('id')}: {e}")
                    continue

            # Extra lectures from mapped teachers within window
            try:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS teacher_students (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      teacher_id INT NOT NULL,
                      student_id INT NOT NULL,
                      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY uniq_teacher_student (teacher_id, student_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    """
                )
                cursor.execute(
                    """
                    SELECT el.id, el.subject, el.room, el.start_time, el.end_time, u.full_name AS faculty_name
                    FROM extra_lectures el
                    JOIN teacher_students ts ON ts.teacher_id = el.faculty_id AND ts.student_id = %s
                    LEFT JOIN users u ON u.id = el.faculty_id
                    WHERE el.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL %s MINUTE)
                    ORDER BY el.start_time
                    """,
                    (current_user["id"], max(1, window))
                )
                for r in cursor.fetchall() or []:
                    try:
                        st_dt = r.get("start_time")
                        if not st_dt: 
                            continue
                        minutes_until = int((st_dt - now).total_seconds() // 60)
                        key = f"extra-{r['id']}"
                        upcoming.append({
                            "key": key,
                            "type": "extra",
                            "start_time": st_dt.strftime('%H:%M'),
                            "end_time": r.get("end_time").strftime('%H:%M') if r.get("end_time") else None,
                            "subject": r.get("subject"),
                            "room": r.get("room"),
                            "faculty": r.get("faculty_name"),
                            "minutes_until": minutes_until,
                        })
                    except Exception as e:
                        print(f"Error processing extra lecture {r.get('id')}: {e}")
                        continue
            except Exception as e:
                print(f"Error querying extra lectures: {e}")

        elif role == "faculty":
            # Extra lectures authored by faculty within window
            try:
                cursor.execute(
                    """
                    SELECT id, subject, room, start_time, end_time
                    FROM extra_lectures
                    WHERE faculty_id = %s AND start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL %s MINUTE)
                    ORDER BY start_time
                    """,
                    (current_user["id"], max(1, window))
                )
                for r in cursor.fetchall() or []:
                    try:
                        st_dt = r.get("start_time")
                        if not st_dt: 
                            continue
                        minutes_until = int((st_dt - now).total_seconds() // 60)
                        key = f"extra-{r['id']}"
                        upcoming.append({
                            "key": key,
                            "type": "extra",
                            "start_time": st_dt.strftime('%H:%M'),
                            "end_time": r.get("end_time").strftime('%H:%M') if r.get("end_time") else None,
                            "subject": r.get("subject"),
                            "room": r.get("room"),
                            "minutes_until": minutes_until,
                        })
                    except Exception as e:
                        print(f"Error processing faculty lecture {r.get('id')}: {e}")
                        continue
            except Exception as e:
                print(f"Error querying faculty lectures: {e}")
        else:
            # For other roles, return empty for now
            pass

        return {"upcoming": upcoming}
    except Exception as e:
        print(f"Error in upcoming_classes: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if 'cursor' in locals(): 
            cursor.close()
        if 'connection' in locals(): 
            connection.close()

@app.get("/timetable/exists")
async def has_timetable(current_user = Depends(auth.get_current_user)):
    """Check if the current student already has a timetable uploaded"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT COUNT(*) as count FROM user_timetable_entries WHERE user_id = %s",
            (current_user["id"],)
        )
        result = cursor.fetchone()
        has_timetable = (result.get("count", 0) > 0) if result else False
        return {"has_timetable": has_timetable}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# --- Teacher-Student mapping and Extra lectures ---

@app.post("/faculty/students/{student_id}")
async def add_student_mapping(student_id: int, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS teacher_students (
              id INT AUTO_INCREMENT PRIMARY KEY,
              teacher_id INT NOT NULL,
              student_id INT NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY uniq_teacher_student (teacher_id, student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        cursor.execute(
            "INSERT IGNORE INTO teacher_students (teacher_id, student_id) VALUES (%s, %s)",
            (current_user["id"], student_id)
        )
        connection.commit()
        return {"status": "ok"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.delete("/faculty/students/{student_id}")
async def remove_student_mapping(student_id: int, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("DELETE FROM teacher_students WHERE teacher_id = %s AND student_id = %s", (current_user["id"], student_id))
        connection.commit()
        return {"status": "ok"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/faculty/students")
async def list_mapped_students(current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT ts.student_id, u.full_name, u.email
            FROM teacher_students ts
            LEFT JOIN users u ON u.id = ts.student_id
            WHERE ts.teacher_id = %s
            ORDER BY ts.created_at DESC
            """,
            (current_user["id"],)
        )
        return {"students": cursor.fetchall() or []}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

from pydantic import BaseModel
class ExtraLectureIn(BaseModel):
    subject: str
    start_time: str  # ISO datetime string
    end_time: str    # ISO datetime string
    room: str | None = None
    student_ids: list[int] | None = None

@app.post("/faculty/extra-lectures")
async def schedule_extra_lecture(payload: ExtraLectureIn, current_user = Depends(auth.get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty only")
    from datetime import datetime
    try:
        st = datetime.fromisoformat(payload.start_time)
        et = datetime.fromisoformat(payload.end_time)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid datetime format; use ISO 8601")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Ensure tables
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS extra_lectures (
              id INT AUTO_INCREMENT PRIMARY KEY,
              faculty_id INT NOT NULL,
              subject VARCHAR(255) NOT NULL,
              room VARCHAR(100),
              start_time DATETIME NOT NULL,
              end_time DATETIME NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS teacher_students (
              id INT AUTO_INCREMENT PRIMARY KEY,
              teacher_id INT NOT NULL,
              student_id INT NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY uniq_teacher_student (teacher_id, student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        # Insert lecture
        cursor.execute(
            "INSERT INTO extra_lectures (faculty_id, subject, room, start_time, end_time) VALUES (%s,%s,%s,%s,%s)",
            (current_user["id"], payload.subject, payload.room, st, et)
        )
        lecture_id = cursor.lastrowid
        # Determine recipients
        recipients: list[int] = []
        if payload.student_ids:
            recipients = payload.student_ids
        else:
            cursor.execute("SELECT student_id FROM teacher_students WHERE teacher_id = %s", (current_user["id"],))
            recipients = [r["student_id"] for r in (cursor.fetchall() or [])]
        # Notify recipients
        title = f"Extra Lecture: {payload.subject} at {st.strftime('%I:%M %p')}"
        message = (payload.room or "")
        for sid in set(recipients):
            _notify_user(cursor, sid, title, message, category='timetable', created_by=current_user["id"])
        connection.commit()
        return {"status": "ok", "lecture_id": lecture_id, "notified": len(set(recipients))}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

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

# ============================================================================
# ADMIN SYSTEM MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/admin/system/stats")
async def get_system_stats(current_user = Depends(auth.get_current_user)):
    """Get system statistics for admin dashboard"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Total users count
        cursor.execute("SELECT COUNT(*) as total_users FROM users")
        total_users = cursor.fetchone()["total_users"]
        
        # Total colleges count (single college system)
        total_colleges = 1
        
        # Active events count (events in future)
        cursor.execute("SELECT COUNT(*) as active_events FROM events WHERE date >= CURDATE()")
        active_events = cursor.fetchone()["active_events"]
        
        # Mock storage data (you can replace with actual disk usage queries)
        storage_used = 750
        storage_limit = 1000
        
        return {
            "totalUsers": total_users,
            "totalColleges": total_colleges,
            "activeEvents": active_events,
            "systemUptime": "99.9%",  # Mock data
            "storageUsed": storage_used,
            "storageLimit": storage_limit
        }
    except mysql.connector.Error as e:
        return {"error": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/admin/users")
async def get_all_users(current_user = Depends(auth.get_current_user)):
    """Get all users with their details for admin management"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT 
                id,
                full_name,
                email,
                role,
                department,
                course,
                semester,
                created_at,
                updated_at as last_login
            FROM users 
            ORDER BY created_at DESC
            LIMIT 100
            """
        )
        users = cursor.fetchall()
        
        # Convert datetime objects to strings
        for user in users:
            if user.get('created_at'):
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d')
            if user.get('last_login'):
                user['last_login'] = user['last_login'].strftime('%Y-%m-%d %H:%M')
            else:
                user['last_login'] = 'Never'
            user['status'] = 'active'  # Default status
        
        return users
    except mysql.connector.Error as e:
        return {"error": str(e), "users": []}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/admin/colleges")
async def get_all_colleges(current_user = Depends(auth.get_current_user)):
    """Get all colleges with statistics"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT 
                'Campus Connect College' as name,
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students_count,
                SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as faculty_count,
                MIN(created_at) as created_at
            FROM users
            """
        )
        colleges = cursor.fetchall()
        
        # Convert to the expected format
        formatted_colleges = []
        for idx, college in enumerate(colleges):
            formatted_colleges.append({
                "id": f"COL{idx+1:03d}",
                "name": college["name"],
                "city": "Mumbai",  # Mock data - you can extract from user profiles
                "state": "Maharashtra",  # Mock data
                "students_count": college["students_count"],
                "faculty_count": college["faculty_count"],
                "status": "active",
                "created_at": college["created_at"].strftime('%Y-%m-%d') if college["created_at"] else "Unknown"
            })
        
        return formatted_colleges
    except mysql.connector.Error as e:
        return {"error": str(e), "colleges": []}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@app.get("/admin/alerts")
async def get_system_alerts(current_user = Depends(auth.get_current_user)):
    """Get system alerts and notifications for admin"""
    # For now, return some sample alerts
    # You can create an admin_alerts table later for real alerts
    return [
        {
            "id": 1,
            "type": "info",
            "message": "System running normally - all services operational",
            "timestamp": "2025-01-20 10:30 AM",
            "resolved": True
        },
        {
            "id": 2,
            "type": "success", 
            "message": "Database backup completed successfully",
            "timestamp": "2025-01-20 03:00 AM",
            "resolved": True
        }
    ]

@app.get("/admin/timetables")
async def get_admin_timetables(current_user = Depends(auth.get_current_user)):
    """Get all timetables across colleges for admin management"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT 
                t.id,
                t.day,
                t.start_time as time,
                t.subject,
                t.faculty_name as faculty,
                t.room,
                t.batch,
                t.semester
            FROM timetable_entries t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_type = 'faculty'
            ORDER BY t.day, t.start_time
            LIMIT 50
            """
        )
        timetables = cursor.fetchall()
        
        # Add college_id for frontend compatibility  
        for entry in timetables:
            entry["college_id"] = "1"  # Single college system
            entry["id"] = str(entry["id"])
        
        return timetables
    except mysql.connector.Error as e:
        return {"error": str(e), "timetables": []}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


# ============================================================================
# CLUB EVENTS AND TIMELINE ENDPOINTS
# ============================================================================

@app.post("/clubs/{club_id}/events")
async def create_club_event_endpoint(club_id: int, event_data: dict, current_user = Depends(auth.get_current_user)):
    """Create a new event for a club"""
    return await create_club_event(club_id, event_data, current_user)

@app.get("/clubs/{club_id}/events")
async def get_club_events_endpoint(
    club_id: int,
    status: Optional[str] = Query(None, description="Filter by status: draft, pending_approval, approved, rejected, cancelled, completed"),
    current_user = Depends(auth.get_current_user)
):
    """Get all events for a specific club"""
    return await get_club_events(club_id, status, current_user)

@app.get("/clubs/events/all")
async def get_all_club_events_endpoint(
    status: Optional[str] = Query(None, description="Filter by status"),
    from_date: Optional[str] = Query(None, description="Filter events from this date (YYYY-MM-DD)"),
    current_user = Depends(auth.get_current_user)
):
    """Get all club events across all clubs (for calendar view)"""
    return await get_all_club_events(status, from_date, current_user)

@app.post("/clubs/events/{event_id}/approve")
async def approve_club_event_endpoint(event_id: int, approval_data: dict, current_user = Depends(auth.get_current_user)):
    """Approve or reject a club event (Student Council only)"""
    return await approve_club_event(event_id, approval_data, current_user)

@app.post("/clubs/{club_id}/timeline")
async def create_club_timeline_endpoint(club_id: int, timeline_data: dict, current_user = Depends(auth.get_current_user)):
    """Create a recurring activity in club timeline"""
    return await create_club_timeline(club_id, timeline_data, current_user)

@app.get("/clubs/{club_id}/timeline")
async def get_club_timeline_endpoint(club_id: int, current_user = Depends(auth.get_current_user)):
    """Get recurring timeline for a club"""
    return await get_club_timeline(club_id, current_user)

@app.put("/clubs/{club_id}/timeline/{timeline_id}")
async def update_club_timeline_endpoint(club_id: int, timeline_id: int, timeline_data: dict, current_user = Depends(auth.get_current_user)):
    """Update a recurring activity in club timeline"""
    return await update_club_timeline(club_id, timeline_id, timeline_data, current_user)

@app.delete("/clubs/{club_id}/timeline/{timeline_id}")
async def delete_club_timeline_endpoint(club_id: int, timeline_id: int, current_user = Depends(auth.get_current_user)):
    """Delete a recurring activity from club timeline"""
    return await delete_club_timeline(club_id, timeline_id, current_user)

@app.post("/clubs/{club_id}/timeline/sync-events")
async def sync_timeline_to_events_endpoint(club_id: int, sync_data: dict, current_user = Depends(auth.get_current_user)):
    """Convert timetable entries to recurring events"""
    return await sync_timeline_to_events(club_id, sync_data, current_user)

@app.post("/clubs/{club_id}/calendar/bulk-import")
async def bulk_import_calendar_events_endpoint(club_id: int, events_data: dict, current_user = Depends(auth.get_current_user)):
    """Bulk import calendar events from uploaded file"""
    return bulk_import_calendar_events(club_id, events_data, current_user)

@app.post("/clubs/events/{event_id}/register")
async def register_for_event_endpoint(event_id: int, current_user = Depends(auth.get_current_user)):
    """Register for a club event"""
    return await register_for_event(event_id, current_user)

@app.get("/student-council/dashboard")
async def get_student_council_dashboard_endpoint(current_user = Depends(auth.get_current_user)):
    """Get Student Council dashboard with all club events overview"""
    return await get_student_council_dashboard(current_user)

@app.post("/admin/clubs/{club_id}/mark-student-council")
async def mark_student_council_endpoint(club_id: int, current_user = Depends(auth.get_current_user)):
    """Mark a club as Student Council (Admin only)"""
    return await mark_student_council(club_id, current_user)

# ============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/admin/students/add")
async def add_student_endpoint(student_data: dict, current_user = Depends(auth.get_current_user)):
    """Add a new student manually (Admin only)"""
    return await add_student_manual(student_data, current_user)

@app.post("/admin/teachers/add")
async def add_teacher_endpoint(teacher_data: dict, current_user = Depends(auth.get_current_user)):
    """Add a new teacher manually (Admin only)"""
    return await add_teacher_manual(teacher_data, current_user)

@app.post("/admin/students/upload-csv")
async def upload_students_csv_endpoint(file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    """Bulk upload students from CSV file (Admin only)"""
    return await bulk_upload_students_csv(file, current_user)

@app.post("/admin/teachers/upload-csv")
async def upload_teachers_csv_endpoint(file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    """Bulk upload teachers from CSV file (Admin only)"""
    return await bulk_upload_teachers_csv(file, current_user)

@app.get("/admin/import-logs")
async def get_import_logs_endpoint(limit: int = 50, current_user = Depends(auth.get_current_user)):
    """Get import history logs (Admin only)"""
    return await get_import_logs(current_user, limit)

@app.get("/admin/user-statistics")
async def get_user_statistics_endpoint(current_user = Depends(auth.get_current_user)):
    """Get user statistics for admin dashboard (Admin only)"""
    return await get_user_statistics(current_user)

@app.get("/admin/users/search")
async def search_users_endpoint(
    query: str = "", 
    role: str = "", 
    limit: int = 50, 
    current_user = Depends(auth.get_current_user)
):
    """Search users with filters (Admin only)"""
    return await search_users(current_user, query, role, limit)

# ============================================================================
# CLUB EVENTS CALENDAR ENDPOINTS
# ============================================================================

@app.post("/clubs/{club_id}/calendar/events")
async def create_club_calendar_event_endpoint(club_id: int, event_data: dict, current_user = Depends(auth.get_current_user)):
    """Create a club event with calendar integration"""
    return await create_club_event_calendar(club_id, event_data, current_user)

@app.get("/clubs/{club_id}/calendar/{year}/{month}")
async def get_club_calendar_endpoint(club_id: int, year: int, month: int, current_user = Depends(auth.get_current_user)):
    """Get club calendar for a specific month"""
    return await get_club_calendar(club_id, year, month, current_user)

@app.get("/calendar/{year}/{month}")
async def get_all_clubs_calendar_endpoint(
    year: int, 
    month: int, 
    club_ids: Optional[str] = Query(None, description="Comma-separated club IDs to filter"),
    current_user = Depends(auth.get_current_user)
):
    """Get calendar view for all clubs or specific clubs for a month"""
    club_filter = None
    if club_ids:
        try:
            club_filter = [int(x.strip()) for x in club_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid club IDs format")
    
    return await get_all_clubs_calendar(year, month, current_user, club_filter)

@app.post("/clubs/{subscriber_club_id}/calendar/subscribe/{target_club_id}")
async def subscribe_to_club_calendar_endpoint(
    subscriber_club_id: int, 
    target_club_id: int, 
    current_user = Depends(auth.get_current_user)
):
    """Subscribe one club to another club's calendar"""
    return await subscribe_to_club_calendar(subscriber_club_id, target_club_id, current_user)

@app.get("/clubs/{club_id}/calendar/subscriptions")
async def get_club_calendar_subscriptions_endpoint(club_id: int, current_user = Depends(auth.get_current_user)):
    """Get all calendar subscriptions for a club"""
    return await get_club_calendar_subscriptions(club_id, current_user)

@app.put("/clubs/{club_id}/calendar/settings")
async def update_club_calendar_settings_endpoint(
    club_id: int, 
    settings: dict, 
    current_user = Depends(auth.get_current_user)
):
    """Update club calendar settings"""
    return await update_club_calendar_settings(club_id, settings, current_user)

@app.get("/calendar/upcoming")
async def get_upcoming_events_endpoint(
    days_ahead: int = Query(7, description="Number of days to look ahead"),
    limit: int = Query(20, description="Maximum number of events to return"),
    current_user = Depends(auth.get_current_user)
):
    """Get upcoming events from all clubs the user has access to"""
    return await get_upcoming_events_all_clubs(current_user, days_ahead, limit)


# ============================================================================
# EVENT APPROVAL SYSTEM - Organization requests approval from Admin
# ============================================================================

def _ensure_event_approval_table(cursor):
    """Create event approval request table if not exists"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_approval_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            organization_id INT NOT NULL,
            event_name VARCHAR(255) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            event_description TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            venue VARCHAR(255),
            expected_attendees INT,
            budget_required DECIMAL(10,2),
            resources_needed TEXT,
            materials_needed TEXT,
            staff_required INT,
            volunteers_required INT,
            additional_notes TEXT,
            status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
            submitted_by INT NOT NULL,
            reviewed_by INT,
            review_notes TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_organization (organization_id),
            INDEX idx_status (status),
            INDEX idx_submitted_by (submitted_by),
            FOREIGN KEY (submitted_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)


@app.post("/events/approval-request")
async def create_event_approval_request(
    request_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """
    Organization submits a large event for admin approval
    Required fields: event_name, event_type, event_description, start_date, end_date, 
                     expected_attendees, budget_required
    """
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Only organizations can submit event approval requests")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        # Get organization_id from user's organization membership
        cursor.execute("""
            SELECT organization_id FROM organization_members 
            WHERE user_id = %s AND role IN ('admin', 'president', 'vice_president')
            LIMIT 1
        """, (current_user["id"],))
        org_result = cursor.fetchone()
        
        if not org_result:
            raise HTTPException(status_code=403, detail="You must be an organization admin to submit approval requests")
        
        organization_id = org_result["organization_id"]
        
        # Validate required fields
        required_fields = ["event_name", "event_type", "event_description", "start_date", "end_date", 
                          "expected_attendees", "budget_required"]
        for field in required_fields:
            if field not in request_data or not request_data[field]:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Insert approval request
        cursor.execute("""
            INSERT INTO event_approval_requests (
                organization_id, event_name, event_type, event_description,
                start_date, end_date, venue, expected_attendees, budget_required,
                resources_needed, materials_needed, staff_required, volunteers_required,
                additional_notes, submitted_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            organization_id,
            request_data["event_name"],
            request_data["event_type"],
            request_data["event_description"],
            request_data["start_date"],
            request_data["end_date"],
            request_data.get("venue"),
            request_data["expected_attendees"],
            request_data["budget_required"],
            request_data.get("resources_needed"),
            request_data.get("materials_needed"),
            request_data.get("staff_required", 0),
            request_data.get("volunteers_required", 0),
            request_data.get("additional_notes"),
            current_user["id"]
        ))
        
        request_id = cursor.lastrowid
        
        # Notify all admins
        cursor.execute("SELECT id FROM users WHERE role = 'admin'")
        admins = cursor.fetchall()
        
        for admin in admins:
            _notify_user(
                cursor,
                admin["id"],
                "New Event Approval Request",
                f"Organization has requested approval for '{request_data['event_name']}' event",
                category="event_approval",
                created_by=current_user["id"]
            )
        
        connection.commit()
        
        return {
            "message": "Event approval request submitted successfully",
            "request_id": request_id,
            "status": "pending"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event approval request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.get("/events/approval-requests")
async def get_event_approval_requests(
    status: Optional[str] = None,
    organization_id: Optional[int] = None,
    current_user = Depends(auth.get_current_user)
):
    """
    Get event approval requests
    - Organizations see their own requests
    - Admins see all requests
    """
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        sql = """
            SELECT ear.*, 
                   o.name as organization_name,
                   u.full_name as submitted_by_name,
                   u.email as submitted_by_email,
                   r.full_name as reviewed_by_name
            FROM event_approval_requests ear
            LEFT JOIN organizations o ON ear.organization_id = o.id
            LEFT JOIN users u ON ear.submitted_by = u.id
            LEFT JOIN users r ON ear.reviewed_by = r.id
            WHERE 1=1
        """
        params = []
        
        # Role-based filtering
        if current_user.get("role") == "organization":
            # Get user's organization
            cursor.execute("""
                SELECT organization_id FROM organization_members 
                WHERE user_id = %s
                LIMIT 1
            """, (current_user["id"],))
            org_result = cursor.fetchone()
            
            if org_result:
                sql += " AND ear.organization_id = %s"
                params.append(org_result["organization_id"])
            else:
                return {"requests": [], "total": 0}
        
        elif current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Filter by status
        if status:
            sql += " AND ear.status = %s"
            params.append(status)
        
        # Filter by organization_id (admin only)
        if organization_id and current_user.get("role") == "admin":
            sql += " AND ear.organization_id = %s"
            params.append(organization_id)
        
        sql += " ORDER BY ear.submitted_at DESC"
        
        cursor.execute(sql, tuple(params))
        requests = cursor.fetchall()
        
        return {"requests": requests, "total": len(requests)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event approval requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.get("/events/approval-requests/{request_id}")
async def get_event_approval_request_detail(
    request_id: int,
    current_user = Depends(auth.get_current_user)
):
    """Get detailed information about a specific approval request"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        cursor.execute("""
            SELECT ear.*, 
                   o.name as organization_name,
                   o.description as organization_description,
                   u.full_name as submitted_by_name,
                   u.email as submitted_by_email,
                   u.phone as submitted_by_phone,
                   r.full_name as reviewed_by_name
            FROM event_approval_requests ear
            LEFT JOIN organizations o ON ear.organization_id = o.id
            LEFT JOIN users u ON ear.submitted_by = u.id
            LEFT JOIN users r ON ear.reviewed_by = r.id
            WHERE ear.id = %s
        """, (request_id,))
        
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Check permissions
        if current_user.get("role") == "organization":
            cursor.execute("""
                SELECT organization_id FROM organization_members 
                WHERE user_id = %s
                LIMIT 1
            """, (current_user["id"],))
            org_result = cursor.fetchone()
            
            if not org_result or org_result["organization_id"] != request["organization_id"]:
                raise HTTPException(status_code=403, detail="Access denied")
        
        elif current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        return request
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching request detail: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.post("/events/approval-requests/{request_id}/review")
async def review_event_approval_request(
    request_id: int,
    review_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """
    Admin reviews (approves/rejects) an event approval request
    Required: status ('approved' or 'rejected'), review_notes
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can review approval requests")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        # Validate review data
        if "status" not in review_data or review_data["status"] not in ["approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
        
        # Get the request
        cursor.execute("""
            SELECT ear.*, o.name as organization_name
            FROM event_approval_requests ear
            LEFT JOIN organizations o ON ear.organization_id = o.id
            WHERE ear.id = %s
        """, (request_id,))
        
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Request has already been reviewed")
        
        # Update request
        cursor.execute("""
            UPDATE event_approval_requests 
            SET status = %s, reviewed_by = %s, review_notes = %s, reviewed_at = NOW()
            WHERE id = %s
        """, (
            review_data["status"],
            current_user["id"],
            review_data.get("review_notes", ""),
            request_id
        ))
        
        # Notify the submitter
        notification_title = f"Event Approval {review_data['status'].title()}"
        notification_message = f"Your event '{request['event_name']}' has been {review_data['status']}."
        if review_data.get("review_notes"):
            notification_message += f"\n\nAdmin notes: {review_data['review_notes']}"
        
        _notify_user(
            cursor,
            request["submitted_by"],
            notification_title,
            notification_message,
            category="event_approval",
            created_by=current_user["id"]
        )
        
        # Notify all organization admins
        cursor.execute("""
            SELECT user_id FROM organization_members 
            WHERE organization_id = %s AND role IN ('admin', 'president', 'vice_president')
        """, (request["organization_id"],))
        
        org_admins = cursor.fetchall()
        for admin in org_admins:
            if admin["user_id"] != request["submitted_by"]:
                _notify_user(
                    cursor,
                    admin["user_id"],
                    notification_title,
                    notification_message,
                    category="event_approval",
                    created_by=current_user["id"]
                )
        
        connection.commit()
        
        return {
            "message": f"Request {review_data['status']} successfully",
            "request_id": request_id,
            "status": review_data["status"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.put("/events/approval-requests/{request_id}")
async def update_event_approval_request(
    request_id: int,
    update_data: dict,
    current_user = Depends(auth.get_current_user)
):
    """Organization can update their pending request"""
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Only organizations can update requests")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        # Get request and verify ownership
        cursor.execute("SELECT * FROM event_approval_requests WHERE id = %s", (request_id,))
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Cannot update a reviewed request")
        
        # Verify organization membership
        cursor.execute("""
            SELECT organization_id FROM organization_members 
            WHERE user_id = %s
            LIMIT 1
        """, (current_user["id"],))
        org_result = cursor.fetchone()
        
        if not org_result or org_result["organization_id"] != request["organization_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build update query
        update_fields = []
        params = []
        
        allowed_fields = [
            "event_name", "event_type", "event_description", "start_date", "end_date",
            "venue", "expected_attendees", "budget_required", "resources_needed",
            "materials_needed", "staff_required", "volunteers_required", "additional_notes"
        ]
        
        for field in allowed_fields:
            if field in update_data:
                update_fields.append(f"{field} = %s")
                params.append(update_data[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        params.append(request_id)
        sql = f"UPDATE event_approval_requests SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(sql, tuple(params))
        connection.commit()
        
        return {"message": "Request updated successfully", "request_id": request_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.delete("/events/approval-requests/{request_id}")
async def cancel_event_approval_request(
    request_id: int,
    current_user = Depends(auth.get_current_user)
):
    """Organization can cancel their pending request"""
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Only organizations can cancel requests")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        # Get request and verify ownership
        cursor.execute("SELECT * FROM event_approval_requests WHERE id = %s", (request_id,))
        request = cursor.fetchone()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Cannot cancel a reviewed request")
        
        # Verify organization membership
        cursor.execute("""
            SELECT organization_id FROM organization_members 
            WHERE user_id = %s
            LIMIT 1
        """, (current_user["id"],))
        org_result = cursor.fetchone()
        
        if not org_result or org_result["organization_id"] != request["organization_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Mark as cancelled
        cursor.execute(
            "UPDATE event_approval_requests SET status = 'cancelled' WHERE id = %s",
            (request_id,)
        )
        
        connection.commit()
        
        return {"message": "Request cancelled successfully", "request_id": request_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@app.get("/admin/event-approvals/statistics")
async def get_event_approval_statistics(
    current_user = Depends(auth.get_current_user)
):
    """Get statistics about event approval requests - Admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_event_approval_table(cursor)
        
        # Get counts by status
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM event_approval_requests
            GROUP BY status
        """)
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}
        
        # Get total budget requested
        cursor.execute("""
            SELECT 
                SUM(budget_required) as total_budget_requested,
                SUM(CASE WHEN status = 'approved' THEN budget_required ELSE 0 END) as approved_budget,
                SUM(CASE WHEN status = 'pending' THEN budget_required ELSE 0 END) as pending_budget
            FROM event_approval_requests
        """)
        budget_stats = cursor.fetchone()
        
        # Get recent requests
        cursor.execute("""
            SELECT ear.*, o.name as organization_name, u.full_name as submitted_by_name
            FROM event_approval_requests ear
            LEFT JOIN organizations o ON ear.organization_id = o.id
            LEFT JOIN users u ON ear.submitted_by = u.id
            ORDER BY ear.submitted_at DESC
            LIMIT 10
        """)
        recent_requests = cursor.fetchall()
        
        return {
            "status_counts": status_counts,
            "budget_statistics": budget_stats,
            "recent_requests": recent_requests,
            "pending_count": status_counts.get("pending", 0),
            "approved_count": status_counts.get("approved", 0),
            "rejected_count": status_counts.get("rejected", 0)
        }
    
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


if __name__ == "__main__":
    import uvicorn
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Campus Connect API Server")
    parser.add_argument("--port", type=int, default=8001, help="Port to run the server on")
    args = parser.parse_args()
    
    logger.info(f"Starting Campus Connect API server on port {args.port}...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=args.port,
        log_level="info",
        access_log=True
    )
