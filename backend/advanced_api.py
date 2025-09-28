# Advanced API Endpoints for Campus Connect
# QR Code Management, Payment Processing, Timetable Management
# Created: September 12, 2025

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
from pydantic import BaseModel
import qrcode
import io
import json
import hashlib
from PIL import Image
import base64

from database import get_db
from auth import get_current_user

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class CanteenOrderCreate(BaseModel):
    items: List[Dict[str, Any]]  # [{"menu_item_id": 1, "quantity": 2, "special_notes": ""}]
    special_instructions: Optional[str] = None
    payment_method: str = "pay_later"  # "cash", "card", "upi", "wallet", "pay_later"

class PaymentProcess(BaseModel):
    order_id: int
    payment_method: str
    amount_paid: float

class RoomBookingCreate(BaseModel):
    room_id: int
    booking_date: date
    start_time: time
    end_time: time
    purpose: str
    expected_attendees: Optional[int] = None
    special_requirements: Optional[str] = None

class ExtraClassRequest(BaseModel):
    subject_id: int
    faculty_id: int
    class_date: date
    start_time: time
    end_time: time
    topic: Optional[str] = None
    reason: Optional[str] = None
    max_students: int = 50

class TimetableUpdate(BaseModel):
    schedule_id: int
    new_room_id: Optional[int] = None
    new_start_time: Optional[time] = None
    new_end_time: Optional[time] = None
    new_date: Optional[date] = None
    change_reason: Optional[str] = None
    is_permanent: bool = False

class QRScanRequest(BaseModel):
    qr_data: str
    scan_location: str = "canteen"

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str
    target_role: Optional[str] = None
    target_course: Optional[str] = None
    target_semester: Optional[int] = None
    is_urgent: bool = False

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()

# =============================================================================
# CANTEEN MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/canteen/menu")
async def get_canteen_menu(db: Session = Depends(get_db)):
    """Get complete canteen menu with categories"""
    query = text("""
        SELECT 
            cc.id as category_id,
            cc.category_name,
            cc.description as category_description,
            json_agg(
                json_build_object(
                    'id', cmi.id,
                    'item_name', cmi.item_name,
                    'description', cmi.description,
                    'price', cmi.price,
                    'image_url', cmi.image_url,
                    'emoji', cmi.emoji,
                    'is_vegetarian', cmi.is_vegetarian,
                    'is_available', cmi.is_available,
                    'preparation_time', cmi.preparation_time,
                    'allergens', cmi.allergens
                ) ORDER BY cmi.item_name
            ) as items
        FROM canteen_categories cc
        LEFT JOIN canteen_menu_items cmi ON cc.id = cmi.category_id AND cmi.is_available = true
        WHERE cc.is_active = true
        GROUP BY cc.id, cc.category_name, cc.description, cc.display_order
        ORDER BY cc.display_order
    """)
    
    result = db.execute(query).fetchall()
    return [dict(row) for row in result]

