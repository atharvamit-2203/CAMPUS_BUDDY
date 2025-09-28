#!/usr/bin/env python3
"""
Fix password hashes in the database
"""

import mysql.connector
import os
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()

def fix_password_hashes():
    """Update all users with correct password hash for 'testpassword123'"""
    
    # Generate correct hash for 'testpassword123'
    password = 'testpassword123'
    correct_hash = '$2b$12$678uo3FiQrPSg9JgKa3TC.kQihQAI5axnA8kNcRcYuEPdNeDkcyPm'
    
    # Verify the hash is correct
    verification = bcrypt.checkpw(password.encode('utf-8'), correct_hash.encode('utf-8'))
    print(f"Hash verification for '{password}': {verification}")
    
    if not verification:
        print("❌ Hash verification failed! Aborting.")
        return
    
    try:
        # Connect to database
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DATABASE', 'campus_connect')
        )
        
        cursor = connection.cursor(dictionary=True)
        
        # Check current users
        cursor.execute("SELECT id, username, email, password_hash FROM users LIMIT 5")
        users = cursor.fetchall()
        
        print(f"\n📊 Found {len(users)} sample users:")
        for user in users:
            print(f"  - {user['username']} ({user['email']})")
            print(f"    Current hash: {user['password_hash'][:20]}...")
        
        # Update all users with correct hash
        cursor.execute("UPDATE users SET password_hash = %s", (correct_hash,))
        affected_rows = cursor.rowcount
        connection.commit()
        
        print(f"\n✅ Updated password hash for {affected_rows} users")
        print(f"All users now have password: '{password}'")
        
        # Verify update
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE password_hash = %s", (correct_hash,))
        result = cursor.fetchone()
        print(f"✅ Verification: {result['count']} users have the correct hash")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    fix_password_hashes()
