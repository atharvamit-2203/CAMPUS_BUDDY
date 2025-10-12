#!/usr/bin/env python3
"""
Comprehensive Clubs API - Replaces Organizations functionality
All organization endpoints are now mapped to clubs with enhanced features
"""

from fastapi import HTTPException, Depends
from typing import Optional, List
import mysql.connector
from database import get_mysql_connection
import auth

# =============================================================================
# CLUBS ENDPOINTS (Replacing Organizations)
# =============================================================================

async def get_all_clubs(current_user):
    """Get all clubs with membership status for current user (replaces /organizations)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
        
        # Get all active clubs
        cursor.execute(
            """
            SELECT c.*, 
                   u.full_name as created_by_name,
                   u.email as contact_email_fallback
            FROM clubs c
            LEFT JOIN users u ON u.id = c.created_by
            WHERE (c.college_id = %s OR %s IS NULL) AND c.is_active = TRUE 
            ORDER BY c.featured DESC, c.name ASC
            """,
            (college_id, college_id)
        )
        clubs = cursor.fetchall()
        
        # Add member count and membership status for each club
        for club in clubs:
            # Get member count
            cursor.execute(
                "SELECT COUNT(*) as member_count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                (club["id"],)
            )
            count_result = cursor.fetchone()
            club["member_count"] = count_result["member_count"] if count_result else 0
            
            # Get membership status for current user
            cursor.execute(
                "SELECT status FROM club_memberships WHERE club_id = %s AND user_id = %s",
                (club["id"], user_id)
            )
            membership = cursor.fetchone()
            club["membership_status"] = membership.get("status") if membership else None
            club["is_member"] = club["membership_status"] in ("approved", "member")
            
            # Set organization_name for frontend compatibility
            club["organization_name"] = club["name"]
            
        return clubs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_detailed_clubs(current_user):
    """Get detailed clubs info (replaces /organizations/detailed)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        college_id = current_user.get("college_id")
        user_id = current_user.get("id")
        
        # Get detailed club information
        cursor.execute(
            """
            SELECT c.*, 
                   u.full_name as head_name,
                   u.email as head_email,
                   u.phone as head_phone
            FROM clubs c
            LEFT JOIN users u ON u.id = c.created_by
            WHERE c.is_active = TRUE 
            ORDER BY c.featured DESC, c.member_count DESC, c.name ASC
            """
        )
        clubs = cursor.fetchall()
        
        for club in clubs:
            # Add head info
            club["head"] = {
                "name": club.get("head_name"),
                "email": club.get("head_email"),
                "phone": club.get("head_phone")
            }
            
            # Get member count
            cursor.execute(
                "SELECT COUNT(*) as count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                (club["id"],)
            )
            count_result = cursor.fetchone()
            club["member_count"] = count_result["count"] if count_result else 0
            
            # Get membership status for current user
            if user_id:
                cursor.execute(
                    "SELECT status FROM club_memberships WHERE club_id = %s AND user_id = %s",
                    (club["id"], user_id)
                )
                membership = cursor.fetchone()
                club["membership_status"] = membership.get("status") if membership else None
            else:
                club["membership_status"] = None
            
            # Get departments of members
            cursor.execute(
                """
                SELECT DISTINCT COALESCE(u.department, 'General') as dept
                FROM club_memberships cm
                JOIN users u ON u.id = cm.user_id
                WHERE cm.club_id = %s AND cm.status = 'approved'
                AND u.department IS NOT NULL AND u.department != ''
                ORDER BY dept
                """,
                (club["id"],)
            )
            club["departments"] = [row["dept"] for row in cursor.fetchall()]
            
            # Set organization_name for compatibility
            club["organization_name"] = club["name"]
            
        return clubs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def apply_to_club(club_id: int, application_data: dict, current_user):
    """Apply to join a club (replaces /organizations/{org_id}/apply)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply to clubs")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if club exists
        cursor.execute("SELECT id, name, max_members FROM clubs WHERE id = %s AND is_active = TRUE", (club_id,))
        club = cursor.fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check if already applied or member
        cursor.execute(
            "SELECT id, status FROM club_memberships WHERE club_id = %s AND user_id = %s",
            (club_id, current_user["id"])
        )
        existing = cursor.fetchone()
        
        if existing:
            if existing["status"] == "approved":
                raise HTTPException(status_code=400, detail="Already a member")
            elif existing["status"] == "pending":
                raise HTTPException(status_code=400, detail="Application already pending")
        
        # Check if club is full
        if club.get("max_members"):
            cursor.execute(
                "SELECT COUNT(*) as count FROM club_memberships WHERE club_id = %s AND status = 'approved'",
                (club_id,)
            )
            current_members = cursor.fetchone()["count"]
            if current_members >= club["max_members"]:
                raise HTTPException(status_code=400, detail="Club is full")
        
        # Create membership application
        application_message = application_data.get("message", f"Application to join {club['name']}")
        
        if existing:
            # Update existing application
            cursor.execute(
                """
                UPDATE club_memberships 
                SET status = 'pending', joined_at = NOW(), application_message = %s
                WHERE id = %s
                """,
                (application_message, existing["id"])
            )
        else:
            # Create new application
            cursor.execute(
                """
                INSERT INTO club_memberships (club_id, user_id, status, joined_at, application_message)
                VALUES (%s, %s, 'pending', NOW(), %s)
                """,
                (club_id, current_user["id"], application_message)
            )
        
        connection.commit()
        return {"message": f"Successfully applied to join {club['name']}", "status": "pending"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def join_club_simple(club_id: int, current_user):
    """Simple join club endpoint (replaces /organizations/{org_id}/join)"""
    return await apply_to_club(club_id, {"message": "Quick join request"}, current_user)

async def get_my_clubs(current_user):
    """Get clubs the current user is a member of (replaces /organizations/my)"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT c.id, c.name, c.description, c.category, c.organization_type,
                   cm.joined_at, cm.status, c.meeting_time, c.meeting_location
            FROM clubs c
            JOIN club_memberships cm ON c.id = cm.club_id
            WHERE cm.user_id = %s AND cm.status = 'approved'
            ORDER BY cm.joined_at DESC
            """,
            (current_user["id"],)
        )
        clubs = cursor.fetchall()
        
        # Add organization_name for compatibility
        for club in clubs:
            club["organization_name"] = club["name"]
            
        return clubs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_my_managed_clubs(current_user):
    """Get clubs managed by current user (replaces /organizations/mine)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT c.*, 
                   (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id AND status = 'approved') as member_count,
                   (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id AND status = 'pending') as pending_count
            FROM clubs c
            WHERE c.created_by = %s AND c.is_active = TRUE
            ORDER BY c.name
            """,
            (current_user["id"],)
        )
        clubs = cursor.fetchall()
        
        # Add organization_name for compatibility
        for club in clubs:
            club["organization_name"] = club["name"]
            
        return clubs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_club_members(club_id: int, status: Optional[str] = None, current_user=None):
    """Get members of a club (replaces /organizations/{org_id}/members)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user has permission to view members
        cursor.execute(
            "SELECT id FROM clubs WHERE id = %s AND created_by = %s",
            (club_id, current_user["id"])
        )
        if not cursor.fetchone() and current_user.get("role") not in ["admin", "faculty"]:
            raise HTTPException(status_code=403, detail="Not authorized to view club members")
        
        # Build query based on status filter
        where_clause = "cm.club_id = %s"
        params = [club_id]
        
        if status:
            statuses = [s.strip() for s in status.split(",")]
            placeholders = ",".join(["%s"] * len(statuses))
            where_clause += f" AND cm.status IN ({placeholders})"
            params.extend(statuses)
        
        cursor.execute(
            f"""
            SELECT u.id, u.full_name, u.email, u.phone, u.course, u.semester, u.department,
                   cm.status, cm.joined_at, cm.application_message
            FROM club_memberships cm
            JOIN users u ON u.id = cm.user_id
            WHERE {where_clause}
            ORDER BY cm.joined_at DESC
            """,
            params
        )
        
        return cursor.fetchall()
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def update_member_status(user_id: int, payload: dict, current_user):
    """Update a member's status in clubs (replaces /organizations/members/{user_id}/status)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        new_status = payload.get("status")
        # Map frontend status values to backend values
        status_mapping = {
            "approved": "approved",
            "rejected": "rejected", 
            "pending": "pending",
            "active": "approved",  # Frontend "active" means approved/selected
            "shortlisted": "pending",  # Frontend "shortlisted" keeps as pending but sends notification
            "selected": "approved"  # Frontend "selected" means approved
        }
        
        frontend_status = new_status
        backend_status = status_mapping.get(new_status, new_status)
        
        # Allow all valid frontend statuses
        valid_frontend_statuses = ["approved", "rejected", "pending", "active", "shortlisted", "selected"]
        valid_backend_statuses = ["approved", "rejected", "pending"]
        
        if frontend_status not in valid_frontend_statuses or backend_status not in valid_backend_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}. Valid statuses: {valid_frontend_statuses}")
        
        # First, find all clubs owned by the current user
        cursor.execute(
            "SELECT id FROM clubs WHERE created_by = %s",
            (current_user["id"],)
        )
        owned_clubs = cursor.fetchall()
        
        if not owned_clubs:
            raise HTTPException(status_code=403, detail="You don't own any clubs")
        
        club_ids = [club['id'] for club in owned_clubs]
        placeholders = ','.join(['%s'] * len(club_ids))
        
        # Look for membership in club_memberships table
        cursor.execute(
            f"""
            SELECT cm.id, cm.club_id, c.name as club_name, u.full_name as user_name, 'club_membership' as source_table
            FROM club_memberships cm
            JOIN clubs c ON c.id = cm.club_id
            JOIN users u ON u.id = cm.user_id
            WHERE cm.user_id = %s AND cm.club_id IN ({placeholders})
            """,
            [user_id] + club_ids
        )
        membership = cursor.fetchone()
        
        # If not found in club_memberships, check organization_applications
        if not membership:
            cursor.execute(
                f"""
                SELECT oa.id, oa.club_id, c.name as club_name, u.full_name as user_name, 'organization_application' as source_table
                FROM organization_applications oa
                JOIN clubs c ON c.id = oa.club_id
                JOIN users u ON u.id = oa.user_id
                WHERE oa.user_id = %s AND oa.club_id IN ({placeholders})
                """,
                [user_id] + club_ids
            )
            membership = cursor.fetchone()
        
        if not membership:
            raise HTTPException(status_code=404, detail=f"No application found for user {user_id} in your clubs")
        
        membership['is_org_application'] = membership['source_table'] == 'organization_application'
        
        # Update status in the appropriate table
        if membership.get('is_org_application'):
            cursor.execute(
                """
                UPDATE organization_applications 
                SET status = %s, reviewed_by = %s, reviewed_at = NOW()
                WHERE id = %s
                """,
                (backend_status, current_user["id"], membership["id"])
            )
        else:
            cursor.execute(
                """
                UPDATE club_memberships 
                SET status = %s, reviewed_by = %s, reviewed_at = NOW()
                WHERE id = %s
                """,
                (backend_status, current_user["id"], membership["id"])
            )
        
        # Send notification based on the action
        org_name = membership['club_name']
        user_name = membership['user_name']
        
        if frontend_status == 'pending' or frontend_status == 'shortlisted':  # Shortlisted for interview
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "🌟 You've been shortlisted!",
                    f"Congratulations! You have been shortlisted for an interview with {org_name}. We were impressed with your application and would like to learn more about you. Please check your email for further details about the interview process.",
                    "general",
                    "high"
                )
            )
        elif frontend_status == 'active' or backend_status == 'approved':  # Selected/Approved
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "🎉 Congratulations! You've been selected!",
                    f"Great news! You have been selected to join {org_name}. Welcome to the team! We're excited to have you on board and look forward to working with you.",
                    "general",
                    "high"
                )
            )
        elif backend_status == 'rejected':
            cursor.execute(
                """
                INSERT INTO notifications (user_id, title, message, type, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "Application Update",
                    f"Thank you for your interest in {org_name}. After careful consideration, we have decided to move forward with other candidates at this time. We encourage you to apply for future opportunities.",
                    "general",
                    "medium"
                )
            )
        
        return {"message": f"Member status updated to {frontend_status}", "club": membership["club_name"]}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
        if 'connection' in locals():
            connection.close()