@router.post("/canteen/order")
async def create_canteen_order(
    order_data: CanteenOrderCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new canteen order"""
    
    # Calculate total amount
    total_amount = 0
    order_items = []
    
    for item in order_data.items:
        # Get item details
        item_query = text("SELECT price FROM canteen_menu_items WHERE id = :item_id AND is_available = true")
        item_result = db.execute(item_query, {"item_id": item["menu_item_id"]}).fetchone()
        
        if not item_result:
            raise HTTPException(status_code=400, detail=f"Menu item {item['menu_item_id']} not available")
        
        item_total = float(item_result.price) * item["quantity"]
        total_amount += item_total
        
        order_items.append({
            "menu_item_id": item["menu_item_id"],
            "quantity": item["quantity"],
            "unit_price": float(item_result.price),
            "total_price": item_total,
            "special_notes": item.get("special_notes", "")
        })
    
    # Create order
    order_query = text("""
        INSERT INTO canteen_orders (
            user_id, total_amount, final_amount, payment_method, 
            special_instructions, estimated_ready_time
        ) VALUES (
            :user_id, :total_amount, :final_amount, :payment_method,
            :special_instructions, CURRENT_TIMESTAMP + INTERVAL '15 minutes'
        ) RETURNING id, order_number
    """)
    
    order_result = db.execute(order_query, {
        "user_id": current_user.id,
        "total_amount": total_amount,
        "final_amount": total_amount,
        "payment_method": order_data.payment_method,
        "special_instructions": order_data.special_instructions
    }).fetchone()
    
    order_id = order_result.id
    order_number = order_result.order_number
    
    # Add order items
    for item in order_items:
        item_query = text("""
            INSERT INTO canteen_order_items (
                order_id, menu_item_id, quantity, unit_price, total_price, special_notes
            ) VALUES (
                :order_id, :menu_item_id, :quantity, :unit_price, :total_price, :special_notes
            )
        """)
        
        db.execute(item_query, {
            "order_id": order_id,
            **item
        })
    
    db.commit()
    
    return {
        "success": True,
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total_amount,
        "message": "Order created successfully"
    }

@router.post("/canteen/payment")
async def process_payment(
    payment_data: PaymentProcess,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process payment for canteen order"""
    
    query = text("SELECT * FROM process_canteen_payment(:order_id, :payment_method, :amount_paid)")
    result = db.execute(query, {
        "order_id": payment_data.order_id,
        "payment_method": payment_data.payment_method,
        "amount_paid": payment_data.amount_paid
    }).fetchone()
    
    db.commit()
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {
        "success": True,
        "message": result.message,
        "receipt_data": result.receipt_data
    }

@router.get("/canteen/orders/{user_id}")
async def get_user_orders(
    user_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's canteen orders"""
    
    # Check authorization
    if current_user.id != user_id and current_user.role not in ['admin', 'canteen_staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = text("""
        SELECT 
            co.*,
            json_agg(
                json_build_object(
                    'item_name', cmi.item_name,
                    'quantity', coi.quantity,
                    'unit_price', coi.unit_price,
                    'total_price', coi.total_price,
                    'emoji', cmi.emoji
                ) ORDER BY coi.id
            ) as items
        FROM canteen_orders co
        JOIN canteen_order_items coi ON co.id = coi.order_id
        JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
        WHERE co.user_id = :user_id
        GROUP BY co.id
        ORDER BY co.created_at DESC
    """)
    
    result = db.execute(query, {"user_id": user_id}).fetchall()
    return [dict(row) for row in result]

@router.get("/canteen/qr/{order_id}")
async def generate_qr_code(
    order_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate QR code for order"""
    
    # Verify order belongs to user
    order_query = text("SELECT user_id, order_status, payment_status FROM canteen_orders WHERE id = :order_id")
    order_result = db.execute(order_query, {"order_id": order_id}).fetchone()
    
    if not order_result:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order_result.user_id != current_user.id and current_user.role not in ['admin', 'canteen_staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order_result.payment_status == 'pending':
        raise HTTPException(status_code=400, detail="Payment pending - cannot generate QR code")
    
    # Generate QR code data
    qr_query = text("SELECT generate_qr_code_data(:order_id) as qr_data")
    qr_result = db.execute(qr_query, {"order_id": order_id}).fetchone()
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_result.qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return StreamingResponse(img_bytes, media_type="image/png")

@router.post("/canteen/scan")
async def scan_qr_code(
    scan_data: QRScanRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Scan QR code for order pickup"""
    
    # Only canteen staff can scan
    if current_user.role != 'canteen_staff':
        raise HTTPException(status_code=403, detail="Only canteen staff can scan QR codes")
    
    query = text("SELECT * FROM process_qr_scan(:qr_data, :scanned_by, :scan_location)")
    result = db.execute(query, {
        "qr_data": scan_data.qr_data,
        "scanned_by": current_user.id,
        "scan_location": scan_data.scan_location
    }).fetchone()
    
    db.commit()
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {
        "success": True,
        "message": result.message,
        "order_details": result.order_details
    }

# =============================================================================
# ROOM BOOKING ENDPOINTS
# =============================================================================

@router.get("/rooms")
async def get_available_rooms(
    room_type: Optional[str] = None,
    date: Optional[date] = None,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    db: Session = Depends(get_db)
):
    """Get available rooms with optional filtering"""
    
    if date and start_time and end_time:
        # Check availability for specific time slot
        query = text("""
            SELECT r.* FROM rooms r
            WHERE r.is_available = true
            AND (:room_type IS NULL OR r.room_type = :room_type)
            AND check_room_availability(r.id, :date, :start_time, :end_time) = true
            ORDER BY r.room_number
        """)
        
        result = db.execute(query, {
            "room_type": room_type,
            "date": date,
            "start_time": start_time,
            "end_time": end_time
        }).fetchall()
    else:
        # Get all rooms
        query = text("""
            SELECT * FROM rooms r
            WHERE r.is_available = true
            AND (:room_type IS NULL OR r.room_type = :room_type)
            ORDER BY r.room_number
        """)
        
        result = db.execute(query, {"room_type": room_type}).fetchall()
    
    return [dict(row) for row in result]

@router.post("/rooms/book")
async def book_room(
    booking_data: RoomBookingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Book a room"""
    
    query = text("""
        SELECT * FROM book_room(
            :room_id, :user_id, :booking_date, :start_time, :end_time,
            :purpose, :expected_attendees, :special_requirements
        )
    """)
    
    result = db.execute(query, {
        "room_id": booking_data.room_id,
        "user_id": current_user.id,
        "booking_date": booking_data.booking_date,
        "start_time": booking_data.start_time,
        "end_time": booking_data.end_time,
        "purpose": booking_data.purpose,
        "expected_attendees": booking_data.expected_attendees,
        "special_requirements": booking_data.special_requirements
    }).fetchone()
    
    db.commit()
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {
        "success": True,
        "message": result.message,
        "booking_id": result.booking_id,
        "reference_number": result.reference_number
    }

@router.get("/rooms/bookings/{user_id}")
async def get_user_bookings(
    user_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's room bookings"""
    
    # Check authorization
    if current_user.id != user_id and current_user.role not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = text("""
        SELECT 
            rb.*,
            r.room_number,
            r.room_name,
            r.building
        FROM room_bookings rb
        JOIN rooms r ON rb.room_id = r.id
        WHERE rb.booked_by = :user_id
        ORDER BY rb.booking_date DESC, rb.start_time DESC
    """)
    
    result = db.execute(query, {"user_id": user_id}).fetchall()
    return [dict(row) for row in result]

# =============================================================================
# TIMETABLE MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/timetable/{course}/{semester}")
async def get_timetable(
    course: str,
    semester: int,
    db: Session = Depends(get_db)
):
    """Get timetable for course and semester"""
    
    query = text("""
        SELECT 
            cs.*,
            s.subject_name,
            s.subject_code,
            u.full_name as faculty_name,
            r.room_number,
            r.building
        FROM class_schedule cs
        JOIN subjects s ON cs.subject_id = s.id
        JOIN users u ON cs.faculty_id = u.id
        JOIN rooms r ON cs.room_id = r.id
        WHERE cs.course = :course 
        AND cs.semester = :semester 
        AND cs.is_active = true
        ORDER BY cs.day_of_week, cs.start_time
    """)
    
    result = db.execute(query, {"course": course, "semester": semester}).fetchall()
    return [dict(row) for row in result]

@router.post("/timetable/update")
async def update_timetable(
    update_data: TimetableUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update class schedule (faculty only)"""
    
    if current_user.role != 'faculty':
        raise HTTPException(status_code=403, detail="Only faculty can update timetable")
    
    query = text("""
        SELECT * FROM update_class_schedule(
            :schedule_id, :faculty_id, :new_room_id, :new_start_time, 
            :new_end_time, :new_date, :change_reason, :is_permanent
        )
    """)
    
    result = db.execute(query, {
        "schedule_id": update_data.schedule_id,
        "faculty_id": current_user.id,
        "new_room_id": update_data.new_room_id,
        "new_start_time": update_data.new_start_time,
        "new_end_time": update_data.new_end_time,
        "new_date": update_data.new_date,
        "change_reason": update_data.change_reason,
        "is_permanent": update_data.is_permanent
    }).fetchone()
    
    db.commit()
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {
        "success": True,
        "message": result.message,
        "affected_students": result.affected_students
    }

@router.post("/timetable/extra-class")
async def request_extra_class(
    class_data: ExtraClassRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request an extra class"""
    
    query = text("""
        SELECT * FROM request_extra_class(
            :subject_id, :requested_by, :faculty_id, :class_date,
            :start_time, :end_time, :topic, :reason, :max_students
        )
    """)
    
    result = db.execute(query, {
        "subject_id": class_data.subject_id,
        "requested_by": current_user.id,
        "faculty_id": class_data.faculty_id,
        "class_date": class_data.class_date,
        "start_time": class_data.start_time,
        "end_time": class_data.end_time,
        "topic": class_data.topic,
        "reason": class_data.reason,
        "max_students": class_data.max_students
    }).fetchone()
    
    db.commit()
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {
        "success": True,
        "message": result.message,
        "class_id": result.class_id
    }

# =============================================================================
# NOTIFICATION ENDPOINTS
# =============================================================================

@router.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: int,
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    
    # Check authorization
    if current_user.id != user_id and current_user.role not in ['admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = text("""
        SELECT * FROM user_notifications
        WHERE user_id = :user_id
        LIMIT :limit
    """)
    
    result = db.execute(query, {"user_id": user_id, "limit": limit}).fetchall()
    return [dict(row) for row in result]

@router.post("/notifications/mark-read")
async def mark_notifications_read(
    notification_ids: Optional[List[int]] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notifications as read"""
    
    query = text("SELECT mark_notifications_read(:user_id, :notification_ids) as updated_count")
    result = db.execute(query, {
        "user_id": current_user.id,
        "notification_ids": notification_ids
    }).fetchone()
    
    db.commit()
    
    return {
        "success": True,
        "updated_count": result.updated_count
    }

@router.post("/notifications/send")
async def send_notification(
    notification_data: NotificationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send bulk notification (admin/faculty only)"""
    
    if current_user.role not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Not authorized to send notifications")
    
    query = text("""
        SELECT send_bulk_notification(
            :title, :message, :notification_type, :target_role,
            :target_course, :target_semester, :is_urgent
        ) as notification_count
    """)
    
    result = db.execute(query, {
        "title": notification_data.title,
        "message": notification_data.message,
        "notification_type": notification_data.notification_type,
        "target_role": notification_data.target_role,
        "target_course": notification_data.target_course,
        "target_semester": notification_data.target_semester,
        "is_urgent": notification_data.is_urgent
    }).fetchone()
    
    db.commit()
    
    return {
        "success": True,
        "notifications_sent": result.notification_count
    }

# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics/canteen-sales")
async def get_canteen_sales_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get canteen sales analytics"""
    
    if current_user.role not in ['admin', 'canteen_staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = text("SELECT * FROM get_canteen_sales_report(:start_date, :end_date)")
    result = db.execute(query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    return [dict(row) for row in result]

@router.get("/analytics/room-utilization")
async def get_room_utilization(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get room utilization analytics"""
    
    if current_user.role not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now().date() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now().date()
    
    query = text("""
        WITH booking_stats AS (
            SELECT 
                r.id,
                r.room_number,
                r.room_name,
                r.room_type,
                COUNT(rb.id) as total_bookings,
                SUM(EXTRACT(EPOCH FROM (rb.end_time - rb.start_time))/3600) as total_hours_booked
            FROM rooms r
            LEFT JOIN room_bookings rb ON r.id = rb.room_id 
                AND rb.booking_date BETWEEN :start_date AND :end_date
                AND rb.booking_status = 'approved'
            GROUP BY r.id, r.room_number, r.room_name, r.room_type
        )
        SELECT 
            *,
            ROUND((total_hours_booked / (EXTRACT(DAYS FROM (:end_date - :start_date)) * 8)) * 100, 2) as utilization_percentage
        FROM booking_stats
        ORDER BY utilization_percentage DESC
    """)
    
    result = db.execute(query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    return [dict(row) for row in result]
