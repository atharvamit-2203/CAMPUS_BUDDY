#!/usr/bin/env python3
"""
Club Events and Timeline Management API
Allows clubs to manage their event schedules and timelines
Student Council has oversight over all club events
"""

from fastapi import HTTPException, Depends
from typing import Optional, List
from datetime import datetime, date, time
import mysql.connector
from database import get_mysql_connection
import auth

# =============================================================================
# CLUB EVENT TIMELINE MANAGEMENT
# =============================================================================

def _ensure_club_events_tables(cursor):
    """Ensure club events and timeline tables exist"""
    
    # Create club_events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS club_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            club_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            venue VARCHAR(255),
            event_type ENUM('meeting', 'workshop', 'competition', 'seminar', 'social', 'recruitment', 'other') DEFAULT 'other',
            max_participants INT,
            registration_required BOOLEAN DEFAULT FALSE,
            registration_deadline DATETIME,
            status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'draft',
            approved_by INT,
            approved_at DATETIME,
            rejection_reason TEXT,
            created_by INT NOT NULL,
            is_public BOOLEAN DEFAULT TRUE,
            poster_url VARCHAR(500),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_club_date (club_id, event_date),
            INDEX idx_status (status),
            INDEX idx_event_date (event_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Create club_event_registrations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS club_event_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
            attendance_marked_by INT,
            attendance_marked_at DATETIME,
            FOREIGN KEY (event_id) REFERENCES club_events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (attendance_marked_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_event_user (event_id, user_id),
            INDEX idx_user_events (user_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Create club_timeline table for recurring activities
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS club_timeline (
            id INT AUTO_INCREMENT PRIMARY KEY,
            club_id INT NOT NULL,
            activity_name VARCHAR(255) NOT NULL,
            description TEXT,
            day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            venue VARCHAR(255),
            activity_type ENUM('meeting', 'practice', 'workshop', 'training', 'other') DEFAULT 'other',
            is_active BOOLEAN DEFAULT TRUE,
            effective_from DATE,
            effective_until DATE,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_club_day (club_id, day_of_week),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Add is_student_council flag to clubs table if it doesn't exist
    try:
        cursor.execute("""
            ALTER TABLE clubs 
            ADD COLUMN is_student_council BOOLEAN DEFAULT FALSE
        """)
    except:
        pass  # Column already exists

async def create_club_event(club_id: int, event_data: dict, current_user):
    """Create a new club event"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Check if user is authorized (club admin or student council)
        cursor.execute(
            """
            SELECT c.id, c.name, c.is_student_council, c.created_by
            FROM clubs c
            WHERE c.id = %s AND c.is_active = TRUE
            """,
            (club_id,)
        )
        club = cursor.fetchone()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check authorization
        is_club_admin = club["created_by"] == current_user["id"]
        
        # Check if user is member of the club
        cursor.execute(
            "SELECT id FROM club_memberships WHERE club_id = %s AND user_id = %s AND status = 'approved'",
            (club_id, current_user["id"])
        )
        is_member = cursor.fetchone() is not None
        
        # Check if user is in student council
        cursor.execute(
            """
            SELECT cm.id FROM club_memberships cm
            JOIN clubs c ON c.id = cm.club_id
            WHERE cm.user_id = %s AND cm.status = 'approved' AND c.is_student_council = TRUE
            """,
            (current_user["id"],)
        )
        is_student_council = cursor.fetchone() is not None
        
        if not (is_club_admin or is_member or is_student_council or current_user.get("role") in ["admin", "faculty"]):
            raise HTTPException(status_code=403, detail="Not authorized to create events for this club")
        
        # Parse event data
        title = event_data.get("title")
        description = event_data.get("description", "")
        event_date = event_data.get("event_date")
        start_time = event_data.get("start_time")
        end_time = event_data.get("end_time")
        venue = event_data.get("venue", "")
        event_type = event_data.get("event_type", "other")
        max_participants = event_data.get("max_participants")
        registration_required = event_data.get("registration_required", False)
        registration_deadline = event_data.get("registration_deadline")
        is_public = event_data.get("is_public", True)
        poster_url = event_data.get("poster_url")
        contact_email = event_data.get("contact_email")
        contact_phone = event_data.get("contact_phone")
        
        if not all([title, event_date, start_time, end_time]):
            raise HTTPException(status_code=400, detail="Missing required fields: title, event_date, start_time, end_time")
        
        # Student Council events are auto-approved, others need approval
        status = "approved" if is_student_council or club.get("is_student_council") else "pending_approval"
        
        # Insert event
        cursor.execute(
            """
            INSERT INTO club_events (
                club_id, title, description, event_date, start_time, end_time,
                venue, event_type, max_participants, registration_required,
                registration_deadline, status, created_by, is_public,
                poster_url, contact_email, contact_phone
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                club_id, title, description, event_date, start_time, end_time,
                venue, event_type, max_participants, registration_required,
                registration_deadline, status, current_user["id"], is_public,
                poster_url, contact_email, contact_phone
            )
        )
        
        event_id = cursor.lastrowid
        connection.commit()
        
        # Send notification to Student Council if not auto-approved
        if status == "pending_approval":
            _notify_student_council(cursor, connection, club["name"], title, event_id)
        
        return {
            "event_id": event_id,
            "message": f"Event created successfully with status: {status}",
            "status": status,
            "club_name": club["name"]
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_club_events(club_id: int, status: Optional[str] = None, current_user=None):
    """Get all events for a specific club"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Build query
        where_clause = "ce.club_id = %s"
        params = [club_id]
        
        if status:
            where_clause += " AND ce.status = %s"
            params.append(status)
        
        # Only show approved events to non-members unless they're club admin or student council
        if current_user:
            cursor.execute(
                "SELECT id FROM clubs WHERE id = %s AND created_by = %s",
                (club_id, current_user["id"])
            )
            is_club_admin = cursor.fetchone() is not None
            
            cursor.execute(
                """
                SELECT cm.id FROM club_memberships cm
                JOIN clubs c ON c.id = cm.club_id
                WHERE cm.user_id = %s AND cm.status = 'approved' AND c.is_student_council = TRUE
                """,
                (current_user["id"],)
            )
            is_student_council = cursor.fetchone() is not None
            
            if not (is_club_admin or is_student_council or current_user.get("role") in ["admin", "faculty"]):
                where_clause += " AND ce.status = 'approved'"
        else:
            where_clause += " AND ce.status = 'approved'"
        
        cursor.execute(
            f"""
            SELECT ce.*, c.name as club_name, u.full_name as created_by_name,
                   (SELECT COUNT(*) FROM club_event_registrations WHERE event_id = ce.id) as registration_count
            FROM club_events ce
            JOIN clubs c ON c.id = ce.club_id
            LEFT JOIN users u ON u.id = ce.created_by
            WHERE {where_clause}
            ORDER BY ce.event_date DESC, ce.start_time DESC
            """,
            params
        )
        
        events = cursor.fetchall()
        return events
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_all_club_events(status: Optional[str] = None, from_date: Optional[str] = None, current_user=None):
    """Get all club events across all clubs (for Student Council dashboard)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        where_conditions = []
        params = []
        
        if status:
            where_conditions.append("ce.status = %s")
            params.append(status)
        
        if from_date:
            where_conditions.append("ce.event_date >= %s")
            params.append(from_date)
        else:
            # Default to upcoming events
            where_conditions.append("ce.event_date >= CURDATE()")
        
        # Only show approved events to regular users
        if current_user:
            cursor.execute(
                """
                SELECT cm.id FROM club_memberships cm
                JOIN clubs c ON c.id = cm.club_id
                WHERE cm.user_id = %s AND cm.status = 'approved' AND c.is_student_council = TRUE
                """,
                (current_user["id"],)
            )
            is_student_council = cursor.fetchone() is not None
            
            if not (is_student_council or current_user.get("role") in ["admin", "faculty"]):
                where_conditions.append("ce.status = 'approved'")
        else:
            where_conditions.append("ce.status = 'approved'")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        cursor.execute(
            f"""
            SELECT ce.*, c.name as club_name, c.category as club_category,
                   u.full_name as created_by_name,
                   (SELECT COUNT(*) FROM club_event_registrations WHERE event_id = ce.id) as registration_count
            FROM club_events ce
            JOIN clubs c ON c.id = ce.club_id
            LEFT JOIN users u ON u.id = ce.created_by
            WHERE {where_clause}
            ORDER BY ce.event_date ASC, ce.start_time ASC
            """,
            params
        )
        
        events = cursor.fetchall()
        return events
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def approve_club_event(event_id: int, approval_data: dict, current_user):
    """Approve or reject a club event (Student Council only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Check if user is in Student Council or admin/faculty
        cursor.execute(
            """
            SELECT cm.id FROM club_memberships cm
            JOIN clubs c ON c.id = cm.club_id
            WHERE cm.user_id = %s AND cm.status = 'approved' AND c.is_student_council = TRUE
            """,
            (current_user["id"],)
        )
        is_student_council = cursor.fetchone() is not None
        
        if not (is_student_council or current_user.get("role") in ["admin", "faculty"]):
            raise HTTPException(status_code=403, detail="Only Student Council members can approve events")
        
        # Get event details
        cursor.execute(
            """
            SELECT ce.*, c.name as club_name, c.created_by as club_admin_id
            FROM club_events ce
            JOIN clubs c ON c.id = ce.club_id
            WHERE ce.id = %s
            """,
            (event_id,)
        )
        event = cursor.fetchone()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        action = approval_data.get("action")  # 'approve' or 'reject'
        rejection_reason = approval_data.get("rejection_reason", "")
        
        if action == "approve":
            cursor.execute(
                """
                UPDATE club_events
                SET status = 'approved', approved_by = %s, approved_at = NOW()
                WHERE id = %s
                """,
                (current_user["id"], event_id)
            )
            
            # Notify club admin
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    event["club_admin_id"],
                    "Event Approved! 🎉",
                    f"Your event '{event['title']}' for {event['club_name']} has been approved by Student Council.",
                    "general",
                    "high"
                )
            )
            
            message = "Event approved successfully"
            
        elif action == "reject":
            cursor.execute(
                """
                UPDATE club_events
                SET status = 'rejected', approved_by = %s, approved_at = NOW(), rejection_reason = %s
                WHERE id = %s
                """,
                (current_user["id"], rejection_reason, event_id)
            )
            
            # Notify club admin
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    event["club_admin_id"],
                    "Event Requires Changes",
                    f"Your event '{event['title']}' needs revision. Reason: {rejection_reason}",
                    "general",
                    "medium"
                )
            )
            
            message = "Event rejected"
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
        
        connection.commit()
        return {"message": message, "event_id": event_id, "status": action}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def create_club_timeline(club_id: int, timeline_data: dict, current_user):
    """Create a recurring activity in club timeline"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Check authorization
        cursor.execute(
            "SELECT id, name, created_by FROM clubs WHERE id = %s AND is_active = TRUE",
            (club_id,)
        )
        club = cursor.fetchone()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        is_club_admin = club["created_by"] == current_user["id"]
        
        if not (is_club_admin or current_user.get("role") in ["admin", "faculty"]):
            raise HTTPException(status_code=403, detail="Not authorized to manage club timeline")
        
        # Parse timeline data
        activity_name = timeline_data.get("activity_name")
        description = timeline_data.get("description", "")
        day_of_week = timeline_data.get("day_of_week")
        start_time = timeline_data.get("start_time")
        end_time = timeline_data.get("end_time")
        venue = timeline_data.get("venue", "")
        activity_type = timeline_data.get("activity_type", "other")
        effective_from = timeline_data.get("effective_from")
        effective_until = timeline_data.get("effective_until")
        
        if not all([activity_name, day_of_week, start_time, end_time]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Insert timeline entry
        cursor.execute(
            """
            INSERT INTO club_timeline (
                club_id, activity_name, description, day_of_week,
                start_time, end_time, venue, activity_type,
                effective_from, effective_until, created_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                club_id, activity_name, description, day_of_week,
                start_time, end_time, venue, activity_type,
                effective_from, effective_until, current_user["id"]
            )
        )
        
        timeline_id = cursor.lastrowid
        connection.commit()
        
        return {
            "timeline_id": timeline_id,
            "message": "Timeline activity created successfully",
            "club_name": club["name"]
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_club_timeline(club_id: int, current_user=None):
    """Get recurring timeline for a club"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        cursor.execute(
            """
            SELECT ct.*, c.name as club_name, u.full_name as created_by_name
            FROM club_timeline ct
            JOIN clubs c ON c.id = ct.club_id
            LEFT JOIN users u ON u.id = ct.created_by
            WHERE ct.club_id = %s AND ct.is_active = TRUE
            ORDER BY 
                FIELD(ct.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
                ct.start_time
            """,
            (club_id,)
        )
        
        timeline = cursor.fetchall()
        return timeline
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def register_for_event(event_id: int, current_user):
    """Register for a club event"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Get event details
        cursor.execute(
            """
            SELECT ce.*, c.name as club_name
            FROM club_events ce
            JOIN clubs c ON c.id = ce.club_id
            WHERE ce.id = %s AND ce.status = 'approved'
            """,
            (event_id,)
        )
        event = cursor.fetchone()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found or not approved")
        
        # Check if registration is required
        if not event["registration_required"]:
            raise HTTPException(status_code=400, detail="This event does not require registration")
        
        # Check registration deadline
        if event["registration_deadline"]:
            deadline = event["registration_deadline"]
            if datetime.now() > deadline:
                raise HTTPException(status_code=400, detail="Registration deadline has passed")
        
        # Check if already registered
        cursor.execute(
            "SELECT id FROM club_event_registrations WHERE event_id = %s AND user_id = %s",
            (event_id, current_user["id"])
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already registered for this event")
        
        # Check max participants
        if event["max_participants"]:
            cursor.execute(
                "SELECT COUNT(*) as count FROM club_event_registrations WHERE event_id = %s",
                (event_id,)
            )
            current_count = cursor.fetchone()["count"]
            if current_count >= event["max_participants"]:
                raise HTTPException(status_code=400, detail="Event is full")
        
        # Register user
        cursor.execute(
            """
            INSERT INTO club_event_registrations (event_id, user_id)
            VALUES (%s, %s)
            """,
            (event_id, current_user["id"])
        )
        
        connection.commit()
        
        return {
            "message": f"Successfully registered for {event['title']}",
            "event_title": event["title"],
            "club_name": event["club_name"]
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_student_council_dashboard(current_user):
    """Get Student Council dashboard with all club events overview"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        # Check if user is in Student Council
        cursor.execute(
            """
            SELECT cm.id FROM club_memberships cm
            JOIN clubs c ON c.id = cm.club_id
            WHERE cm.user_id = %s AND cm.status = 'approved' AND c.is_student_council = TRUE
            """,
            (current_user["id"],)
        )
        if not cursor.fetchone() and current_user.get("role") not in ["admin", "faculty"]:
            raise HTTPException(status_code=403, detail="Student Council access only")
        
        # Get pending events count
        cursor.execute(
            "SELECT COUNT(*) as count FROM club_events WHERE status = 'pending_approval'"
        )
        pending_events = cursor.fetchone()["count"]
        
        # Get upcoming approved events
        cursor.execute(
            """
            SELECT COUNT(*) as count FROM club_events 
            WHERE status = 'approved' AND event_date >= CURDATE()
            """
        )
        upcoming_events = cursor.fetchone()["count"]
        
        # Get total active clubs
        cursor.execute(
            "SELECT COUNT(*) as count FROM clubs WHERE is_active = TRUE AND is_student_council = FALSE"
        )
        total_clubs = cursor.fetchone()["count"]
        
        # Get recent events by club
        cursor.execute(
            """
            SELECT c.name as club_name, c.category,
                   COUNT(ce.id) as event_count,
                   MAX(ce.event_date) as last_event_date
            FROM clubs c
            LEFT JOIN club_events ce ON ce.club_id = c.id AND ce.status = 'approved'
            WHERE c.is_active = TRUE AND c.is_student_council = FALSE
            GROUP BY c.id, c.name, c.category
            ORDER BY event_count DESC
            LIMIT 10
            """
        )
        club_activity = cursor.fetchall()
        
        # Get pending approvals
        cursor.execute(
            """
            SELECT ce.*, c.name as club_name, u.full_name as created_by_name
            FROM club_events ce
            JOIN clubs c ON c.id = ce.club_id
            LEFT JOIN users u ON u.id = ce.created_by
            WHERE ce.status = 'pending_approval'
            ORDER BY ce.created_at DESC
            LIMIT 20
            """
        )
        pending_approvals = cursor.fetchall()
        
        return {
            "stats": {
                "pending_events": pending_events,
                "upcoming_events": upcoming_events,
                "total_clubs": total_clubs
            },
            "club_activity": club_activity,
            "pending_approvals": pending_approvals
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def _notify_student_council(cursor, connection, club_name: str, event_title: str, event_id: int):
    """Send notification to Student Council members about new event"""
    try:
        # Get all Student Council members
        cursor.execute(
            """
            SELECT DISTINCT cm.user_id
            FROM club_memberships cm
            JOIN clubs c ON c.id = cm.club_id
            WHERE c.is_student_council = TRUE AND cm.status = 'approved'
            """
        )
        council_members = cursor.fetchall()
        
        for member in council_members:
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    member["user_id"],
                    "New Event Pending Approval",
                    f"{club_name} has submitted a new event '{event_title}' for approval.",
                    "general",
                    "medium"
                )
            )
        
        connection.commit()
    except Exception as e:
        print(f"Error notifying Student Council: {e}")

async def mark_student_council(club_id: int, current_user):
    """Mark a club as Student Council (Admin only)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_club_events_tables(cursor)
        
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access only")
        
        cursor.execute(
            "UPDATE clubs SET is_student_council = TRUE WHERE id = %s",
            (club_id,)
        )
        connection.commit()
        
        return {"message": "Club marked as Student Council successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
