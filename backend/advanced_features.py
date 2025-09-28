"""
Advanced Campus Features API Endpoints
Lost & Found, Event Discovery, Resource Booking, Push Notifications
"""

from fastapi import HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
import mysql.connector
from datetime import datetime, timedelta
from database import get_mysql_connection
import auth
import schemas
import os
import uuid

# ============================================================================
# LOST & FOUND ENDPOINTS
# ============================================================================

def create_lost_found_item(item_data: dict, current_user = Depends(auth.get_current_user)):
    """Post a lost or found item"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            INSERT INTO lost_found 
            (user_id, type, item_name, description, location_found, contact_info, 
             category, date_lost_found, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user["id"],
            item_data["type"],
            item_data["item_name"],
            item_data.get("description", ""),
            item_data.get("location", ""),
            item_data.get("contact_info", ""),
            item_data.get("category", "other"),
            item_data.get("date_lost_found", datetime.now().date()),
            item_data.get("image_url", "")
        ))
        
        item_id = cursor.lastrowid
        connection.commit()
        
        # Notify users with matching interests
        if item_data["type"] == "found":
            _notify_lost_item_seekers(item_data["item_name"], item_data.get("category"))
        
        return {
            "success": True,
            "item_id": item_id,
            "message": f"Item posted successfully in {item_data['type']} section"
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def get_lost_found_items(item_type: str = None, category: str = None, search: str = None, 
                        current_user = Depends(auth.get_current_user)):
    """Get lost and found items with filters"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT lf.*, u.first_name, u.last_name, u.email
            FROM lost_found lf
            JOIN users u ON lf.user_id = u.id
            WHERE lf.status = 'active'
        """
        params = []
        
        if item_type:
            query += " AND lf.type = %s"
            params.append(item_type)
        
        if category:
            query += " AND lf.category = %s"
            params.append(category)
        
        if search:
            query += " AND (lf.item_name LIKE %s OR lf.description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        
        query += " ORDER BY lf.created_at DESC LIMIT 50"
        
        cursor.execute(query, params)
        items = cursor.fetchall()
        
        return {
            "items": items,
            "total": len(items),
            "filters_applied": {
                "type": item_type,
                "category": category,
                "search": search
            }
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def mark_item_resolved(item_id: int, current_user = Depends(auth.get_current_user)):
    """Mark lost/found item as resolved"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user owns the item or is admin
        cursor.execute("""
            SELECT user_id FROM lost_found WHERE id = %s
        """, (item_id,))
        
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item["user_id"] != current_user["id"] and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        cursor.execute("""
            UPDATE lost_found 
            SET status = 'resolved', resolved_at = NOW(), resolved_by = %s
            WHERE id = %s
        """, (current_user["id"], item_id))
        
        connection.commit()
        
        return {"success": True, "message": "Item marked as resolved"}
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# EVENT DISCOVERY ENDPOINTS
# ============================================================================