async def get_my_club_stats(current_user):
    """Get statistics for clubs managed by current user (replaces /organizations/mine/stats)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get clubs managed by user
        cursor.execute(
            "SELECT id, name FROM clubs WHERE created_by = %s AND is_active = TRUE",
            (current_user["id"],)
        )
        clubs = cursor.fetchall()
        
        if not clubs:
            return {"members": 0, "events": 0, "upcoming_events": 0, "applications": 0}
        
        club_ids = [club["id"] for club in clubs]
        placeholders = ",".join(["%s"] * len(club_ids))
        
        # Get total members
        cursor.execute(
            f"SELECT COUNT(*) as count FROM club_memberships WHERE club_id IN ({placeholders}) AND status = 'approved'",
            club_ids
        )
        members_count = cursor.fetchone()["count"]
        
        # Get pending applications
        cursor.execute(
            f"SELECT COUNT(*) as count FROM club_memberships WHERE club_id IN ({placeholders}) AND status = 'pending'",
            club_ids
        )
        applications_count = cursor.fetchone()["count"]
        
        # Get events (if events table exists and has club_id)
        events_count = 0
        upcoming_events = 0
        try:
            cursor.execute("SHOW COLUMNS FROM events LIKE 'club_id'")
            if cursor.fetchone():
                cursor.execute(
                    f"SELECT COUNT(*) as count FROM events WHERE club_id IN ({placeholders})",
                    club_ids
                )
                events_count = cursor.fetchone()["count"]
                
                cursor.execute(
                    f"SELECT COUNT(*) as count FROM events WHERE club_id IN ({placeholders}) AND date >= CURDATE()",
                    club_ids
                )
                upcoming_events = cursor.fetchone()["count"]
        except:
            pass
        
        return {
            "members": members_count,
            "events": events_count,
            "upcoming_events": upcoming_events,
            "applications": applications_count,
            "clubs_managed": len(clubs)
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def create_recruitment_post(club_id: int, data: dict, current_user):
    """Create a recruitment post for a club (replaces /organizations/{org_id}/recruitment-post)"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user owns the club
        cursor.execute(
            "SELECT id, name FROM clubs WHERE id = %s AND created_by = %s",
            (club_id, current_user["id"])
        )
        club = cursor.fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="Club not found or not authorized")
        
        # Create notification/announcement
        title = data.get("title", f"{club['name']} is recruiting!")
        message = data.get("message", f"Join {club['name']} and be part of something amazing!")
        
        # Insert into notifications table if it exists
        try:
            cursor.execute("SHOW TABLES LIKE 'notifications'")
            if cursor.fetchone():
                cursor.execute(
                    """
                    INSERT INTO notifications (title, message, type, created_by, target_role, club_id)
                    VALUES (%s, %s, 'recruitment', %s, 'student', %s)
                    """,
                    (title, message, current_user["id"], club_id)
                )
        except:
            pass
        
        # Mark club as actively recruiting
        cursor.execute(
            "UPDATE clubs SET is_recruiting = TRUE WHERE id = %s",
            (club_id,)
        )
        
        connection.commit()
        return {"message": "Recruitment post created successfully", "club": club["name"]}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# =============================================================================
