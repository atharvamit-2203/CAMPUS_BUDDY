import os, sys
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE not in sys.path:
    sys.path.append(BASE)
from database import get_mysql_connection

conn = get_mysql_connection()
cur = conn.cursor(dictionary=True)
try:
    cur.execute("SHOW COLUMNS FROM users LIKE 'role'")
    print(cur.fetchall())
finally:
    try:
        cur.close(); conn.close()
    except Exception:
        pass
