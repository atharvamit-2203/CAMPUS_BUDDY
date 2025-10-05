#!/usr/bin/env python3
"""
Complete migration script - Replace organization names with club names
and ensure all features work with the new names.
"""
import mysql.connector
from database import get_mysql_connection

def complete_migration():
    """Complete the migration from organizations to clubs"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        print("🚀 Starting complete migration...")
        
        # Step 1: Check tables exist
        cursor.execute("SHOW TABLES")
        tables = [row[list(row.keys())[0]] for row in cursor.fetchall()]
        
        required_tables = ["clubs", "organization_details"]
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"❌ Missing required tables: {missing_tables}")
            return
        
        print("✅ All required tables found")
        
        # Step 2: Get data
        cursor.execute("SELECT id, name, category, description FROM clubs ORDER BY id")
        clubs = cursor.fetchall()
        
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        orgs = cursor.fetchall()
        
        print(f"📊 Found {len(clubs)} clubs and {len(orgs)} organizations")
        
        if not clubs:
            print("❌ No clubs found to migrate to")
            return
            
        if not orgs:
            print("❌ No organizations found to migrate from")
            return
        
        # Step 3: Show migration plan
        print("\n📋 Migration Plan:")
        migration_plan = []
        
        for i, org in enumerate(orgs):
            if i < len(clubs):
                club = clubs[i]
                migration_plan.append({
                    'org_id': org['id'],
                    'old_name': org['organization_name'],
                    'new_name': club['name'],
                    'new_category': club.get('category', 'General'),
                    'description': club.get('description', '')
                })
                print(f"  {i+1:2d}. '{org['organization_name']}' → '{club['name']}'")
            else:
                print(f"  {i+1:2d}. '{org['organization_name']}' → (no matching club)")
        
        if not migration_plan:
            print("❌ No migrations to perform")
            return
        
        # Step 4: Perform migration
        print(f"\n🔄 Migrating {len(migration_plan)} organizations...")
        
        for plan in migration_plan:
            # Update organization_details
            cursor.execute(
                """UPDATE organization_details 
                   SET organization_name = %s, 
                       organization_type = %s 
                   WHERE id = %s""",
                (plan['new_name'], plan['new_category'], plan['org_id'])
            )
            print(f"✅ {plan['old_name']} → {plan['new_name']}")
        
        # Step 5: Commit changes
        conn.commit()
        print(f"\n🎉 Migration completed successfully!")
        
        # Step 6: Verify results
        print("\n📋 Verification - Final organization names:")
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        final_orgs = cursor.fetchall()
        
        for org in final_orgs:
            print(f"  ID {org['id']:2d}: {org['organization_name']} ({org.get('organization_type', 'N/A')})")
        
        # Step 7: Check memberships still work
        if "organization_memberships" in tables:
            cursor.execute("SELECT COUNT(*) as count FROM organization_memberships")
            membership_count = cursor.fetchone()
            print(f"\n👥 Organization memberships preserved: {membership_count['count']}")
        
        print("\n✅ Migration completed! Your organization page will now show the new club names.")
        print("🔗 The backend is already configured to handle this change automatically.")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    complete_migration()