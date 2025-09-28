import mysql.connector
from mysql.connector import Error

def test_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",       # change if MySQL is on another server
            user="root",            # your MySQL username
            password="0809202327",# your MySQL password
            database="campus_connect"         # optional: replace with your database name
        )

        if connection.is_connected():
            db_info = connection.get_server_info()
            print("✅ Connected to MySQL Server version:", db_info)

            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            record = cursor.fetchone()
            print("📂 You're connected to database:", record[0])

    except Error as e:
        print("❌ Error while connecting to MySQL:", e)

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 MySQL connection is closed")

if __name__ == "__main__":
    test_connection()
