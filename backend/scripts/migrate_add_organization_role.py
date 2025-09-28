import os, sys
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE not in sys.path:
    sys.path.append(BASE)
from database import get_mysql_connection

SQL = """
ALTER TABLE users 
MODIFY role ENUM('student','faculty','admin','organization') 
NOT NULL DEFAULT 'student';
"""

conn = get_mysql_connection()
cur = conn.cursor()
try:
    cur.execute(SQL)
    conn.commit()
    print("✅ Migrated: added 'organization' to users.role enum")
finally:
    try:
        cur.close(); conn.close()
    except Exception:
        pass
