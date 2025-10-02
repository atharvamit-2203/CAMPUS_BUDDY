"""
Additional API endpoints for Campus Connect
These endpoints support the dynamic frontend features like timetable, skills, resources, and notices
"""

from fastapi import HTTPException, Depends, status
from typing import List, Optional
import mysql.connector
from datetime import datetime, date
from database import get_mysql_connection
import auth
import schemas

# ============================================================================
# TIMETABLE ENDPOINTS
# ============================================================================

def get_student_timetable(current_user = Depends(auth.get_current_user)):
    """Get student's weekly timetable.
    Preference order:
    1) If the student has uploaded a personal timetable (user_timetable_entries), use it.
    2) Otherwise, fall back to course/semester timetable from the shared timetable table.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view timetables")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)

        # Days scaffold
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekly_schedule = {d: [] for d in days}

        # 1) Try user-specific uploaded timetable first
        try:
            cursor.execute(
                """
                SELECT day_of_week, start_time, end_time, subject, room, faculty
                FROM user_timetable_entries
                WHERE user_id = %s
                ORDER BY FIELD(day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time
                """,
                (current_user["id"],)
            )
            personal = cursor.fetchall()
        except Exception:
            personal = []

        if personal:
            for r in personal:
                d = r.get('day_of_week')
                if d in weekly_schedule:
                    weekly_schedule[d].append({
                        "time": f"{r['start_time']} - {r['end_time']}",
                        "subject": r.get('subject'),
                        "faculty": r.get('faculty'),
                        "room": r.get('room'),
                        "location": None,
                        "type": "class"
                    })
            return {"timetable": weekly_schedule, "source": "personal"}

        # 2) Fallback to course+semester timetable
        cursor.execute(
            """
            SELECT course, semester, department FROM users 
            WHERE id = %s
            """,
            (current_user["id"],)
        )
        student_info = cursor.fetchone()
        if not student_info:
            raise HTTPException(status_code=404, detail="Student information not found")

        cursor.execute(
            """
            SELECT t.*, s.name as subject_name, s.code as subject_code,
                   f.full_name as faculty_name, r.name as room_name, r.location
            FROM timetable t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users f ON t.faculty_id = f.id
            LEFT JOIN rooms r ON t.room_id = r.id
            WHERE t.course = %s AND t.semester = %s
            ORDER BY t.day_of_week, t.start_time
            """,
            (student_info["course"], student_info["semester"])
        )
        timetable = cursor.fetchall()

        for entry in timetable:
            day = entry["day_of_week"]
            if day in weekly_schedule:
                weekly_schedule[day].append({
                    "time": f"{entry['start_time']} - {entry['end_time']}",
                    "subject": entry["subject_name"] or "Free Period",
                    "subject_code": entry["subject_code"],
                    "faculty": entry["faculty_name"],
                    "room": entry["room_name"],
                    "location": entry["location"],
                    "type": entry["class_type"]
                })
        return {"timetable": weekly_schedule, "student_info": student_info, "source": "course"}
    except mysql.connector.Error as e:
        return {"timetable": {}, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def get_faculty_timetable(current_user = Depends(auth.get_current_user)):
    """Get faculty's weekly timetable"""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can view their timetables")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT t.*, s.name as subject_name, s.code as subject_code,
                   r.name as room_name, r.location
            FROM timetable t
            LEFT JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN rooms r ON t.room_id = r.id
            WHERE t.faculty_id = %s
            ORDER BY t.day_of_week, t.start_time
            """,
            (current_user["id"],)
        )
        timetable = cursor.fetchall()
        
        # Group by day of week
        weekly_schedule = {}
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for day in days:
            weekly_schedule[day] = []
        
        for entry in timetable:
            day = entry["day_of_week"]
            if day in weekly_schedule:
                weekly_schedule[day].append({
                    "time": f"{entry['start_time']} - {entry['end_time']}",
                    "subject": entry["subject_name"],
                    "subject_code": entry["subject_code"],
                    "room": entry["room_name"],
                    "location": entry["location"],
                    "course": entry["course"],
                    "semester": entry["semester"],
                    "type": entry["class_type"]
                })
        
        return {"timetable": weekly_schedule}
    except mysql.connector.Error as e:
        return {"timetable": {}, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def update_timetable_entry(entry_data: dict, current_user = Depends(auth.get_current_user)):
    """Update timetable entry (Faculty/Admin only)"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can update timetable")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if faculty is updating their own entry or if admin
        if current_user.get("role") == "faculty":
            cursor.execute(
                "SELECT * FROM timetable WHERE id = %s AND faculty_id = %s",
                (entry_data["id"], current_user["id"])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="You can only update your own timetable entries")
        
        cursor.execute(
            """
            UPDATE timetable 
            SET subject_id = %s, room_id = %s, start_time = %s, end_time = %s, class_type = %s
            WHERE id = %s
            """,
            (entry_data["subject_id"], entry_data["room_id"], entry_data["start_time"],
             entry_data["end_time"], entry_data["class_type"], entry_data["id"])
        )
        connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Timetable entry not found")
        
        return {"message": "Timetable entry updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# SKILLS TRACKING ENDPOINTS
# ============================================================================

def get_student_skills(current_user = Depends(auth.get_current_user)):
    """Get student's skills and progress"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view their skills")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get student's skills
        cursor.execute(
            """
            SELECT ss.*, s.name as skill_name, s.category, s.description
            FROM student_skills ss
            JOIN skills s ON ss.skill_id = s.id
            WHERE ss.student_id = %s
            ORDER BY ss.proficiency_level DESC, s.category
            """,
            (current_user["id"],)
        )
        skills = cursor.fetchall()
        
        # Get certifications
        cursor.execute(
            """
            SELECT * FROM student_certifications
            WHERE student_id = %s
            ORDER BY completion_date DESC
            """,
            (current_user["id"],)
        )
        certifications = cursor.fetchall()
        
        # Get learning recommendations
        cursor.execute(
            """
            SELECT DISTINCT s.* FROM skills s
            LEFT JOIN student_skills ss ON s.id = ss.skill_id AND ss.student_id = %s
            WHERE ss.skill_id IS NULL
            AND s.category IN (
                SELECT DISTINCT s2.category FROM student_skills ss2
                JOIN skills s2 ON ss2.skill_id = s2.id
                WHERE ss2.student_id = %s
            )
            LIMIT 10
            """,
            (current_user["id"], current_user["id"])
        )
        recommendations = cursor.fetchall()
        
        return {
            "skills": skills,
            "certifications": certifications,
            "recommendations": recommendations
        }
    except mysql.connector.Error as e:
        return {"skills": [], "certifications": [], "recommendations": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def add_student_skill(skill_data: dict, current_user = Depends(auth.get_current_user)):
    """Add or update student skill"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can add skills")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if skill already exists for student
        cursor.execute(
            "SELECT * FROM student_skills WHERE student_id = %s AND skill_id = %s",
            (current_user["id"], skill_data["skill_id"])
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing skill
            cursor.execute(
                """
                UPDATE student_skills 
                SET proficiency_level = %s, updated_at = NOW()
                WHERE student_id = %s AND skill_id = %s
                """,
                (skill_data["proficiency_level"], current_user["id"], skill_data["skill_id"])
            )
        else:
            # Add new skill
            cursor.execute(
                """
                INSERT INTO student_skills (student_id, skill_id, proficiency_level, added_at)
                VALUES (%s, %s, %s, NOW())
                """,
                (current_user["id"], skill_data["skill_id"], skill_data["proficiency_level"])
            )
        
        connection.commit()
        return {"message": "Skill updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def add_certification(cert_data: dict, current_user = Depends(auth.get_current_user)):
    """Add student certification"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can add certifications")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO student_certifications 
            (student_id, certification_name, issuing_organization, completion_date, 
             certificate_url, skills_gained)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (current_user["id"], cert_data["name"], cert_data["organization"],
             cert_data["completion_date"], cert_data.get("certificate_url"),
             cert_data.get("skills_gained"))
        )
        connection.commit()
        
        return {"message": "Certification added successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# RESOURCES ENDPOINTS
# ============================================================================

def get_learning_resources(current_user = Depends(auth.get_current_user)):
    """Get learning resources for current user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get user's subjects/interests for personalized resources
        if current_user.get("role") == "student":
            cursor.execute(
                """
                SELECT course, semester, department FROM users 
                WHERE id = %s
                """,
                (current_user["id"],)
            )
            user_info = cursor.fetchone()
            
            # Get resources for student's course and semester
            cursor.execute(
                """
                SELECT lr.*, s.name as subject_name, u.full_name as uploaded_by_name
                FROM learning_resources lr
                LEFT JOIN subjects s ON lr.subject_id = s.id
                LEFT JOIN users u ON lr.uploaded_by = u.id
                WHERE (lr.target_course = %s OR lr.target_course IS NULL)
                AND (lr.target_semester = %s OR lr.target_semester IS NULL)
                AND lr.is_active = 1
                ORDER BY lr.resource_type, lr.upload_date DESC
                """,
                (user_info["course"], user_info["semester"])
            )
        else:
            # For faculty/admin, get all resources
            cursor.execute(
                """
                SELECT lr.*, s.name as subject_name, u.full_name as uploaded_by_name
                FROM learning_resources lr
                LEFT JOIN subjects s ON lr.subject_id = s.id
                LEFT JOIN users u ON lr.uploaded_by = u.id
                WHERE lr.is_active = 1
                ORDER BY lr.resource_type, lr.upload_date DESC
                """,
            )
        
        resources = cursor.fetchall()
        
        # Group by resource type
        grouped_resources = {}
        for resource in resources:
            resource_type = resource["resource_type"]
            if resource_type not in grouped_resources:
                grouped_resources[resource_type] = []
            grouped_resources[resource_type].append(resource)
        
        return {"resources": grouped_resources, "all_resources": resources}
    except mysql.connector.Error as e:
        return {"resources": {}, "all_resources": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def upload_resource(resource_data: dict, current_user = Depends(auth.get_current_user)):
    """Upload learning resource (Faculty/Admin only)"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can upload resources")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO learning_resources 
            (title, description, resource_type, file_path, file_url, subject_id,
             target_course, target_semester, uploaded_by, upload_date, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 1)
            """,
            (resource_data["title"], resource_data["description"], resource_data["resource_type"],
             resource_data.get("file_path"), resource_data.get("file_url"), resource_data.get("subject_id"),
             resource_data.get("target_course"), resource_data.get("target_semester"), current_user["id"])
        )
        connection.commit()
        
        return {"message": "Resource uploaded successfully", "resource_id": cursor.lastrowid}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def download_resource(resource_id: int, current_user = Depends(auth.get_current_user)):
    """Track resource download"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get resource info
        cursor.execute(
            "SELECT * FROM learning_resources WHERE id = %s AND is_active = 1",
            (resource_id,)
        )
        resource = cursor.fetchone()
        
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Track download
        cursor.execute(
            """
            INSERT INTO resource_downloads (resource_id, user_id, download_date)
            VALUES (%s, %s, NOW())
            """,
            (resource_id, current_user["id"])
        )
        
        # Update download count
        cursor.execute(
            "UPDATE learning_resources SET download_count = download_count + 1 WHERE id = %s",
            (resource_id,)
        )
        
        connection.commit()
        
        return {
            "message": "Download tracked successfully",
            "resource": resource
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# ============================================================================
# NOTICES ENDPOINTS
# ============================================================================

def get_notices(current_user = Depends(auth.get_current_user)):
    """Get notices for current user"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT n.*, u.full_name as created_by_name, u.role as creator_role,
                   nr.read_at, nr.is_read
            FROM notices n
            JOIN users u ON n.created_by = u.id
            LEFT JOIN notice_reads nr ON n.id = nr.notice_id AND nr.user_id = %s
            WHERE (n.target_role = 'all' OR n.target_role = %s)
            AND (n.college_id IS NULL OR n.college_id = %s)
            AND n.is_active = 1
            ORDER BY n.priority DESC, n.created_at DESC
            """,
            (current_user["id"], current_user["role"], current_user.get("college_id"))
        )
        notices = cursor.fetchall()
        
        # Group by category
        grouped_notices = {}
        for notice in notices:
            category = notice["category"]
            if category not in grouped_notices:
                grouped_notices[category] = []
            grouped_notices[category].append(notice)
        
        return {"notices": grouped_notices, "all_notices": notices}
    except mysql.connector.Error as e:
        return {"notices": {}, "all_notices": [], "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def create_notice(notice_data: dict, current_user = Depends(auth.get_current_user)):
    """Create notice (Faculty/Admin only)"""
    if current_user.get("role") not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can create notices")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            INSERT INTO notices 
            (title, content, category, priority, target_role, college_id, 
             created_by, created_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), 1)
            """,
            (notice_data["title"], notice_data["content"], notice_data["category"],
             notice_data.get("priority", "normal"), notice_data.get("target_role", "all"),
             current_user.get("college_id"), current_user["id"])
        )
        connection.commit()
        
        return {"message": "Notice created successfully", "notice_id": cursor.lastrowid}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def mark_notice_read(notice_id: int, current_user = Depends(auth.get_current_user)):
    """Mark notice as read"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if already marked as read
        cursor.execute(
            "SELECT * FROM notice_reads WHERE notice_id = %s AND user_id = %s",
            (notice_id, current_user["id"])
        )
        existing = cursor.fetchone()
        
        if not existing:
            cursor.execute(
                """
                INSERT INTO notice_reads (notice_id, user_id, read_at, is_read)
                VALUES (%s, %s, NOW(), 1)
                """,
                (notice_id, current_user["id"])
            )
            connection.commit()
        
        return {"message": "Notice marked as read"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def get_notice_stats(current_user = Depends(auth.get_current_user)):
    """Get notice statistics"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Total notices
        cursor.execute(
            """
            SELECT COUNT(*) as total_notices FROM notices
            WHERE (target_role = 'all' OR target_role = %s)
            AND (college_id IS NULL OR college_id = %s)
            AND is_active = 1
            """,
            (current_user["role"], current_user.get("college_id"))
        )
        total = cursor.fetchone()["total_notices"]
        
        # Unread notices
        cursor.execute(
            """
            SELECT COUNT(*) as unread_notices FROM notices n
            LEFT JOIN notice_reads nr ON n.id = nr.notice_id AND nr.user_id = %s
            WHERE (n.target_role = 'all' OR n.target_role = %s)
            AND (n.college_id IS NULL OR n.college_id = %s)
            AND n.is_active = 1
            AND nr.is_read IS NULL
            """,
            (current_user["id"], current_user["role"], current_user.get("college_id"))
        )
        unread = cursor.fetchone()["unread_notices"]
        
        # Urgent notices
        cursor.execute(
            """
            SELECT COUNT(*) as urgent_notices FROM notices
            WHERE (target_role = 'all' OR target_role = %s)
            AND (college_id IS NULL OR college_id = %s)
            AND priority = 'urgent'
            AND is_active = 1
            """,
            (current_user["role"], current_user.get("college_id"))
        )
        urgent = cursor.fetchone()["urgent_notices"]
        
        return {
            "total_notices": total,
            "unread_notices": unread,
            "urgent_notices": urgent
        }
    except mysql.connector.Error as e:
        return {"total_notices": 0, "unread_notices": 0, "urgent_notices": 0, "error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
