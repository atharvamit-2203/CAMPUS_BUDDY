#!/usr/bin/env python3
"""
Quick database test and fix
"""

import mysql.connector
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

def test_and_fix():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DATABASE', 'campus_connect')
        )
        
        cursor = connection.cursor(dictionary=True)
        
        # Check current user
        cursor.execute("SELECT email, password_hash FROM users WHERE email = 'student3@campus.com'")
        user = cursor.fetchone()
        
        if user:
            print(f"Current user: {user['email']}")
            print(f"Current hash: {user['password_hash']}")
            print(f"Hash length: {len(user['password_hash'])}")
            
            # Generate new valid hash
            new_hash = bcrypt.hashpw('testpassword123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            print(f"New hash: {new_hash}")
            
            # Test new hash
            test_result = bcrypt.checkpw('testpassword123'.encode('utf-8'), new_hash.encode('utf-8'))
            print(f"New hash verification: {test_result}")
            
            if test_result:
                # Update the user
                cursor.execute("UPDATE users SET password_hash = %s WHERE email = 'student3@campus.com'", (new_hash,))
                connection.commit()
                print("✅ Updated user with working hash")
                
                # Verify update
                cursor.execute("SELECT password_hash FROM users WHERE email = 'student3@campus.com'")
                updated_user = cursor.fetchone()
                final_test = bcrypt.checkpw('testpassword123'.encode('utf-8'), updated_user['password_hash'].encode('utf-8'))
                print(f"Final verification: {final_test}")
            else:
                print("❌ New hash verification failed")
        else:
            print("❌ User not found")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    test_and_fix()
