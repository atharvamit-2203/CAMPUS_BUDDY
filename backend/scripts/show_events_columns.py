import os, sys
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE not in sys.path:
    sys.path.append(BASE)
from database import get_mysql_connection

def show_columns(table: str):
    conn = get_mysql_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(f"SHOW COLUMNS FROM {table}")
        rows = cur.fetchall()
        for r in rows:
            print(f"{r['Field']}\t{r['Type']}\tNULL={r['Null']}\tDEFAULT={r['Default']}")
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

if __name__ == '__main__':
    show_columns('events')
