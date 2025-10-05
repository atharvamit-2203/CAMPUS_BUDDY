from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import json

from database import get_db
from auth import get_current_user
from models import Notification, User

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
    action_url: Optional[str]
    priority: str
    created_at: datetime
    read_at: Optional[datetime]

class NotificationUpdate(BaseModel):
    is_read: bool = True

# Helper function to create notification
def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "general",
    action_url: Optional[str] = None,
    priority: str = "medium",
    scheduled_for: Optional[datetime] = None
):
    """Create a new notification"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        action_url=action_url,
        priority=priority,
        scheduled_for=scheduled_for
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

# API Endpoints
@router.get("/notifications", response_model=List[NotificationResponse])
async def get_user_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False
):
    """Get user's notifications"""
    query = db.query(Notification).filter(Notification.user_id == current_user["id"])

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user["id"]
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification

@router.put("/notifications/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a notification (mark as read/unread)"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user["id"]
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = notification_update.is_read
    if notification_update.is_read and not notification.read_at:
        notification.read_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)
    return notification

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all user notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user["id"],
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })

    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user["id"]
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}

@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications"""
    try:
        from database import get_mysql_connection
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
    except Exception as e:
        return {"unread_count": 0, "error": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'connection' in locals(): connection.close()

# Admin endpoints for creating notifications
@router.post("/admin/notifications/broadcast")
async def broadcast_notification(
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Broadcast notification to all users (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can broadcast notifications")

    # Get all users
    users = db.query(User).all()

    # Create notifications for all users
    notifications_created = 0
    for user in users:
        create_notification(
            db=db,
            user_id=user.id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.type,
            action_url=notification.action_url,
            priority=notification.priority,
            scheduled_for=notification.scheduled_for
        )
        notifications_created += 1

    return {"message": f"Notification broadcasted to {notifications_created} users"}

@router.post("/admin/notifications/role/{role}")
async def send_notification_to_role(
    role: str,
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send notification to users of specific role (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can send role notifications")

    # Get users by role
    users = db.query(User).filter(User.role == role).all()

    # Create notifications for role users
    notifications_created = 0
    for user in users:
        create_notification(
            db=db,
            user_id=user.id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.type,
            action_url=notification.action_url,
            priority=notification.priority,
            scheduled_for=notification.scheduled_for
        )
        notifications_created += 1

    return {"message": f"Notification sent to {notifications_created} {role}s"}

@router.post("/admin/notifications/user/{user_id}")
async def send_notification_to_user(
    user_id: int,
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send notification to specific user (admin/faculty only)"""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_notification = create_notification(
        db=db,
        user_id=user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.type,
        action_url=notification.action_url,
        priority=notification.priority,
        scheduled_for=notification.scheduled_for
    )

    return {"message": "Notification sent successfully", "notification_id": created_notification.id}

# Utility functions for creating automated notifications
def create_event_registration_notification(db: Session, user_id: int, event_title: str, event_date: str):
    """Create notification for event registration"""
    return create_notification(
        db=db,
        user_id=user_id,
        title="Event Registration Confirmed",
        message=f"You have successfully registered for '{event_title}' on {event_date}",
        notification_type="booking_confirmed",
        priority="medium"
    )

def create_class_cancellation_notification(db: Session, user_id: int, subject: str, date: str, reason: str = None):
    """Create notification for class cancellation"""
    message = f"Your {subject} class scheduled for {date} has been cancelled."
    if reason:
        message += f" Reason: {reason}"

    return create_notification(
        db=db,
        user_id=user_id,
        title="Class Cancelled",
        message=message,
        notification_type="class_cancelled",
        priority="high"
    )

def create_deadline_notification(db: Session, user_id: int, assignment_title: str, due_date: str):
    """Create notification for upcoming deadline"""
    return create_notification(
        db=db,
        user_id=user_id,
        title="Assignment Deadline Approaching",
        message=f"'{assignment_title}' is due on {due_date}. Don't forget to submit!",
        notification_type="deadline",
        priority="high",
        scheduled_for=datetime.utcnow() + timedelta(days=1)  # Send 1 day before
    )

def create_system_notification(db: Session, user_id: int, title: str, message: str, priority: str = "medium"):
    """Create system notification"""
    return create_notification(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type="general",
        priority=priority
    )