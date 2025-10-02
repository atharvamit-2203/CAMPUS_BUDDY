"""
Add 'staff' role to user_role enum and create canteen staff users.

Usage:
  python backend/add_staff_role.py

This script will:
1. Add 'staff' to the user_role enum if it doesn't exist
2. Create canteen staff users with the staff role
"""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.append(ROOT)

import mysql.connector  # type: ignore
from mysql.connector import Error  # type: ignore

import auth
from database import get_mysql_connection

DEFAULT_PASSWORD = "testpassword123"
STAFF = [
    ("canteen.anna@college.edu", "Anna Thomas"),
    ("canteen.rahul@college.edu", "Rahul Mehta"),
    ("canteen.sneha@college.edu", "Sneha Iyer"),
]

def add_staff_to_enum(cur):
    """Add 'staff' to the user_role enum if it doesn't exist."""
    try:
        # First check if 'staff' already exists in the enum
        cur.execute("""
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
            AND TABLE_SCHEMA = DATABASE()
        """)
        result = cur.fetchone()
        
        if result:
            column_type = result[0] if isinstance(result, tuple) else result['COLUMN_TYPE']
            print(f"Current role column type: {column_type}")
            
            if "'staff'" in column_type:
                print("✅ 'staff' role already exists in the enum")
                return True
            
            # Add 'staff' to the enum
            print("Adding 'staff' to user_role enum...")
            cur.execute("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'faculty', 'organization', 'staff') NOT NULL")
            print("✅ Successfully added 'staff' to user_role enum")
            return True
        else:
            print("❌ Could not find role column information")
            return False
            
    except Exception as e:
        print(f"Error modifying enum: {e}")
        return False

def ensure_columns(cur):
    """Make sure department column exists."""
    try:
        cur.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL")
        print("✅ Added department column")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("✅ Department column already exists")
        else:
            print(f"Warning: {e}")

def upsert_staff(cur, email: str, name: str):
    """Create or update a staff user."""
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        # Update existing user to be staff
        cur.execute("UPDATE users SET role = 'staff', department = 'canteen', is_active = 1 WHERE email = %s", (email,))
        user_id = row[0] if isinstance(row, tuple) else row['id']
        print(f"✅ Updated existing user: {email}")
        return user_id
    
    # Create new staff user
    username = email.split("@")[0]
    password_hash = auth.get_password_hash(DEFAULT_PASSWORD)
    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, full_name, role, college_id, department, is_active, is_verified)
        VALUES (%s, %s, %s, %s, 'staff', %s, 'canteen', 1, 1)
        """,
        (username, email, password_hash, name, 1),
    )
    user_id = cur.lastrowid
    print(f"✅ Created new staff user: {email}")
    return user_id

def main():
    conn = get_mysql_connection()
    cur = conn.cursor(dictionary=True)
    try:
        # Step 1: Add 'staff' to the user_role enum
        if not add_staff_to_enum(cur):
            print("❌ Failed to add 'staff' to enum. Exiting.")
            return
        
        # Step 2: Ensure department column exists
        ensure_columns(cur)
        
        # Step 3: Create staff users
        created = 0
        updated = 0
        for email, name in STAFF:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if row:
                upsert_staff(cur, email, name)
                updated += 1
            else:
                upsert_staff(cur, email, name)
                created += 1
        
        conn.commit()
        print(f"\n🎉 Staff setup complete!")
        print(f"   Created: {created} new staff users")
        print(f"   Updated: {updated} existing users")
        print(f"   Password for all staff accounts: '{DEFAULT_PASSWORD}'")
        print(f"   Staff users can now log in at: http://localhost:3001/login/staff")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()