#!/usr/bin/env python3
"""
Direct migration: Replace organization names with new club names.
"""
import mysql.connector
from database import get_mysql_connection

def migrate_now():
    """Directly migrate organization names to club names"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        print("🔍 Checking current data...")
        
        # Get clubs
        cursor.execute("SELECT id, name, category FROM clubs ORDER BY id LIMIT 20")
        clubs = cursor.fetchall()
        
        # Get organizations  
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id LIMIT 20")
        orgs = cursor.fetchall()
        
        if not clubs:
            print("❌ No clubs found!")
            return
            
        if not orgs:
            print("❌ No organizations found!")
            return
        
        print(f"Found {len(clubs)} clubs and {len(orgs)} organizations")
        
        print("\n📋 Migration plan:")
        updates = []
        for i, org in enumerate(orgs):
            if i < len(clubs):
                club = clubs[i]
                updates.append({
                    'org_id': org['id'],
                    'old_name': org['organization_name'],
                    'new_name': club['name'],
                    'new_category': club.get('category', 'General')
                })
                print(f"  {i+1}. '{org['organization_name']}' → '{club['name']}'")
        
        print(f"\n🚀 Updating {len(updates)} organizations...")
        
        # Perform updates
        for update in updates:
            cursor.execute(
                "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                (update['new_name'], update['new_category'], update['org_id'])
            )
            print(f"✅ {update['old_name']} → {update['new_name']}")
        
        conn.commit()
        print(f"\n🎉 Successfully updated {len(updates)} organizations!")
        
        # Verify results
        print("\n📋 Final organization names:")
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id LIMIT 20")
        final_orgs = cursor.fetchall()
        for org in final_orgs:
            print(f"  ID {org['id']}: {org['organization_name']} ({org.get('organization_type', 'N/A')})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_now()