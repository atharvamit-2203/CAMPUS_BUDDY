from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, time, datetime
import mysql.connector

from database import get_mysql_connection
import auth

router = APIRouter()

# ======================
# Schema models
# ======================
class ClubNotificationCreate(BaseModel):
    title: str
    message: str
    priority: Optional[str] = "medium"  # low, medium, high, urgent

class RoomBookingRequest(BaseModel):
    room_id: int
    booking_date: date
    start_time: time
    end_time: time
    purpose: str
    club_id: Optional[int] = None  # allow faculty to book for a club they manage (optional)

# ======================
# Helpers
# ======================

def _ensure_notifications_tables(cursor):
    # notifications
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          club_id INT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'club',
          priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
          created_by INT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notifications_club_id (club_id),
          INDEX idx_notifications_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    # recipients
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notification_recipients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          notification_id INT NOT NULL,
          user_id INT NOT NULL,
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          read_at DATETIME NULL,
          UNIQUE KEY uq_notification_user (notification_id, user_id),
          INDEX idx_notification_id (notification_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )


def _ensure_rooms_tables(cursor):
    # rooms
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS rooms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_number VARCHAR(50) NOT NULL,
          room_name VARCHAR(100) NULL,
          building VARCHAR(100) NOT NULL,
          room_type ENUM('classroom','lab','auditorium','meeting','other') NOT NULL DEFAULT 'classroom',
          capacity INT NOT NULL DEFAULT 0,
          facilities TEXT NULL,
          is_available TINYINT(1) NOT NULL DEFAULT 1,
          UNIQUE KEY uq_building_room (building, room_number),
          INDEX idx_room_type (room_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    # bookings
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS room_bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_id INT NOT NULL,
          booked_by INT NOT NULL,
          booked_by_type ENUM('faculty','organization','admin','other') NOT NULL DEFAULT 'faculty',
          club_id INT NULL,
          organization_id INT NULL,
          booking_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          purpose VARCHAR(255) NOT NULL,
          status ENUM('pending','approved','rejected','cancelled','completed') NOT NULL DEFAULT 'approved',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_room_date (room_id, booking_date),
          INDEX idx_booker (booked_by, booking_date),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )


