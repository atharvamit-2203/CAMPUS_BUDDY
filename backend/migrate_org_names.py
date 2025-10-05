#!/usr/bin/env python3
"""
Migrate organization names to use new club names from clubs table.
This will update the organization_details table to use the new club names.
"""
import mysql.connector
from database import get_mysql_connection

def migrate_organization_names():
    """Update organization_details with new club names from clubs table"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # First, check what tables exist
        cursor.execute("SHOW TABLES")
        tables = [row[list(row.keys())[0]] for row in cursor.fetchall()]
        print("=== EXISTING TABLES ===")
        for table in tables:
            print(f"- {table}")
        
        if "clubs" not in tables:
            print("❌ clubs table not found! Cannot proceed with migration.")
            return
            
        if "organization_details" not in tables:
            print("❌ organization_details table not found! Cannot proceed with migration.")
            return
        
        # Get the new club names from clubs table
        cursor.execute("SELECT id, name, description, category FROM clubs ORDER BY id")
        clubs = cursor.fetchall()
        
        print(f"\n=== CLUBS DATA ({len(clubs)} clubs) ===")
        for club in clubs:
            print(f"ID: {club['id']}, Name: {club['name']}, Category: {club.get('category', 'N/A')}")
        
        # Get current organization_details
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        orgs = cursor.fetchall()
        
        print(f"\n=== CURRENT ORGANIZATION_DETAILS ({len(orgs)} organizations) ===")
        for org in orgs:
            print(f"ID: {org['id']}, Name: {org['organization_name']}, Type: {org.get('organization_type', 'N/A')}")
        
        if len(clubs) == 0:
            print("❌ No clubs found in clubs table!")
            return
            
        if len(orgs) == 0:
            print("❌ No organizations found in organization_details table!")
            return
        
        # Strategy: Map clubs to organizations by order (1st club -> 1st org, etc.)
        # Or you can create a custom mapping here
        
        print(f"\n=== MIGRATION PLAN ===")
        print("Will update organization_details with new club names:")
        
        updates = []
        for i, org in enumerate(orgs):
            if i < len(clubs):
                club = clubs[i]
                updates.append({
                    'org_id': org['id'],
                    'old_name': org['organization_name'],
                    'new_name': club['name'],
                    'new_category': club.get('category', org.get('organization_type', 'General'))
                })
                print(f"  Org ID {org['id']}: '{org['organization_name']}' -> '{club['name']}'")
            else:
                print(f"  Org ID {org['id']}: '{org['organization_name']}' -> No matching club (keeping original)")
        
        # Ask for confirmation
        print(f"\n❓ This will update {len(updates)} organization records.")
        confirm = input("Do you want to proceed? (yes/no): ").strip().lower()
        
        if confirm not in ['yes', 'y']:
            print("❌ Migration cancelled.")
            return
        
        # Perform the updates
        print(f"\n=== PERFORMING MIGRATION ===")
        updated_count = 0
        
        for update in updates:
            try:
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (update['new_name'], update['new_category'], update['org_id'])
                )
                updated_count += 1
                print(f"✅ Updated org ID {update['org_id']}: {update['old_name']} -> {update['new_name']}")
            except Exception as e:
                print(f"❌ Failed to update org ID {update['org_id']}: {e}")
        
        conn.commit()
        print(f"\n✅ Migration completed! Updated {updated_count} organizations.")
        
        # Show final result
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        updated_orgs = cursor.fetchall()
        
        print(f"\n=== FINAL ORGANIZATION_DETAILS ===")
        for org in updated_orgs:
            print(f"ID: {org['id']}, Name: {org['organization_name']}, Type: {org.get('organization_type', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_organization_names()