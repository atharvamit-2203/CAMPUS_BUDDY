#!/usr/bin/env python3
"""
Admin User Management API
Allows admins to add new students and teachers via CSV upload or manual entry
"""

from fastapi import HTTPException, Depends, UploadFile, File
from typing import Optional, List, Dict, Any
import mysql.connector
import csv
import io
import bcrypt
from datetime import datetime
from database import get_mysql_connection
import auth

# =============================================================================
# ADMIN USER MANAGEMENT FUNCTIONS
# =============================================================================

def _ensure_admin_tables(cursor):
    """Ensure admin-related tables exist"""
    
    # Create import_logs table to track CSV imports
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS import_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            imported_by INT NOT NULL,
            import_type ENUM('students', 'teachers', 'manual') NOT NULL,
            total_records INT DEFAULT 0,
            successful_records INT DEFAULT 0,
            failed_records INT DEFAULT 0,
            file_name VARCHAR(255),
            import_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            error_details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_import_type (import_type),
            INDEX idx_import_status (import_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    # Create import_errors table to track individual record errors
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS import_errors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            import_log_id INT NOT NULL,
            row_number INT,
            error_message TEXT,
            record_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (import_log_id) REFERENCES import_logs(id) ON DELETE CASCADE,
            INDEX idx_import_log (import_log_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def _validate_user_data(user_data: Dict[str, Any], user_type: str) -> List[str]:
    """Validate user data and return list of errors"""
    errors = []
    
    # Required fields
    if not user_data.get('full_name'):
        errors.append("Full name is required")
    
    if not user_data.get('email'):
        errors.append("Email is required")
    elif '@' not in user_data.get('email', ''):
        errors.append("Invalid email format")
    
    if user_type == 'student':
        if not user_data.get('course'):
            errors.append("Course is required for students")
        if not user_data.get('semester'):
            errors.append("Semester is required for students")
        if not user_data.get('department'):
            errors.append("Department is required for students")
        if user_data.get('semester') and not str(user_data['semester']).isdigit():
            errors.append("Semester must be a number")
    
    if user_type == 'teacher':
        if not user_data.get('department'):
            errors.append("Department is required for teachers")
        if not user_data.get('designation'):
            errors.append("Designation is required for teachers")
    
    return errors

def _generate_default_password(full_name: str, email: str) -> str:
    """Generate a default password for new users"""
    # Use first name + last 4 digits of email hash
    first_name = full_name.split()[0].lower()
    email_hash = str(hash(email))[-4:]
    return f"{first_name}{email_hash}"

def _hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def add_student_manual(student_data: dict, current_user):
    """Add a single student manually"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        
        # Validate data
        errors = _validate_user_data(student_data, 'student')
        if errors:
            raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(errors)}")
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (student_data['email'],))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Generate password if not provided
        password = student_data.get('password')
        if not password:
            password = _generate_default_password(student_data['full_name'], student_data['email'])
        
        password_hash = _hash_password(password)
        
        # Insert student
        cursor.execute(
            """
            INSERT INTO users (
                email, password_hash, full_name, role, course, semester, 
                department, phone, sap_id, batch, bio, is_active,
                college_id, created_at
            ) VALUES (%s, %s, %s, 'student', %s, %s, %s, %s, %s, %s, %s, 1, %s, NOW())
            """,
            (
                student_data['email'], password_hash, student_data['full_name'],
                student_data['course'], student_data.get('semester'),
                student_data['department'], student_data.get('phone'),
                student_data.get('sap_id'), student_data.get('batch'),
                student_data.get('bio', ''), current_user.get('college_id')
            )
        )
        
        user_id = cursor.lastrowid
        connection.commit()
        
        # Log the manual addition
        cursor.execute(
            """
            INSERT INTO import_logs (
                imported_by, import_type, total_records, successful_records,
                import_status, completed_at
            ) VALUES (%s, 'manual', 1, 1, 'completed', NOW())
            """,
            (current_user['id'],)
        )
        connection.commit()
        
        return {
            "success": True,
            "message": "Student added successfully",
            "user_id": user_id,
            "generated_password": password if not student_data.get('password') else None
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def add_teacher_manual(teacher_data: dict, current_user):
    """Add a single teacher manually"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        
        # Validate data
        errors = _validate_user_data(teacher_data, 'teacher')
        if errors:
            raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(errors)}")
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (teacher_data['email'],))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Generate password if not provided
        password = teacher_data.get('password')
        if not password:
            password = _generate_default_password(teacher_data['full_name'], teacher_data['email'])
        
        password_hash = _hash_password(password)
        
        # Insert teacher
        cursor.execute(
            """
            INSERT INTO users (
                email, password_hash, full_name, role, department, phone,
                designation, qualification, bio, is_active, college_id, created_at
            ) VALUES (%s, %s, %s, 'faculty', %s, %s, %s, %s, %s, 1, %s, NOW())
            """,
            (
                teacher_data['email'], password_hash, teacher_data['full_name'],
                teacher_data['department'], teacher_data.get('phone'),
                teacher_data.get('designation'), teacher_data.get('qualification'),
                teacher_data.get('bio', ''), current_user.get('college_id')
            )
        )
        
        user_id = cursor.lastrowid
        connection.commit()
        
        # Log the manual addition
        cursor.execute(
            """
            INSERT INTO import_logs (
                imported_by, import_type, total_records, successful_records,
                import_status, completed_at
            ) VALUES (%s, 'manual', 1, 1, 'completed', NOW())
            """,
            (current_user['id'],)
        )
        connection.commit()
        
        return {
            "success": True,
            "message": "Teacher added successfully",
            "user_id": user_id,
            "generated_password": password if not teacher_data.get('password') else None
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def bulk_upload_students_csv(file: UploadFile, current_user):
    """Bulk upload students from CSV file"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        
        # Create import log
        cursor.execute(
            """
            INSERT INTO import_logs (
                imported_by, import_type, file_name, import_status
            ) VALUES (%s, 'students', %s, 'processing')
            """,
            (current_user['id'], file.filename)
        )
        import_log_id = cursor.lastrowid
        connection.commit()
        
        # Read and parse CSV
        content = await file.read()
        csv_content = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        total_records = 0
        successful_records = 0
        failed_records = 0
        
        for row_number, row in enumerate(csv_reader, start=2):  # Start from 2 to account for header
            total_records += 1
            
            try:
                # Expected CSV columns: full_name, email, course, semester, department, phone, sap_id, batch, bio
                student_data = {
                    'full_name': row.get('full_name', '').strip(),
                    'email': row.get('email', '').strip().lower(),
                    'course': row.get('course', '').strip(),
                    'semester': row.get('semester', '').strip(),
                    'department': row.get('department', '').strip(),
                    'phone': row.get('phone', '').strip(),
                    'sap_id': row.get('sap_id', '').strip(),
                    'batch': row.get('batch', '').strip(),
                    'bio': row.get('bio', '').strip()
                }
                
                # Validate data
                errors = _validate_user_data(student_data, 'student')
                if errors:
                    raise Exception(f"Validation errors: {', '.join(errors)}")
                
                # Check if email already exists
                cursor.execute("SELECT id FROM users WHERE email = %s", (student_data['email'],))
                if cursor.fetchone():
                    raise Exception("Email already exists")
                
                # Generate password
                password = _generate_default_password(student_data['full_name'], student_data['email'])
                password_hash = _hash_password(password)
                
                # Insert student
                cursor.execute(
                    """
                    INSERT INTO users (
                        email, password_hash, full_name, role, course, semester,
                        department, phone, sap_id, batch, bio, is_active,
                        college_id, created_at
                    ) VALUES (%s, %s, %s, 'student', %s, %s, %s, %s, %s, %s, %s, 1, %s, NOW())
                    """,
                    (
                        student_data['email'], password_hash, student_data['full_name'],
                        student_data['course'], student_data.get('semester'),
                        student_data['department'], student_data.get('phone'),
                        student_data.get('sap_id'), student_data.get('batch'),
                        student_data.get('bio', ''), current_user.get('college_id')
                    )
                )
                
                successful_records += 1
                
            except Exception as e:
                failed_records += 1
                # Log error
                cursor.execute(
                    """
                    INSERT INTO import_errors (
                        import_log_id, row_number, error_message, record_data
                    ) VALUES (%s, %s, %s, %s)
                    """,
                    (import_log_id, row_number, str(e), str(row))
                )
        
        # Update import log
        status = 'completed' if failed_records == 0 else 'completed'
        cursor.execute(
            """
            UPDATE import_logs SET
                total_records = %s,
                successful_records = %s,
                failed_records = %s,
                import_status = %s,
                completed_at = NOW()
            WHERE id = %s
            """,
            (total_records, successful_records, failed_records, status, import_log_id)
        )
        
        connection.commit()
        
        return {
            "success": True,
            "message": "CSV import completed",
            "import_log_id": import_log_id,
            "total_records": total_records,
            "successful_records": successful_records,
            "failed_records": failed_records
        }
        
    except Exception as e:
        # Update import log with error
        if 'import_log_id' in locals():
            cursor.execute(
                """
                UPDATE import_logs SET
                    import_status = 'failed',
                    error_details = %s,
                    completed_at = NOW()
                WHERE id = %s
                """,
                (str(e), import_log_id)
            )
            connection.commit()
        
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def bulk_upload_teachers_csv(file: UploadFile, current_user):
    """Bulk upload teachers from CSV file"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        _ensure_admin_tables(cursor)
        
        # Create import log
        cursor.execute(
            """
            INSERT INTO import_logs (
                imported_by, import_type, file_name, import_status
            ) VALUES (%s, 'teachers', %s, 'processing')
            """,
            (current_user['id'], file.filename)
        )
        import_log_id = cursor.lastrowid
        connection.commit()
        
        # Read and parse CSV
        content = await file.read()
        csv_content = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        total_records = 0
        successful_records = 0
        failed_records = 0
        
        for row_number, row in enumerate(csv_reader, start=2):
            total_records += 1
            
            try:
                # Expected CSV columns: full_name, email, department, phone, designation, qualification, bio
                teacher_data = {
                    'full_name': row.get('full_name', '').strip(),
                    'email': row.get('email', '').strip().lower(),
                    'department': row.get('department', '').strip(),
                    'phone': row.get('phone', '').strip(),
                    'designation': row.get('designation', '').strip(),
                    'qualification': row.get('qualification', '').strip(),
                    'bio': row.get('bio', '').strip()
                }
                
                # Validate data
                errors = _validate_user_data(teacher_data, 'teacher')
                if errors:
                    raise Exception(f"Validation errors: {', '.join(errors)}")
                
                # Check if email already exists
                cursor.execute("SELECT id FROM users WHERE email = %s", (teacher_data['email'],))
                if cursor.fetchone():
                    raise Exception("Email already exists")
                
                # Generate password
                password = _generate_default_password(teacher_data['full_name'], teacher_data['email'])
                password_hash = _hash_password(password)
                
                # Insert teacher
                cursor.execute(
                    """
                    INSERT INTO users (
                        email, password_hash, full_name, role, department, phone,
                        designation, qualification, bio, is_active, college_id, created_at
                    ) VALUES (%s, %s, %s, 'faculty', %s, %s, %s, %s, %s, 1, %s, NOW())
                    """,
                    (
                        teacher_data['email'], password_hash, teacher_data['full_name'],
                        teacher_data['department'], teacher_data.get('phone'),
                        teacher_data.get('designation'), teacher_data.get('qualification'),
                        teacher_data.get('bio', ''), current_user.get('college_id')
                    )
                )
                
                successful_records += 1
                
            except Exception as e:
                failed_records += 1
                # Log error
                cursor.execute(
                    """
                    INSERT INTO import_errors (
                        import_log_id, row_number, error_message, record_data
                    ) VALUES (%s, %s, %s, %s)
                    """,
                    (import_log_id, row_number, str(e), str(row))
                )
        
        # Update import log
        status = 'completed'
        cursor.execute(
            """
            UPDATE import_logs SET
                total_records = %s,
                successful_records = %s,
                failed_records = %s,
                import_status = %s,
                completed_at = NOW()
            WHERE id = %s
            """,
            (total_records, successful_records, failed_records, status, import_log_id)
        )
        
        connection.commit()
        
        return {
            "success": True,
            "message": "CSV import completed",
            "import_log_id": import_log_id,
            "total_records": total_records,
            "successful_records": successful_records,
            "failed_records": failed_records
        }
        
    except Exception as e:
        # Update import log with error
        if 'import_log_id' in locals():
            cursor.execute(
                """
                UPDATE import_logs SET
                    import_status = 'failed',
                    error_details = %s,
                    completed_at = NOW()
                WHERE id = %s
                """,
                (str(e), import_log_id)
            )
            connection.commit()
        
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_import_logs(current_user, limit: int = 50):
    """Get import history logs"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT il.*, u.full_name as imported_by_name
            FROM import_logs il
            LEFT JOIN users u ON il.imported_by = u.id
            ORDER BY il.created_at DESC
            LIMIT %s
            """,
            (limit,)
        )
        
        logs = cursor.fetchall()
        
        # Get error details for failed imports
        for log in logs:
            if log['failed_records'] > 0:
                cursor.execute(
                    """
                    SELECT row_number, error_message, record_data
                    FROM import_errors
                    WHERE import_log_id = %s
                    ORDER BY row_number
                    """,
                    (log['id'],)
                )
                log['errors'] = cursor.fetchall()
        
        return logs
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def get_user_statistics(current_user):
    """Get user statistics for admin dashboard"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get counts by role
        cursor.execute(
            """
            SELECT 
                role,
                COUNT(*) as count,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recent_count
            FROM users
            WHERE college_id = %s OR %s IS NULL
            GROUP BY role
            """,
            (current_user.get('college_id'), current_user.get('college_id'))
        )
        
        role_stats = cursor.fetchall()
        
        # Get recent imports
        cursor.execute(
            """
            SELECT COUNT(*) as total_imports,
                   SUM(successful_records) as total_successful,
                   SUM(failed_records) as total_failed
            FROM import_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            """,
        )
        
        import_stats = cursor.fetchone()
        
        return {
            "role_statistics": role_stats,
            "import_statistics": import_stats,
            "last_updated": datetime.now().isoformat()
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

async def search_users(current_user, query: str = "", role: str = "", limit: int = 50):
    """Search users with filters"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Build search query
        where_conditions = ["(college_id = %s OR %s IS NULL)"]
        params = [current_user.get('college_id'), current_user.get('college_id')]
        
        if query:
            where_conditions.append("(full_name LIKE %s OR email LIKE %s)")
            params.extend([f"%{query}%", f"%{query}%"])
        
        if role:
            where_conditions.append("role = %s")
            params.append(role)
        
        where_clause = " AND ".join(where_conditions)
        
        cursor.execute(
            f"""
            SELECT id, full_name, email, role, department, course, semester,
                   phone, is_active, created_at
            FROM users
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s
            """,
            params + [limit]
        )
        
        return cursor.fetchall()
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()