def _overlaps(cursor, room_id: int, booking_date: date, start_time: time, end_time: time) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM room_bookings rb
        WHERE rb.room_id = %s
          AND rb.booking_date = %s
          AND rb.status IN ('approved','pending')
          AND rb.start_time < %s
          AND rb.end_time > %s
        LIMIT 1
        """,
        (room_id, booking_date, end_time, start_time)
    )
    return cursor.fetchone() is not None

# ======================
# Club Notifications
# ======================

@router.post("/clubs/{club_id}/notifications")
async def create_club_notification(
    club_id: int,
    payload: ClubNotificationCreate,
    current_user = Depends(auth.get_current_user)
):
    if current_user.get("role") not in ["faculty", "admin"]:
        # Allow club creator as well
        pass
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_notifications_tables(cursor)

        # Authorization: faculty/admin OR club creator
        if current_user.get("role") not in ["faculty", "admin"]:
            cursor.execute("SELECT id FROM clubs WHERE id = %s AND created_by = %s", (club_id, current_user["id"]))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to notify this club")

        # Create notification
        cursor.execute(
            """
            INSERT INTO notifications (club_id, title, message, category, priority, created_by, created_at)
            VALUES (%s, %s, %s, 'club', %s, %s, NOW())
            """,
            (club_id, payload.title, payload.message, payload.priority or "medium", current_user["id"]) 
        )
        notification_id = cursor.lastrowid

        # Gather approved club members
        cursor.execute(
            "SELECT user_id FROM club_memberships WHERE club_id = %s AND status = 'approved'",
            (club_id,)
        )
        members = cursor.fetchall() or []
        recipient_rows = [(notification_id, m["user_id"]) for m in members]

        # Include creator (optional) if not already in members
        recipient_rows.append((notification_id, current_user["id"]))

        if recipient_rows:
            cursor.executemany(
                "INSERT IGNORE INTO notification_recipients (notification_id, user_id) VALUES (%s, %s)",
                recipient_rows
            )
        connection.commit()

        return {"message": "Notification sent", "notification_id": notification_id, "recipients": len(recipient_rows)}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@router.get("/clubs/{club_id}/notifications")
async def list_club_notifications(club_id: int, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_notifications_tables(cursor)

        # Authorization: faculty/admin/club creator OR member of the club
        authorized = False
        if current_user.get("role") in ["faculty", "admin"]:
            authorized = True
        if not authorized:
            cursor.execute("SELECT 1 FROM clubs WHERE id = %s AND created_by = %s", (club_id, current_user["id"]))
            if cursor.fetchone():
                authorized = True
        if not authorized:
            cursor.execute(
                "SELECT 1 FROM club_memberships WHERE club_id = %s AND user_id = %s AND status = 'approved'",
                (club_id, current_user["id"]) 
            )
            if cursor.fetchone():
                authorized = True
        if not authorized:
            raise HTTPException(status_code=403, detail="Not authorized to view notifications for this club")

        cursor.execute(
            """
            SELECT n.*
            FROM notifications n
            WHERE n.club_id = %s
            ORDER BY n.created_at DESC
            LIMIT 200
            """,
            (club_id,)
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@router.get("/notifications")
async def my_notifications(limit: int = 100, current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_notifications_tables(cursor)
        cursor.execute(
            """
            SELECT nr.id as receipt_id, nr.is_read, nr.read_at,
                   n.id as notification_id, n.club_id, n.title, n.message,
                   n.category, n.priority, n.created_by, n.created_at
            FROM notification_recipients nr
            JOIN notifications n ON nr.notification_id = n.id
            WHERE nr.user_id = %s
            ORDER BY n.created_at DESC
            LIMIT %s
            """,
            (current_user["id"], int(limit))
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


class MarkReadPayload(BaseModel):
    notification_ids: List[int]

@router.post("/notifications/mark-read")
async def mark_notifications_read(payload: MarkReadPayload, current_user = Depends(auth.get_current_user)):
    try:
        if not payload.notification_ids:
            return {"updated": 0}
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_notifications_tables(cursor)
        # Update only receipts that belong to the caller
        format_strings = ",".join(["%s"] * len(payload.notification_ids))
        query = (
            f"UPDATE notification_recipients SET is_read = 1, read_at = NOW() "
            f"WHERE user_id = %s AND notification_id IN ({format_strings})"
        )
        cursor.execute(query, (current_user["id"], *payload.notification_ids))
        connection.commit()
        return {"updated": cursor.rowcount}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# ======================
# Room Booking
# ======================

@router.get("/rooms")
async def get_rooms(
    room_type: Optional[str] = None,
    booking_date: Optional[date] = None,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    current_user = Depends(auth.get_current_user)
):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_rooms_tables(cursor)

        # Basic room list
        params: List = []
        sql = "SELECT * FROM rooms WHERE is_available = 1"
        if room_type:
            sql += " AND room_type = %s"
            params.append(room_type)
        sql += " ORDER BY building, room_number"
        cursor.execute(sql, tuple(params))
        rooms = cursor.fetchall()

        # If time window given, filter to only rooms with no overlaps
        if booking_date and start_time and end_time:
            available = []
            for r in rooms:
                if not _overlaps(cursor, r["id"], booking_date, start_time, end_time):
                    available.append(r)
            return available
        return rooms
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@router.post("/rooms/book")
async def book_room(
    payload: RoomBookingRequest,
    current_user = Depends(auth.get_current_user)
):
    # Roles allowed: faculty, admin, organization (club/org bookings)
    if current_user.get("role") not in ["faculty", "admin", "organization"]:
        raise HTTPException(status_code=403, detail="Not authorized to book rooms")

    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="Invalid time range")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_rooms_tables(cursor)

        # Validate room exists and available
        cursor.execute("SELECT * FROM rooms WHERE id = %s AND is_available = 1", (payload.room_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Room not found or unavailable")

        # Time collision check
        if _overlaps(cursor, payload.room_id, payload.booking_date, payload.start_time, payload.end_time):
            raise HTTPException(status_code=400, detail="Room is already booked for the selected time slot")

        # Determine booking attribution
        booked_by_type = current_user.get("role") if current_user.get("role") in ["faculty", "admin", "organization"] else "other"
        club_id_val = None
        org_id_val = None

        # If an org user, try linking their organization_details row
        if current_user.get("role") == "organization":
            cursor.execute("SELECT id FROM organization_details WHERE user_id = %s", (current_user["id"],))
            org_row = cursor.fetchone()
            if org_row:
                org_id_val = org_row["id"]

        # If faculty provided a club_id, ensure they are the club creator
        if payload.club_id is not None:
            cursor.execute("SELECT 1 FROM clubs WHERE id = %s AND created_by = %s", (payload.club_id, current_user["id"]))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized to book on behalf of this club")
            club_id_val = payload.club_id

        # Insert booking
        cursor.execute(
            """
            INSERT INTO room_bookings (
                room_id, booked_by, booked_by_type, club_id, organization_id,
                booking_date, start_time, end_time, purpose, status, created_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, 'approved', NOW()
            )
            """,
            (
                payload.room_id, current_user["id"], booked_by_type, club_id_val, org_id_val,
                payload.booking_date, payload.start_time, payload.end_time, payload.purpose
            )
        )
        connection.commit()
        booking_id = cursor.lastrowid

        return {"message": "Room booked", "booking_id": booking_id}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@router.get("/rooms/bookings")
async def list_bookings(
    booking_date: Optional[date] = None,
    room_id: Optional[int] = None,
    upcoming_only: Optional[bool] = True,
    current_user = Depends(auth.get_current_user)
):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_rooms_tables(cursor)

        sql = (
            "SELECT rb.*, r.room_number, r.room_name, r.building "
            "FROM room_bookings rb "
            "JOIN rooms r ON rb.room_id = r.id "
            "WHERE 1=1"
        )
        params: List = []
        if booking_date:
            sql += " AND rb.booking_date = %s"
            params.append(booking_date)
        if room_id:
            sql += " AND rb.room_id = %s"
            params.append(room_id)
        if upcoming_only:
            # Only show bookings in the future (or ongoing today)
            sql += (
                " AND (rb.booking_date > CURDATE() "
                " OR (rb.booking_date = CURDATE() AND rb.end_time > CURTIME()))"
            )
            # Hide cancelled/rejected when upcoming_only is applied
            sql += " AND rb.status IN ('approved','pending')"
        sql += " ORDER BY rb.booking_date ASC, rb.start_time ASC LIMIT 500"

        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()


@router.get("/rooms/my-bookings")
async def my_bookings(current_user = Depends(auth.get_current_user)):
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_rooms_tables(cursor)
        cursor.execute(
            """
            SELECT rb.*, r.room_number, r.room_name, r.building
            FROM room_bookings rb
            JOIN rooms r ON rb.room_id = r.id
            WHERE rb.booked_by = %s
            ORDER BY rb.booking_date DESC, rb.start_time DESC
            LIMIT 200
            """,
            (current_user["id"],)
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

@router.post("/rooms/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: int, current_user = Depends(auth.get_current_user)):
    """Cancel a room booking. Allowed for creator or admin."""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_rooms_tables(cursor)
        cursor.execute("SELECT booked_by, status FROM room_bookings WHERE id = %s", (booking_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Booking not found")
        if current_user.get("role") != "admin" and row["booked_by"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
        if row.get("status") == "cancelled":
            return {"message": "Already cancelled"}
        cursor.execute("UPDATE room_bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
        connection.commit()
        return {"message": "Booking cancelled"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()
