"""
Seed club admin login accounts from existing tables (organizations/clubs).

- Creates users (role='organization') where missing
- Links organizations.user_id and clubs.created_by
- Default password for generated accounts: testpassword123

Usage:
    python backend/seed_club_admins.py

This script uses backend/config.py and backend/database.py to connect to MySQL.
"""
import os
import sys
import re
from typing import Optional

# Ensure local imports work when run as a script
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.append(ROOT)

import mysql.connector  # type: ignore
from mysql.connector import Error  # type: ignore

import auth  # password hashing
from config import settings
from database import get_mysql_connection

DEFAULT_PASSWORD = "testpassword123"


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", name).strip("_")
    return s.lower()[:40] or "club"


def escape_email_local(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower()) or "club"


def ensure_user(cursor, name: str, org_type: Optional[str], college_id: int = 1) -> int:
    """Get or create a users row for this club/org name. Returns user id.
    Email domain defaults to 'college.edu' (configurable via CLUB_EMAIL_DOMAIN).
    """
    domain = os.getenv("CLUB_EMAIL_DOMAIN", "college.edu")
    email = f"{escape_email_local(name)}@{domain}"

    # Try find by email first
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    if row:
        return row["id"] if isinstance(row, dict) else row[0]

    username = slugify(name)
    full_name = name
    password_hash = auth.get_password_hash(DEFAULT_PASSWORD)

    cursor.execute(
        """
        INSERT INTO users (
            username, email, password_hash, full_name, role, college_id,
            organization_type, is_active, is_verified
        ) VALUES (%s, %s, %s, %s, 'organization', %s, %s, 1, 1)
        """,
        (username, email, password_hash, full_name, college_id, org_type),
    )
    return cursor.lastrowid


def table_exists(cursor, name: str) -> bool:
    cursor.execute("SHOW TABLES LIKE %s", (name,))
    return cursor.fetchone() is not None


def main():
    created_users = 0
    linked_orgs = 0
    linked_clubs = 0

    conn = get_mysql_connection()
    cur = conn.cursor(dictionary=True)

    try:
        # Detect table names in this schema
        has_orgs = table_exists(cur, "organizations")
        has_org_details = table_exists(cur, "organization_details")
        has_clubs = table_exists(cur, "clubs")

        if not (has_orgs or has_org_details or has_clubs):
            print("No organizations/organization_details or clubs table found. Nothing to do.")
            return

        # 1) Seed for organizations (generic): prefer organization_details if present
        if has_org_details or has_orgs:
            org_table = "organization_details" if has_org_details else "organizations"
            # Work out the column names dynamically
            cur.execute(f"SHOW COLUMNS FROM {org_table}")
            cols = {row["Field"] for row in cur.fetchall()}
            name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else None)
            type_col = "organization_type" if "organization_type" in cols else ("type" if "type" in cols else None)
            user_col = "user_id" if "user_id" in cols else None
            if not name_col or not user_col:
                print(f"Table {org_table} missing expected columns; skipping.")
            else:
                cur.execute(f"SELECT id, {user_col} as user_id, {name_col} as org_name" + (f", {type_col} as org_type" if type_col else "") + f" FROM {org_table}")
                for row in cur.fetchall():
                    org_id = row["id"]
                    user_id = row.get("user_id")
                    name = row.get("org_name") or "Club"
                    org_type = row.get("org_type") if type_col else None
                    if not user_id:
                        uid = ensure_user(cur, name, org_type)
                        created_users += 1
                        # Link back
                        cur.execute(f"UPDATE {org_table} SET {user_col} = %s WHERE id = %s", (uid, org_id))
                        linked_orgs += 1
                conn.commit()

        # 2) Ensure clubs.created_by is linked (if a clubs table exists)
        if has_clubs:
            cur.execute("SHOW COLUMNS FROM clubs LIKE 'name'")
            has_name = cur.fetchone() is not None
            cur.execute("SHOW COLUMNS FROM clubs LIKE 'created_by'")
            has_created_by = cur.fetchone() is not None

            if has_name and has_created_by:
                cur.execute("SELECT id, name, created_by FROM clubs")
                clubs = cur.fetchall()
                # Map organization names to user_ids
                name_to_uid = {}
                if has_org_details or has_orgs:
                    src_table = "organization_details" if has_org_details else "organizations"
                    # Choose cols again
                    cur.execute(f"SHOW COLUMNS FROM {src_table}")
                    cols = {row["Field"] for row in cur.fetchall()}
                    s_name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else None)
                    s_user_col = "user_id" if "user_id" in cols else None
                    if s_name_col and s_user_col:
                        cur.execute(f"SELECT {s_name_col} as name, {s_user_col} as user_id FROM {src_table} WHERE {s_user_col} IS NOT NULL")
                        for r in cur.fetchall():
                            if r["user_id"]:
                                name_to_uid[(r["name"] or "").strip().lower()] = r["user_id"]

                for c in clubs:
                    if c["created_by"]:
                        continue
                    cname = (c["name"] or "Club").strip()
                    uid = name_to_uid.get(cname.lower()) if cname else None
                    if not uid:
                        uid = ensure_user(cur, cname, None)
                        created_users += 1
                    cur.execute("UPDATE clubs SET created_by = %s WHERE id = %s", (uid, c["id"]))
                    linked_clubs += 1
                conn.commit()

        print(
            f"✅ Done. Created users: {created_users}, linked organizations: {linked_orgs}, linked clubs: {linked_clubs}"
        )
        if created_users:
            print(
                "All generated accounts use the default password 'testpassword123' (you can change it later)."
            )
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
