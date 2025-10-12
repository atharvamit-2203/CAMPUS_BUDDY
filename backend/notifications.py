from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import json
import mysql.connector

from database import get_mysql_connection
from auth import get_current_user

router = APIRouter()

# Pydantic models
class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "general"
    action_url: Optional[str] = None
    priority: str = "medium"
    scheduled_for: Optional[datetime] = None

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    priority: str
    created_at: str
    expires_at: Optional[str] = None
    club_id: Optional[int] = None

class NotificationUpdate(BaseModel):
    is_read: bool = True

# Helper function to create notification
def create_notification_mysql(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "general",
    action_url: Optional[str] = None,
    priority: str = "medium",
    scheduled_for: Optional[datetime] = None
):
    """Create a new notification using MySQL"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor()
        
        cursor.execute(
            """
            INSERT INTO notifications (user_id, title, message, type, priority, created_at, expires_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s)
            """,
            (user_id, title, message, notification_type, priority, scheduled_for)
        )
        connection.commit()
        notification_id = cursor.lastrowid
        
        cursor.close()
        connection.close()
        return notification_id
        
    except mysql.connector.Error as e:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# API Endpoints
# Static routes first (to avoid conflicts with parameterized routes)
@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT COUNT(*) as unread_count
            FROM notifications
            WHERE user_id = %s AND is_read = 0
            """,
            (current_user["id"],)
        )
        result = cursor.fetchone()
        return {"unread_count": result["unread_count"] if result else 0}
        
    except mysql.connector.Error as e:
        return {"unread_count": 0, "error": str(e)}
    finally:
        if 'cursor' in locals(): 
            cursor.close()
        if 'connection' in locals(): 
            connection.close()

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all user notifications as read"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor()
        
        cursor.execute(
            """
            UPDATE notifications 
            SET is_read = 1
            WHERE user_id = %s AND is_read = 0
            """,
            (current_user["id"],)
        )
        connection.commit()
        updated_count = cursor.rowcount
        
        return {"message": "All notifications marked as read", "updated_count": updated_count}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.get("/notifications")
async def get_user_notifications(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False
):
    """Get user's notifications"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Build the query
        where_clause = "WHERE user_id = %s"
        params = [current_user["id"]]
        
        if unread_only:
            where_clause += " AND is_read = 0"
            
        query = f"""
            SELECT id, user_id, title, message, type, is_read, 
                   priority, created_at, expires_at, club_id
            FROM notifications 
            {where_clause}
            ORDER BY created_at DESC 
            LIMIT %s OFFSET %s
        """
        params.extend([limit, skip])
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for notif in notifications:
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat()
            if notif.get('expires_at'):
                notif['expires_at'] = notif['expires_at'].isoformat()
        
        return notifications
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.get("/notifications/{notification_id}")
async def get_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT id, user_id, title, message, type, is_read, 
                   priority, created_at, expires_at, club_id
            FROM notifications 
            WHERE id = %s AND user_id = %s
            """,
            (notification_id, current_user["id"])
        )
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Convert datetime objects to strings
        if notification.get('created_at'):
            notification['created_at'] = notification['created_at'].isoformat()
        if notification.get('expires_at'):
            notification['expires_at'] = notification['expires_at'].isoformat()
        
        return notification
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.put("/notifications/{notification_id}")
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a notification (mark as read/unread)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if notification exists and belongs to user
        cursor.execute(
            "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
            (notification_id, current_user["id"])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Update the notification
        cursor.execute(
            """
            UPDATE notifications 
            SET is_read = %s
            WHERE id = %s AND user_id = %s
            """,
            (notification_update.is_read, notification_id, current_user["id"])
        )
        connection.commit()
        
        return {"message": "Notification updated successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read (frontend compatibility endpoint)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if notification exists and belongs to user
        cursor.execute(
            "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
            (notification_id, current_user["id"])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Mark as read
        cursor.execute(
            """
            UPDATE notifications 
            SET is_read = 1
            WHERE id = %s AND user_id = %s
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

# Duplicate mark-all-read endpoint removed - keeping the one at the top

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if notification exists and belongs to user
        cursor.execute(
            "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
            (notification_id, current_user["id"])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Delete the notification
        cursor.execute(
            "DELETE FROM notifications WHERE id = %s AND user_id = %s",
            (notification_id, current_user["id"])
        )
        connection.commit()
        
        return {"message": "Notification deleted"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Duplicate unread-count endpoint removed - keeping the one at the top

# Admin endpoints for creating notifications
@router.post("/admin/notifications/broadcast")
async def broadcast_notification(
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Broadcast notification to all users (admin only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admins and faculty can broadcast notifications")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get all users
        cursor.execute("SELECT id FROM users WHERE is_active = 1")
        users = cursor.fetchall()

        # Create notifications for all users
        notifications_created = 0
        for user in users:
            create_notification_mysql(
                user_id=user["id"],
                title=notification.title,
                message=notification.message,
                notification_type=notification.type,
                action_url=notification.action_url,
                priority=notification.priority,
                scheduled_for=notification.scheduled_for
            )
            notifications_created += 1

        return {"message": f"Notification broadcasted to {notifications_created} users"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.post("/admin/notifications/role/{role}")
async def send_notification_to_role(
    role: str,
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to users of specific role (admin/faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get users with the specified role
        cursor.execute("SELECT id FROM users WHERE role = %s AND is_active = 1", (role,))
        users = cursor.fetchall()

        if not users:
            raise HTTPException(status_code=404, detail=f"No active users found with role: {role}")

        # Create notifications for all users with the role
        notifications_created = 0
        for user in users:
            create_notification_mysql(
                user_id=user["id"],
                title=notification.title,
                message=notification.message,
                notification_type=notification.type,
                action_url=notification.action_url,
                priority=notification.priority,
                scheduled_for=notification.scheduled_for
            )
            notifications_created += 1

        return {"message": f"Notification sent to {notifications_created} users with role {role}"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@router.post("/admin/notifications/user/{user_id}")
async def send_notification_to_user(
    user_id: int,
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to specific user (admin/faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND is_active = 1", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        notification_id = create_notification_mysql(
            user_id=user_id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.type,
            action_url=notification.action_url,
            priority=notification.priority,
            scheduled_for=notification.scheduled_for
        )

        return {"message": "Notification sent successfully", "notification_id": notification_id}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Utility functions for creating automated notifications
def create_event_registration_notification(user_id: int, event_title: str, event_date: str):
    """Create notification for event registration"""
    create_notification_mysql(
        user_id=user_id,
        title="Event Registration Confirmed",
        message=f"You have successfully registered for '{event_title}' on {event_date}",
        notification_type="event",
        priority="medium"
    )

def create_class_cancellation_notification(user_id: int, subject: str, date: str, reason: str = None):
    """Create notification for class cancellation"""
    message = f"Class for {subject} on {date} has been cancelled"
    if reason:
        message += f". Reason: {reason}"
    
    create_notification_mysql(
        user_id=user_id,
        title="Class Cancelled",
        message=message,
        notification_type="academic",
        priority="high"
    )

def create_deadline_notification(user_id: int, assignment_title: str, due_date: str):
    """Create notification for upcoming deadline"""
    create_notification_mysql(
        user_id=user_id,
        title="Assignment Deadline Reminder",
        message=f"Don't forget: '{assignment_title}' is due on {due_date}",
        notification_type="academic",
        priority="high"
    )

def create_system_notification(user_id: int, title: str, message: str, priority: str = "medium"):
    """Create system notification"""
    create_notification_mysql(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="system",
        priority=priority
    )