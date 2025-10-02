"""
Seed canteen staff users (role='staff', department='canteen') into the users table.

Usage:
  python backend/seed_canteen_staff.py

It will create 3 staff accounts if they don't exist, with default password 'testpassword123'.
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

def ensure_columns(cur):
    # Make sure department column exists; ignore errors
    try:
        cur.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL")
    except Exception:
        pass

def upsert_staff(cur, email: str, name: str):
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        # Ensure role and department are set
        cur.execute("UPDATE users SET role = 'staff', department = 'canteen', is_active = 1 WHERE email = %s", (email,))
        return row["id"] if isinstance(row, dict) else row[0]
    username = email.split("@")[0]
    password_hash = auth.get_password_hash(DEFAULT_PASSWORD)
    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, full_name, role, college_id, department, is_active, is_verified)
        VALUES (%s, %s, %s, %s, 'staff', %s, 'canteen', 1, 1)
        """,
        (username, email, password_hash, name, 1),
    )
    return cur.lastrowid


def main():
    conn = get_mysql_connection()
    cur = conn.cursor(dictionary=True)
    try:
        ensure_columns(cur)
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
        print(f"✅ Canteen staff seed complete. Created: {created}, updated: {updated}")
        print("All seeded accounts use password 'testpassword123'. Change it later if needed.")
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
