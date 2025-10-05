#!/usr/bin/env python3
"""
Fixed migration script - handles organization_type column constraints
"""
import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import get_mysql_connection

def fixed_migrate():
    """Migrate organization names with proper type handling"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check organization_type column constraints
        cursor.execute("SHOW COLUMNS FROM organization_details WHERE Field = 'organization_type'")
        type_info = cursor.fetchone()
        print(f"Organization type column info: {type_info}")
        
        # Get valid organization types if it's an ENUM
        valid_types = ['technical', 'cultural', 'sports', 'academic', 'general', 'other']
        
        # Category to type mapping
        category_to_type = {
            'Technology': 'technical',
            'Business': 'academic', 
            'Governance': 'academic',
            'Academic': 'academic',
            'Cultural': 'cultural',
            'Sports': 'sports',
            'Design': 'cultural',
            'Engineering': 'technical',
            'Security': 'technical',
            'Analytics': 'technical'
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
                org_type = category_to_type.get(club.get('category'), 'general')
                
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (club['name'], org_type, org['id'])
                )
                print(f"✅ Updated: {org['organization_name']} → {club['name']} ({org_type})")
        
        conn.commit()
        print("🎉 Migration completed!")
        
        # Verify results
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id LIMIT 15")
        results = cursor.fetchall()
        print("\n📋 Final results:")
        for result in results:
            print(f"  ID {result['id']}: {result['organization_name']} ({result['organization_type']})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fixed_migrate()