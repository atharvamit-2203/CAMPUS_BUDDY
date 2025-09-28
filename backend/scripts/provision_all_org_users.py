import os, sys, re
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE not in sys.path:
    sys.path.append(BASE)

from database import get_mysql_connection
import auth

DEFAULT_DOMAIN = "college.edu"
DEFAULT_PASSWORD = "testpassword123"
DEFAULT_ROLE = "organization"

def slugify(name: str) -> str:
    # Lowercase, remove non-alphanumeric, collapse spaces
    s = name.lower()
    s = s.replace("&", "and").replace("/", " ").replace("-", " ")
    s = re.sub(r"[^a-z0-9 ]+", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace(" ", "")

def ensure_user(cursor, email: str, username: str, full_name: str, role: str, college_id: int = 1, password: str = DEFAULT_PASSWORD) -> int:
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    if row:
        return row["id"]

    # ensure username is unique
    base_username = username
    suffix = 1
    while True:
        cursor.execute("SELECT 1 FROM users WHERE username = %s", (username,))
        if not cursor.fetchone():
            break
        username = f"{base_username}{suffix}"
        suffix += 1

    password_hash = auth.get_password_hash(password)
    cursor.execute(
        """
        INSERT INTO users (
            username, email, password_hash, full_name, role, college_id,
            is_active, is_verified
        ) VALUES (%s, %s, %s, %s, %s, %s, TRUE, TRUE)
        """,
        (username, email, password_hash, full_name, role, college_id),
    )
    return cursor.lastrowid

def main():
    conn = get_mysql_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id, organization_name, user_id FROM organization_details ORDER BY id")
        orgs = cur.fetchall()
        if not orgs:
            print("No organizations found")
            return

        results = []
        for org in orgs:
            org_id = org["id"]
            name = org["organization_name"] or f"org_{org_id}"
            local_part = slugify(name)
            email = f"{local_part}@{DEFAULT_DOMAIN}"
            username = local_part[:20]
            full_name = name

            user_id = ensure_user(cur, email=email, username=username, full_name=full_name, role=DEFAULT_ROLE)

            # Link organization to this user
            if org.get("user_id") != user_id:
                cur.execute("UPDATE organization_details SET user_id = %s WHERE id = %s", (user_id, org_id))
                conn.commit()

            # fetch to print
            cur.execute(
                """
                SELECT od.id, od.organization_name, od.user_id, u.email, u.username, u.role
                FROM organization_details od
                LEFT JOIN users u ON od.user_id = u.id
                WHERE od.id = %s
                """,
                (org_id,),
            )
            row = cur.fetchone()
            results.append(row)

        for r in results:
            print(f"✅ org_id={r['id']}, name={r['organization_name']}, user_id={r['user_id']}, email={r.get('email')}, username={r.get('username')}, role={r.get('role')}")
        print()
        print("Default password for all newly created organization accounts:")
        print(f"  {DEFAULT_PASSWORD}")
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
