#!/usr/bin/env python3
"""
Simple MySQL connection test
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_mysql_connection():
    """Test basic MySQL connection"""
    try:
        # Connection parameters
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            charset='utf8mb4'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"✅ MySQL connection successful!")
            print(f"📊 MySQL version: {version[0]}")
            
            # Test database creation
            db_name = os.getenv('MYSQL_DATABASE', 'campus_connect')
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            print(f"✅ Database '{db_name}' ready")
            
            cursor.close()
            return True
            
    except Error as e:
        print(f"❌ MySQL connection failed: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

if __name__ == "__main__":
    print("🔍 Testing MySQL connection...")
    success = test_mysql_connection()
    if success:
        print("🎉 MySQL is ready for Campus Connect!")
    else:
        print("💡 Make sure MySQL is running and check your .env file")
