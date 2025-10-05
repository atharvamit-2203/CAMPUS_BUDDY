#!/usr/bin/env python3
"""
Advanced migration script with custom organization-to-club mapping.
Allows you to specify exactly which organization should be replaced by which club.
"""
import mysql.connector
from database import get_mysql_connection

# CUSTOM MAPPING: Edit this to map specific organizations to specific clubs
# Format: {organization_id: club_id} or {organization_name: club_name}
CUSTOM_MAPPING = {
    # Example mappings - edit these based on your needs:
    # 1: 1,  # Organization ID 1 -> Club ID 1
    # 2: 2,  # Organization ID 2 -> Club ID 2
    # Or use names:
    # "Technology Society": "AI & Machine Learning Society",
    # "Business Club": "Entrepreneurship Cell",
}

def migrate_with_custom_mapping():
    """Update organization_details using custom mapping"""
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check tables exist
        cursor.execute("SHOW TABLES")
        tables = [row[list(row.keys())[0]] for row in cursor.fetchall()]
        
        if "clubs" not in tables or "organization_details" not in tables:
            print("❌ Required tables not found!")
            return
        
        # Get all clubs and organizations
        cursor.execute("SELECT id, name, description, category FROM clubs ORDER BY id")
        clubs = cursor.fetchall()
        clubs_by_id = {club['id']: club for club in clubs}
        clubs_by_name = {club['name']: club for club in clubs}
        
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        orgs = cursor.fetchall()
        orgs_by_id = {org['id']: org for org in orgs}
        orgs_by_name = {org['organization_name']: org for org in orgs}
        
        print("=== AVAILABLE CLUBS ===")
        for i, club in enumerate(clubs, 1):
            print(f"{i}. ID: {club['id']}, Name: '{club['name']}', Category: {club.get('category', 'N/A')}")
        
        print(f"\n=== CURRENT ORGANIZATIONS ===")
        for i, org in enumerate(orgs, 1):
            print(f"{i}. ID: {org['id']}, Name: '{org['organization_name']}', Type: {org.get('organization_type', 'N/A')}")
        
        # Process custom mapping or create interactive mapping
        updates = []
        
        if CUSTOM_MAPPING:
            print(f"\n=== USING CUSTOM MAPPING ===")
            for key, value in CUSTOM_MAPPING.items():
                org = None
                club = None
                
                # Handle ID-based mapping
                if isinstance(key, int) and isinstance(value, int):
                    org = orgs_by_id.get(key)
                    club = clubs_by_id.get(value)
                # Handle name-based mapping
                elif isinstance(key, str) and isinstance(value, str):
                    org = orgs_by_name.get(key)
                    club = clubs_by_name.get(value)
                
                if org and club:
                    updates.append({
                        'org_id': org['id'],
                        'old_name': org['organization_name'],
                        'new_name': club['name'],
                        'new_category': club.get('category', org.get('organization_type', 'General'))
                    })
                    print(f"  Org '{org['organization_name']}' -> Club '{club['name']}'")
                else:
                    print(f"  ❌ Invalid mapping: {key} -> {value}")
        else:
            # Interactive mode - let user choose mappings
            print(f"\n=== INTERACTIVE MAPPING MODE ===")
            print("For each organization, enter the club number to replace it with (or 0 to skip):")
            
            for org in orgs:
                print(f"\nOrganization: '{org['organization_name']}'")
                print("Available clubs:")
                for i, club in enumerate(clubs, 1):
                    print(f"  {i}. {club['name']}")
                
                try:
                    choice = input(f"Enter club number for '{org['organization_name']}' (0 to skip): ").strip()
                    choice_num = int(choice)
                    
                    if choice_num == 0:
                        print(f"  Skipping '{org['organization_name']}'")
                        continue
                    elif 1 <= choice_num <= len(clubs):
                        club = clubs[choice_num - 1]
                        updates.append({
                            'org_id': org['id'],
                            'old_name': org['organization_name'],
                            'new_name': club['name'],
                            'new_category': club.get('category', org.get('organization_type', 'General'))
                        })
                        print(f"  ✅ Will replace '{org['organization_name']}' with '{club['name']}'")
                    else:
                        print(f"  ❌ Invalid choice {choice_num}. Skipping.")
                except ValueError:
                    print(f"  ❌ Invalid input '{choice}'. Skipping.")
        
        if not updates:
            print("❌ No updates to perform.")
            return
        
        # Show summary and confirm
        print(f"\n=== MIGRATION SUMMARY ===")
        for update in updates:
            print(f"  Org ID {update['org_id']}: '{update['old_name']}' -> '{update['new_name']}'")
        
        confirm = input(f"\nProceed with updating {len(updates)} organizations? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("❌ Migration cancelled.")
            return
        
        # Perform updates
        print(f"\n=== PERFORMING MIGRATION ===")
        updated_count = 0
        
        for update in updates:
            try:
                cursor.execute(
                    "UPDATE organization_details SET organization_name = %s, organization_type = %s WHERE id = %s",
                    (update['new_name'], update['new_category'], update['org_id'])
                )
                updated_count += 1
                print(f"✅ Updated org ID {update['org_id']}")
            except Exception as e:
                print(f"❌ Failed to update org ID {update['org_id']}: {e}")
        
        conn.commit()
        print(f"\n✅ Migration completed! Updated {updated_count} organizations.")
        
        # Show final result
        cursor.execute("SELECT id, organization_name, organization_type FROM organization_details ORDER BY id")
        final_orgs = cursor.fetchall()
        
        print(f"\n=== FINAL ORGANIZATION_DETAILS ===")
        for org in final_orgs:
            print(f"ID: {org['id']}, Name: '{org['organization_name']}', Type: {org.get('organization_type', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_with_custom_mapping()