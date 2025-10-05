#!/usr/bin/env python3
"""
Auto-migration script - Just run this to complete the migration
"""
import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import get_mysql_connection

def auto_migrate():
    """Automatically migrate organization names to club names"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get the club names from the clubs table
        cursor.execute("SELECT name, category FROM clubs ORDER BY id")
        clubs = cursor.fetchall()
        
        # Get current organizations
        cursor.execute("SELECT id, organization_name FROM organization_details ORDER BY id")
        orgs = cursor.fetchall()
        
        print(f"🔄 Migrating {min(len(orgs), len(clubs))} organizations...")
        
        # Update each organization with corresponding club name
        for i, org in enumerate(orgs):
            if i < len(clubs):
                club = clubs[i]
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (club['name'], club.get('category', 'General'), org['id'])
                )
                print(f"✅ Updated: {org['organization_name']} → {club['name']}")
        
        conn.commit()
        print("🎉 Migration completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    auto_migrate()