def get_events_by_interests(current_user = Depends(auth.get_current_user)):
    """Get events based on user's interests with smart filtering"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get user's interest categories
        cursor.execute("""
            SELECT category, interest_level 
            FROM user_interest_categories 
            WHERE user_id = %s
        """, (current_user["id"],))
        
        user_interests = cursor.fetchall()
        interest_categories = [interest["category"] for interest in user_interests]
        
        if not interest_categories:
            # If no specific interests, show general events
            interest_categories = ["general", "academic"]
        
        # Get events matching interests
        placeholders = ",".join(["%s"] * len(interest_categories))
        query = f"""
            SELECT e.*, c.name as club_name, ec.name as category_name, ec.color_code,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM event_interests ei WHERE ei.event_id = e.id AND ei.rsvp_status = 'going') as going_count,
                   (SELECT rsvp_status FROM event_interests ei WHERE ei.event_id = e.id AND ei.user_id = %s) as user_rsvp
            FROM events e
            LEFT JOIN clubs c ON e.club_id = c.id
            LEFT JOIN event_categories ec ON e.category = ec.name
            LEFT JOIN users u ON e.organized_by = u.id
            WHERE e.event_date >= CURDATE() 
            AND e.is_active = TRUE
            AND (e.category IN ({placeholders}) OR e.category IS NULL)
            ORDER BY e.event_date ASC, e.start_time ASC
        """
        
        params = [current_user["id"]] + interest_categories
        cursor.execute(query, params)
        events = cursor.fetchall()
        
        # Get trending events (high RSVP count)
        cursor.execute("""
            SELECT e.*, c.name as club_name, ec.name as category_name, ec.color_code,
                   COUNT(ei.id) as rsvp_count
            FROM events e
            LEFT JOIN clubs c ON e.club_id = c.id
            LEFT JOIN event_categories ec ON e.category = ec.name
            LEFT JOIN event_interests ei ON e.id = ei.event_id AND ei.rsvp_status = 'going'
            WHERE e.event_date >= CURDATE() AND e.is_active = TRUE
            GROUP BY e.id
            HAVING rsvp_count > 10
            ORDER BY rsvp_count DESC
            LIMIT 5
        """)
        
        trending = cursor.fetchall()
        
        return {
            "recommended_events": events,
            "trending_events": trending,
            "user_interests": interest_categories,
            "total_recommended": len(events)
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def rsvp_to_event(event_id: int, rsvp_data: dict, current_user = Depends(auth.get_current_user)):
    """RSVP to an event with calendar sync"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if event exists
        cursor.execute("""
            SELECT * FROM events WHERE id = %s AND is_active = TRUE
        """, (event_id,))
        
        event = cursor.fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check capacity
        if event["max_capacity"]:
            cursor.execute("""
                SELECT COUNT(*) as going_count
                FROM event_interests 
                WHERE event_id = %s AND rsvp_status = 'going'
            """, (event_id,))
            
            going_count = cursor.fetchone()["going_count"]
            
            if going_count >= event["max_capacity"] and rsvp_data["rsvp_status"] == "going":
                return {
                    "success": False,
                    "message": "Event is at full capacity",
                    "waitlist_available": True
                }
        
        # Insert or update RSVP
        cursor.execute("""
            INSERT INTO event_interests 
            (user_id, event_id, rsvp_status, interest_level, notification_preferences)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            rsvp_status = VALUES(rsvp_status),
            interest_level = VALUES(interest_level),
            notification_preferences = VALUES(notification_preferences)
        """, (
            current_user["id"],
            event_id,
            rsvp_data["rsvp_status"],
            rsvp_data.get("interest_level", "interested"),
            rsvp_data.get("notification_preferences", '{"email": true, "push": true}')
        ))
        
        # Update event registration count
        cursor.execute("""
            UPDATE events 
            SET current_registrations = (
                SELECT COUNT(*) FROM event_interests 
                WHERE event_id = %s AND rsvp_status = 'going'
            )
            WHERE id = %s
        """, (event_id, event_id))
        
        connection.commit()
        
        # Generate calendar entry data
        calendar_data = _generate_calendar_data(event, rsvp_data["rsvp_status"])
        
        return {
            "success": True,
            "rsvp_status": rsvp_data["rsvp_status"],
            "calendar_data": calendar_data,
            "message": f"RSVP updated to '{rsvp_data['rsvp_status']}'"
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def update_user_interests(interests_data: dict, current_user = Depends(auth.get_current_user)):
    """Update user's interest categories for better event recommendations"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Clear existing interests
        cursor.execute("""
            DELETE FROM user_interest_categories WHERE user_id = %s
        """, (current_user["id"],))
        
        # Insert new interests
        for category, level in interests_data.get("interests", {}).items():
            cursor.execute("""
                INSERT INTO user_interest_categories (user_id, category, interest_level)
                VALUES (%s, %s, %s)
            """, (current_user["id"], category, level))
        
        connection.commit()
        
        return {
            "success": True,
            "message": "Interests updated successfully",
            "interests_count": len(interests_data.get("interests", {}))
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# RESOURCE BOOKING ENDPOINTS
# ============================================================================

def get_available_resources(resource_type: str, date: str, start_time: str, end_time: str,
                           current_user = Depends(auth.get_current_user)):
    """Get available resources for booking"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        if resource_type == "room":
            # Get available rooms
            cursor.execute("""
                SELECT r.*, rt.type_name, rt.capacity, rt.facilities
                FROM rooms r
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.is_active = TRUE
                AND r.id NOT IN (
                    SELECT room_id FROM room_bookings 
                    WHERE booking_date = %s 
                    AND start_time < %s AND end_time > %s
                    AND status = 'confirmed'
                )
                AND r.id NOT IN (
                    SELECT room_id FROM class_schedule
                    WHERE day_of_week = LOWER(DAYNAME(%s))
                    AND start_time < %s AND end_time > %s
                    AND is_active = TRUE
                )
                ORDER BY rt.capacity ASC
            """, (date, end_time, start_time, date, end_time, start_time))
            
        elif resource_type == "equipment":
            # Get available equipment
            cursor.execute("""
                SELECT e.*, 
                       (e.available_quantity - COALESCE(booked.total_booked, 0)) as current_available
                FROM equipment e
                LEFT JOIN (
                    SELECT equipment_id, SUM(quantity_requested) as total_booked
                    FROM equipment_bookings
                    WHERE booking_date = %s 
                    AND start_time < %s AND end_time > %s
                    AND status = 'confirmed'
                    GROUP BY equipment_id
                ) booked ON e.id = booked.equipment_id
                WHERE e.is_active = TRUE
                AND (e.available_quantity - COALESCE(booked.total_booked, 0)) > 0
                ORDER BY e.name
            """, (date, end_time, start_time))
            
        elif resource_type == "lab":
            # Get available labs
            cursor.execute("""
                SELECT r.*, rt.type_name, rt.capacity, rt.facilities
                FROM rooms r
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.is_active = TRUE 
                AND rt.type_name LIKE '%lab%'
                AND r.id NOT IN (
                    SELECT lab_id FROM lab_bookings 
                    WHERE booking_date = %s 
                    AND start_time < %s AND end_time > %s
                    AND status = 'confirmed'
                )
                ORDER BY rt.capacity ASC
            """, (date, end_time, start_time))
        
        resources = cursor.fetchall()
        
        return {
            "available_resources": resources,
            "resource_type": resource_type,
            "requested_slot": {
                "date": date,
                "start_time": start_time,
                "end_time": end_time
            },
            "total_available": len(resources)
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def get_user_bookings(current_user = Depends(auth.get_current_user)):
    """Get all bookings for current user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        bookings = {}
        
        # Room bookings
        cursor.execute("""
            SELECT rb.*, r.room_number, r.room_name, rt.type_name
            FROM room_bookings rb
            JOIN rooms r ON rb.room_id = r.id
            JOIN room_types rt ON r.room_type_id = rt.id
            WHERE rb.user_id = %s
            ORDER BY rb.booking_date DESC, rb.start_time DESC
            LIMIT 20
        """, (current_user["id"],))
        bookings["rooms"] = cursor.fetchall()
        
        # Equipment bookings
        cursor.execute("""
            SELECT eb.*, e.name as equipment_name, e.category
            FROM equipment_bookings eb
            JOIN equipment e ON eb.equipment_id = e.id
            WHERE eb.user_id = %s
            ORDER BY eb.booking_date DESC, eb.start_time DESC
            LIMIT 20
        """, (current_user["id"],))
        bookings["equipment"] = cursor.fetchall()
        
        # Lab bookings
        cursor.execute("""
            SELECT lb.*, r.room_number, r.room_name
            FROM lab_bookings lb
            JOIN rooms r ON lb.lab_id = r.id
            WHERE lb.user_id = %s
            ORDER BY lb.booking_date DESC, lb.start_time DESC
            LIMIT 20
        """, (current_user["id"],))
        bookings["labs"] = cursor.fetchall()
        
        return {
            "bookings": bookings,
            "total_bookings": len(bookings["rooms"]) + len(bookings["equipment"]) + len(bookings["labs"])
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# PUSH NOTIFICATIONS ENDPOINTS
# ============================================================================

def register_notification_token(token_data: dict, current_user = Depends(auth.get_current_user)):
    """Register FCM token for push notifications"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            INSERT INTO user_notification_tokens (user_id, token, device_type)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            token = VALUES(token), 
            is_active = TRUE,
            last_used = NOW()
        """, (
            current_user["id"],
            token_data["token"],
            token_data.get("device_type", "web")
        ))
        
        connection.commit()
        
        return {
            "success": True,
            "message": "Notification token registered successfully"
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def send_bulk_notification(notification_data: dict, current_user = Depends(auth.get_current_user)):
    """Send bulk notifications (Faculty/Admin only)"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can send bulk notifications")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        target_users = notification_data.get("target_users", [])
        target_roles = notification_data.get("target_roles", [])
        
        user_ids = []
        
        if target_users:
            user_ids.extend(target_users)
        
        if target_roles:
            placeholders = ",".join(["%s"] * len(target_roles))
            cursor.execute(f"""
                SELECT id FROM users WHERE role IN ({placeholders})
            """, target_roles)
            
            role_users = cursor.fetchall()
            user_ids.extend([user["id"] for user in role_users])
        
        # Remove duplicates
        user_ids = list(set(user_ids))
        
        # Insert notifications for all target users
        for user_id in user_ids:
            cursor.execute("""
                INSERT INTO notifications 
                (user_id, title, message, type, priority, action_url)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                notification_data["title"],
                notification_data["message"],
                notification_data.get("type", "general"),
                notification_data.get("priority", "medium"),
                notification_data.get("action_url", "")
            ))
        
        connection.commit()
        
        return {
            "success": True,
            "notifications_sent": len(user_ids),
            "message": f"Notification sent to {len(user_ids)} users"
        }
        
    except mysql.connector.Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _notify_lost_item_seekers(item_name: str, category: str):
    """Notify users who might be looking for this found item"""
    # Implementation would search for users who posted similar lost items
    pass

def _generate_calendar_data(event: dict, rsvp_status: str) -> dict:
    """Generate calendar data for event RSVP"""
    if rsvp_status != "going":
        return {}
    
    return {
        "title": event["title"],
        "start_date": event["event_date"].isoformat(),
        "start_time": str(event["start_time"]),
        "end_time": str(event["end_time"]) if event["end_time"] else None,
        "location": event["location"],
        "description": event["description"],
        "calendar_url": f"data:text/calendar;charset=utf8,BEGIN:VCALENDAR..."  # ICS format
    }
