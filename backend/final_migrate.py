#!/usr/bin/env python3
"""
Final migration script - properly handles ENUM constraints
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import get_mysql_connection

def final_migrate():
    """Final migration with correct ENUM values"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Valid organization types from the ENUM
        category_to_type = {
            'Technology': 'technical',
            'Business': 'academic', 
            'Governance': 'social',
            'Academic': 'academic',
            'Cultural': 'cultural',
            'Sports': 'sports',
            'Design': 'cultural',
            'Engineering': 'technical',
            'Security': 'technical',
            'Analytics': 'technical',
            'general': 'other'  # fallback
        }
        
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
                # Map category to valid organization type
                club_category = club.get('category', 'other')
                org_type = category_to_type.get(club_category, 'other')
                
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (club['name'], org_type, org['id'])
                )
                print(f"✅ Updated: {org['organization_name']} → {club['name']} ({org_type})")
        
        conn.commit()
        print("🎉 Migration completed successfully!")
        
        # Verify results
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        results = cursor.fetchall()
        print(f"\n📋 Final results ({len(results)} organizations):")
        for result in results:
            print(f"  ID {result['id']:2d}: {result['organization_name']} ({result['organization_type']})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    final_migrate()