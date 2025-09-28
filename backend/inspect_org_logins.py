"""
Inspect organization_details and users mapping to verify logins for clubs.
Prints each organization with its linked users.email and role.
Usage: python backend/inspect_org_logins.py [LIMIT]
"""
import sys
from database import get_mysql_connection

limit = int(sys.argv[1]) if len(sys.argv) > 1 else 50

conn = get_mysql_connection()
cur = conn.cursor(dictionary=True)
try:
    cur.execute("SHOW TABLES LIKE 'organization_details'")
    if not cur.fetchone():
        print("organization_details table not found")
        sys.exit(0)

    cur.execute(
        f"""
        SELECT od.id, od.organization_name, od.user_id, u.email, u.username, u.role
        FROM organization_details od
        LEFT JOIN users u ON u.id = od.user_id
        ORDER BY od.id
        LIMIT %s
        """,
        (limit,)
    )
    rows = cur.fetchall()
    if not rows:
        print("No rows in organization_details")
        sys.exit(0)
    for r in rows:
        print(
            f"org_id={r['id']}, name={r['organization_name']}, user_id={r['user_id']}, email={r.get('email')}, username={r.get('username')}, role={r.get('role')}"
        )
finally:
    try:
        cur.close(); conn.close()
    except Exception:
        pass