# CLUB SEARCH AND FILTERING
# =============================================================================

async def search_clubs(current_user, query: str = "", category: str = ""):
    """Search and filter clubs"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        where_conditions = ["c.is_active = TRUE"]
        params = []
        
        if current_user.get("college_id"):
            where_conditions.append("c.college_id = %s")
            params.append(current_user["college_id"])
        
        if query:
            where_conditions.append("(c.name LIKE %s OR c.description LIKE %s)")
            params.extend([f"%{query}%", f"%{query}%"])
        
        if category:
            where_conditions.append("c.category = %s")
            params.append(category)
        
        where_clause = " AND ".join(where_conditions)
        
        cursor.execute(
            f"""
            SELECT c.*, 
                   (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id AND status = 'approved') as member_count
            FROM clubs c
            WHERE {where_clause}
            ORDER BY c.featured DESC, member_count DESC, c.name ASC
            """,
            params
        )
        
        clubs = cursor.fetchall()
        
        # Add organization_name for compatibility
        for club in clubs:
            club["organization_name"] = club["name"]
            
        return clubs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_club_categories():
    """Get all available club categories"""
    return [
        "academic", "arts", "business", "cultural", "entertainment",
        "entrepreneurship", "fitness", "intellectual", "service",
        "social", "sports", "technology", "general"
    ]