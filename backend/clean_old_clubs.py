#!/usr/bin/env python3
"""
Remove old sample clubs and keep only the new club names
"""
from database import get_mysql_connection

def clean_clubs():
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        print("=== BEFORE CLEANUP ===")
        cursor.execute("SELECT id, name FROM clubs WHERE is_active = 1 ORDER BY id")
        clubs_before = cursor.fetchall()
        for club in clubs_before:
            print(f"ID: {club['id']}, Name: '{club['name']}'")
        
        # Deactivate the old sample clubs (IDs 25-36)
        old_club_ids = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
        
        for club_id in old_club_ids:
            cursor.execute("UPDATE clubs SET is_active = 0 WHERE id = %s", (club_id,))
            print(f"Deactivated club ID: {club_id}")
        
        connection.commit()
        
        print("\n=== AFTER CLEANUP ===")
        cursor.execute("SELECT id, name FROM clubs WHERE is_active = 1 ORDER BY id")
        clubs_after = cursor.fetchall()
        for club in clubs_after:
            print(f"ID: {club['id']}, Name: '{club['name']}'")
            
        print(f"\nRemoved {len(clubs_before) - len(clubs_after)} old sample clubs")
        print(f"Active clubs remaining: {len(clubs_after)}")
            
    except Exception as e:
        print(f"Error: {e}")
        connection.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    clean_clubs()