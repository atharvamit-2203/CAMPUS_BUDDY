#!/usr/bin/env python3
"""
Club Events Calendar System
Allows clubs to manage their event calendars and sync with other clubs
Provides monthly calendar view with all club events
"""

from fastapi import HTTPException, Depends
from typing import Optional, List, Dict, Any
import mysql.connector
from datetime import datetime, date, time, timedelta
from calendar import monthrange
from database import get_mysql_connection
import auth

# =============================================================================
# CLUB EVENTS CALENDAR FUNCTIONS
# =============================================================================

def _ensure_calendar_tables(cursor):
    """Ensure calendar-related tables exist"""
    
    # Extend club_events table with calendar-specific fields
    try:
        cursor.execute("""
            ALTER TABLE club_events 
            ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
            ADD COLUMN recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
            ADD COLUMN recurrence_end_date DATE NULL,
            ADD COLUMN recurrence_days VARCHAR(20) NULL,
            ADD COLUMN calendar_color VARCHAR(7) DEFAULT '#3B82F6'
        """)
    except:
        pass  # Columns already exist
    
    # Create calendar_subscriptions table for clubs to follow other clubs' calendars
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subscriber_club_id INT NOT NULL,
            target_club_id INT NOT NULL,
            subscription_type ENUM('public_events', 'all_events') DEFAULT 'public_events',
            is_active BOOLEAN DEFAULT TRUE,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subscribed_by INT NOT NULL,
            FOREIGN KEY (subscriber_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            FOREIGN KEY (target_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            FOREIGN KEY (subscribed_by) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_subscription (subscriber_club_id, target_club_id),
            INDEX idx_subscriber (subscriber_club_id),
            INDEX idx_target (target_club_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Create event_calendar_sync table for tracking sync status
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_calendar_sync (
            id INT AUTO_INCREMENT PRIMARY KEY,
            club_id INT NOT NULL,
            last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
            events_synced INT DEFAULT 0,
            sync_errors TEXT,
            FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            INDEX idx_club_sync (club_id, last_sync)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Add calendar settings to clubs table
    try:
        cursor.execute("""
            ALTER TABLE clubs 
            ADD COLUMN calendar_public BOOLEAN DEFAULT TRUE,
            ADD COLUMN calendar_color VARCHAR(7) DEFAULT '#3B82F6',
            ADD COLUMN calendar_description TEXT
        """)
    except:
        pass  # Columns already exist

async def create_club_event_calendar(club_id: int, event_data: dict, current_user):
    """Create a club event with calendar integration"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_calendar_tables(cursor)
        
        # Check if user is authorized
        cursor.execute(
            """
            SELECT c.id, c.name, c.created_by, c.calendar_public
            FROM clubs c
            WHERE c.id = %s AND c.is_active = TRUE
            """,
            (club_id,)
        )
        club = cursor.fetchone()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check authorization (club admin or member)
        is_club_admin = club["created_by"] == current_user["id"]
        
        cursor.execute(
            "SELECT id FROM club_memberships WHERE club_id = %s AND user_id = %s AND status = 'approved'",
            (club_id, current_user["id"])
        )
        is_member = cursor.fetchone() is not None
        
        if not (is_club_admin or is_member or current_user.get("role") in ["admin", "faculty"]):
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
        is_public = event_data.get("is_public", True)
        calendar_color = event_data.get("calendar_color", "#3B82F6")
        
        # Recurring event fields
        is_recurring = event_data.get("is_recurring", False)
        recurrence_type = event_data.get("recurrence_type")  # daily, weekly, monthly, yearly
        recurrence_end_date = event_data.get("recurrence_end_date")
        recurrence_days = event_data.get("recurrence_days")  # For weekly: "1,3,5" (Mon, Wed, Fri)
        
        if not all([title, event_date, start_time, end_time]):
            raise HTTPException(status_code=400, detail="Missing required fields: title, event_date, start_time, end_time")
        
        # Insert main event
        cursor.execute(
            """
            INSERT INTO club_events (
                club_id, title, description, event_date, start_time, end_time,
                venue, event_type, max_participants, registration_required,
                status, created_by, is_public, calendar_color,
                is_recurring, recurrence_type, recurrence_end_date, recurrence_days
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'approved', %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                club_id, title, description, event_date, start_time, end_time,
                venue, event_type, max_participants, registration_required,
                current_user["id"], is_public, calendar_color,
                is_recurring, recurrence_type, recurrence_end_date, recurrence_days
            )
        )
        
        event_id = cursor.lastrowid
        
        # If recurring, create recurring instances
        if is_recurring and recurrence_type and recurrence_end_date:
            _create_recurring_events(cursor, event_id, event_data, recurrence_end_date)
        
        connection.commit()
        
        # Update sync status
        _update_calendar_sync(cursor, connection, club_id)
        
        return {
            "success": True,
            "message": "Event created successfully",
            "event_id": event_id,
            "is_recurring": is_recurring
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def _create_recurring_events(cursor, main_event_id: int, event_data: dict, end_date: str):
    """Create recurring event instances"""
    start_date = datetime.strptime(event_data["event_date"], "%Y-%m-%d").date()
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
    recurrence_type = event_data.get("recurrence_type")
    recurrence_days = event_data.get("recurrence_days", "").split(",") if event_data.get("recurrence_days") else []
    
    current_date = start_date
    instances_created = 0
    
    while current_date <= end_date_obj and instances_created < 100:  # Limit to 100 instances
        next_date = None
        
        if recurrence_type == "daily":
            next_date = current_date + timedelta(days=1)
        elif recurrence_type == "weekly":
            if recurrence_days:
                # Find next occurrence based on specified days
                for i in range(1, 8):
                    check_date = current_date + timedelta(days=i)
                    if str(check_date.weekday()) in recurrence_days:
                        next_date = check_date
                        break
            else:
                next_date = current_date + timedelta(weeks=1)
        elif recurrence_type == "monthly":
            next_month = current_date.replace(day=1) + timedelta(days=32)
            next_date = next_month.replace(day=min(current_date.day, monthrange(next_month.year, next_month.month)[1]))
        elif recurrence_type == "yearly":
            try:
                next_date = current_date.replace(year=current_date.year + 1)
            except ValueError:  # Handle leap year edge case
                next_date = current_date.replace(year=current_date.year + 1, month=2, day=28)
        
        if next_date and next_date <= end_date_obj:
            # Create recurring instance
            cursor.execute(
                """
                INSERT INTO club_events (
                    club_id, title, description, event_date, start_time, end_time,
                    venue, event_type, max_participants, registration_required,
                    status, created_by, is_public, calendar_color,
                    is_recurring, parent_event_id
                ) 
                SELECT club_id, title, description, %s, start_time, end_time,
                       venue, event_type, max_participants, registration_required,
                       status, created_by, is_public, calendar_color,
                       FALSE, %s
                FROM club_events WHERE id = %s
                """,
                (next_date.strftime("%Y-%m-%d"), main_event_id, main_event_id)
            )
            
            current_date = next_date
            instances_created += 1
        else:
            break

async def get_club_calendar(club_id: int, year: int, month: int, current_user):
    """Get club calendar for a specific month"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user has access to view this club's calendar
        cursor.execute(
            """
            SELECT c.id, c.name, c.calendar_public, c.calendar_color, c.calendar_description
            FROM clubs c
            WHERE c.id = %s AND c.is_active = TRUE
            """,
            (club_id,)
        )
        club = cursor.fetchone()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check access permissions
        can_view = club["calendar_public"]
        
        if not can_view:
            # Check if user is member or admin
            cursor.execute(
                "SELECT id FROM club_memberships WHERE club_id = %s AND user_id = %s AND status = 'approved'",
                (club_id, current_user["id"])
            )
            can_view = cursor.fetchone() is not None or current_user.get("role") in ["admin", "faculty"]
        
        if not can_view:
            raise HTTPException(status_code=403, detail="Access denied to this club's calendar")
        
        # Get events for the month
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        
        cursor.execute(
            """
            SELECT ce.*, u.full_name as created_by_name,
                   COUNT(cer.id) as registration_count
            FROM club_events ce
            LEFT JOIN users u ON ce.created_by = u.id
            LEFT JOIN club_event_registrations cer ON ce.id = cer.event_id AND cer.status = 'registered'
            WHERE ce.club_id = %s 
            AND ce.event_date >= %s 
            AND ce.event_date <= %s
            AND ce.status = 'approved'
            GROUP BY ce.id
            ORDER BY ce.event_date, ce.start_time
            """,
            (club_id, start_date, end_date)
        )
        
        events = cursor.fetchall()
        
        # Format events for calendar display
        calendar_events = []
        for event in events:
            calendar_events.append({
                "id": event["id"],
                "title": event["title"],
                "description": event["description"],
                "date": event["event_date"].strftime("%Y-%m-%d"),
                "start_time": str(event["start_time"]),
                "end_time": str(event["end_time"]),
                "venue": event["venue"],
                "event_type": event["event_type"],
                "color": event["calendar_color"],
                "is_public": event["is_public"],
                "registration_required": event["registration_required"],
                "registration_count": event["registration_count"],
                "max_participants": event["max_participants"],
                "created_by": event["created_by_name"],
                "is_recurring": event.get("is_recurring", False)
            })
        
        return {
            "club": {
                "id": club["id"],
                "name": club["name"],
                "calendar_color": club["calendar_color"],
                "description": club["calendar_description"]
            },
            "month": f"{year}-{month:02d}",
            "events": calendar_events
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_all_clubs_calendar(year: int, month: int, current_user, club_filter: Optional[List[int]] = None):
    """Get calendar view for all clubs or specific clubs for a month"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get date range
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        
        # Build club filter
        club_where = ""
        params = [start_date, end_date]
        
        if club_filter:
            placeholders = ",".join(["%s"] * len(club_filter))
            club_where = f"AND ce.club_id IN ({placeholders})"
            params.extend(club_filter)
        
        # Add college filter if user is not admin
        if current_user.get("role") != "admin":
            club_where += " AND c.college_id = %s"
            params.append(current_user.get("college_id"))
        
        # Get all club events for the month
        cursor.execute(
            f"""
            SELECT ce.*, c.name as club_name, c.calendar_color as club_color,
                   u.full_name as created_by_name,
                   COUNT(cer.id) as registration_count
            FROM club_events ce
            JOIN clubs c ON ce.club_id = c.id
            LEFT JOIN users u ON ce.created_by = u.id
            LEFT JOIN club_event_registrations cer ON ce.id = cer.event_id AND cer.status = 'registered'
            WHERE ce.event_date >= %s 
            AND ce.event_date <= %s
            AND ce.status = 'approved'
            AND ce.is_public = TRUE
            AND c.is_active = TRUE
            AND c.calendar_public = TRUE
            {club_where}
            GROUP BY ce.id
            ORDER BY ce.event_date, ce.start_time
            """,
            params
        )
        
        events = cursor.fetchall()
        
        # Group events by club
        clubs_calendar = {}
        all_events = []
        
        for event in events:
            club_id = event["club_id"]
            
            if club_id not in clubs_calendar:
                clubs_calendar[club_id] = {
                    "club_name": event["club_name"],
                    "club_color": event["club_color"] or "#3B82F6",
                    "events": []
                }
            
            event_data = {
                "id": event["id"],
                "title": event["title"],
                "description": event["description"],
                "date": event["event_date"].strftime("%Y-%m-%d"),
                "start_time": str(event["start_time"]),
                "end_time": str(event["end_time"]),
                "venue": event["venue"],
                "event_type": event["event_type"],
                "color": event["calendar_color"] or event["club_color"],
                "registration_required": event["registration_required"],
                "registration_count": event["registration_count"],
                "max_participants": event["max_participants"],
                "created_by": event["created_by_name"],
                "club_id": club_id,
                "club_name": event["club_name"]
            }
            
            clubs_calendar[club_id]["events"].append(event_data)
            all_events.append(event_data)
        
        return {
            "month": f"{year}-{month:02d}",
            "clubs": clubs_calendar,
            "all_events": all_events,
            "total_events": len(all_events)
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def subscribe_to_club_calendar(subscriber_club_id: int, target_club_id: int, current_user):
    """Subscribe one club to another club's calendar"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_calendar_tables(cursor)
        
        # Check if user is authorized to manage subscriber club
        cursor.execute(
            "SELECT id, name FROM clubs WHERE id = %s AND created_by = %s AND is_active = TRUE",
            (subscriber_club_id, current_user["id"])
        )
        subscriber_club = cursor.fetchone()
        
        if not subscriber_club and current_user.get("role") not in ["admin", "faculty"]:
            raise HTTPException(status_code=403, detail="Not authorized to manage this club")
        
        # Check if target club exists and has public calendar
        cursor.execute(
            "SELECT id, name, calendar_public FROM clubs WHERE id = %s AND is_active = TRUE",
            (target_club_id,)
        )
        target_club = cursor.fetchone()
        
        if not target_club:
            raise HTTPException(status_code=404, detail="Target club not found")
        
        if not target_club["calendar_public"]:
            raise HTTPException(status_code=400, detail="Target club's calendar is not public")
        
        # Check if subscription already exists
        cursor.execute(
            "SELECT id FROM calendar_subscriptions WHERE subscriber_club_id = %s AND target_club_id = %s",
            (subscriber_club_id, target_club_id)
        )
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already subscribed to this club's calendar")
        
        # Create subscription
        cursor.execute(
            """
            INSERT INTO calendar_subscriptions (
                subscriber_club_id, target_club_id, subscribed_by
            ) VALUES (%s, %s, %s)
            """,
            (subscriber_club_id, target_club_id, current_user["id"])
        )
        
        connection.commit()
        
        return {
            "success": True,
            "message": f"Successfully subscribed to {target_club['name']}'s calendar"
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_club_calendar_subscriptions(club_id: int, current_user):
    """Get all calendar subscriptions for a club"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check authorization
        cursor.execute(
            "SELECT id FROM clubs WHERE id = %s AND created_by = %s AND is_active = TRUE",
            (club_id, current_user["id"])
        )
        
        if not cursor.fetchone() and current_user.get("role") not in ["admin", "faculty"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get subscriptions
        cursor.execute(
            """
            SELECT cs.*, c.name as target_club_name, c.calendar_color,
                   u.full_name as subscribed_by_name
            FROM calendar_subscriptions cs
            JOIN clubs c ON cs.target_club_id = c.id
            LEFT JOIN users u ON cs.subscribed_by = u.id
            WHERE cs.subscriber_club_id = %s AND cs.is_active = TRUE
            ORDER BY cs.subscribed_at DESC
            """,
            (club_id,)
        )
        
        return cursor.fetchall()
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def update_club_calendar_settings(club_id: int, settings: dict, current_user):
    """Update club calendar settings"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_calendar_tables(cursor)
        
        # Check authorization
        cursor.execute(
            "SELECT id FROM clubs WHERE id = %s AND created_by = %s AND is_active = TRUE",
            (club_id, current_user["id"])
        )
        
        if not cursor.fetchone() and current_user.get("role") not in ["admin", "faculty"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update settings
        update_fields = []
        params = []
        
        if "calendar_public" in settings:
            update_fields.append("calendar_public = %s")
            params.append(settings["calendar_public"])
        
        if "calendar_color" in settings:
            update_fields.append("calendar_color = %s")
            params.append(settings["calendar_color"])
        
        if "calendar_description" in settings:
            update_fields.append("calendar_description = %s")
            params.append(settings["calendar_description"])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid settings provided")
        
        params.append(club_id)
        
        cursor.execute(
            f"UPDATE clubs SET {', '.join(update_fields)} WHERE id = %s",
            params
        )
        
        connection.commit()
        
        return {
            "success": True,
            "message": "Calendar settings updated successfully"
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_upcoming_events_all_clubs(current_user, days_ahead: int = 7, limit: int = 20):
    """Get upcoming events from all clubs the user has access to"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get user's club memberships
        cursor.execute(
            """
            SELECT DISTINCT cm.club_id
            FROM club_memberships cm
            WHERE cm.user_id = %s AND cm.status = 'approved'
            """,
            (current_user["id"],)
        )
        
        member_clubs = [row["club_id"] for row in cursor.fetchall()]
        
        # Build access condition
        access_condition = "ce.is_public = TRUE AND c.calendar_public = TRUE"
        params = [datetime.now().date(), datetime.now().date() + timedelta(days=days_ahead)]
        
        if member_clubs:
            placeholders = ",".join(["%s"] * len(member_clubs))
            access_condition += f" OR ce.club_id IN ({placeholders})"
            params.extend(member_clubs)
        
        # Add college filter
        if current_user.get("role") != "admin":
            college_condition = "AND c.college_id = %s"
            params.append(current_user.get("college_id"))
        else:
            college_condition = ""
        
        # Get upcoming events
        cursor.execute(
            f"""
            SELECT ce.*, c.name as club_name, c.calendar_color as club_color,
                   u.full_name as created_by_name,
                   COUNT(cer.id) as registration_count,
                   CASE WHEN cer_user.id IS NOT NULL THEN TRUE ELSE FALSE END as user_registered
            FROM club_events ce
            JOIN clubs c ON ce.club_id = c.id
            LEFT JOIN users u ON ce.created_by = u.id
            LEFT JOIN club_event_registrations cer ON ce.id = cer.event_id AND cer.status = 'registered'
            LEFT JOIN club_event_registrations cer_user ON ce.id = cer_user.event_id 
                AND cer_user.user_id = %s AND cer_user.status = 'registered'
            WHERE ce.event_date >= %s 
            AND ce.event_date <= %s
            AND ce.status = 'approved'
            AND c.is_active = TRUE
            AND ({access_condition})
            {college_condition}
            GROUP BY ce.id
            ORDER BY ce.event_date, ce.start_time
            LIMIT %s
            """,
            [current_user["id"]] + params + [limit]
        )
        
        events = cursor.fetchall()
        
        # Format events
        formatted_events = []
        for event in events:
            formatted_events.append({
                "id": event["id"],
                "title": event["title"],
                "description": event["description"],
                "date": event["event_date"].strftime("%Y-%m-%d"),
                "start_time": str(event["start_time"]),
                "end_time": str(event["end_time"]),
                "venue": event["venue"],
                "event_type": event["event_type"],
                "color": event["calendar_color"] or event["club_color"],
                "club_id": event["club_id"],
                "club_name": event["club_name"],
                "registration_required": event["registration_required"],
                "registration_count": event["registration_count"],
                "max_participants": event["max_participants"],
                "user_registered": bool(event["user_registered"]),
                "created_by": event["created_by_name"]
            })
        
        return {
            "events": formatted_events,
            "total_events": len(formatted_events),
            "date_range": {
                "from": datetime.now().date().strftime("%Y-%m-%d"),
                "to": (datetime.now().date() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            }
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def _update_calendar_sync(cursor, connection, club_id: int):
    """Update calendar sync status for a club"""
    try:
        cursor.execute(
            """
            INSERT INTO event_calendar_sync (club_id, last_sync, sync_status, events_synced)
            VALUES (%s, NOW(), 'success', 1)
            ON DUPLICATE KEY UPDATE
            last_sync = NOW(),
            sync_status = 'success',
            events_synced = events_synced + 1
            """,
            (club_id,)
        )
        connection.commit()
    except:
        pass  # Ignore sync update errors