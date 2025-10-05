#!/usr/bin/env python3
"""
Migration script to replace organizations with clubs functionality
Adds comprehensive club endpoints and maps existing organization functionality to clubs
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from config import settings

def migrate_organizations_to_clubs():
    """Create comprehensive club endpoints to replace organizations"""
    
    print("🔄 Migrating organizations functionality to clubs...")
    
    try:
        connection = mysql.connector.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE
        )
        cursor = connection.cursor()

        # 1. Ensure clubs table has all necessary columns
        print("📋 Checking clubs table structure...")
        
        # Add missing columns to clubs table if they don't exist
        missing_columns = [
            ("organization_type", "VARCHAR(50) DEFAULT 'club'"),
            ("website", "VARCHAR(255)"),
            ("contact_email", "VARCHAR(255)"),
            ("contact_phone", "VARCHAR(20)"),
            ("meeting_time", "VARCHAR(100)"),
            ("meeting_location", "VARCHAR(255)"),
            ("requirements", "TEXT"),
            ("benefits", "TEXT"),
            ("is_recruiting", "BOOLEAN DEFAULT TRUE"),
            ("featured", "BOOLEAN DEFAULT FALSE"),
            ("social_links", "JSON"),
            ("tags", "JSON"),
            ("achievements", "TEXT")
        ]
        
        for column_name, column_def in missing_columns:
            try:
                cursor.execute(f"ALTER TABLE clubs ADD COLUMN {column_name} {column_def}")
                print(f"✅ Added column: {column_name}")
            except mysql.connector.Error as e:
                if "Duplicate column name" not in str(e):
                    print(f"⚠️ Warning adding column {column_name}: {e}")

        # 2. Migrate data from organizations/organization_details to clubs
        print("📊 Migrating organization data to clubs...")
        
        # Check if organization_details table exists and has data
        cursor.execute("SHOW TABLES LIKE 'organization_details'")
        if cursor.fetchone():
            # Check what columns exist in organization_details
            cursor.execute("SHOW COLUMNS FROM organization_details")
            org_columns = {row[0] for row in cursor.fetchall()}
            
            # Build dynamic query based on available columns
            select_parts = [
                "od.organization_name" if "organization_name" in org_columns else "od.name" if "name" in org_columns else "'Unknown Club'",
                "od.description" if "description" in org_columns else "''",
                "COALESCE(od.college_id, 1)" if "college_id" in org_columns else "1",
                "od.user_id" if "user_id" in org_columns else "1",
                "1",  # is_active
                "COALESCE(od.organization_type, 'club')" if "organization_type" in org_columns else "'club'",
                "u.email" if "user_id" in org_columns else "''",
                "od.website" if "website" in org_columns else "''",
                "COALESCE(od.category, 'general')" if "category" in org_columns else "'general'"
            ]
            
            name_col = "organization_name" if "organization_name" in org_columns else ("name" if "name" in org_columns else None)
            
            if name_col:
                cursor.execute(f"""
                    INSERT IGNORE INTO clubs (
                        name, description, college_id, created_by, is_active,
                        organization_type, contact_email, website, category
                    )
                    SELECT 
                        {', '.join(select_parts)}
                    FROM organization_details od
                    LEFT JOIN users u ON u.id = od.user_id
                    WHERE od.{name_col} IS NOT NULL
                    AND NOT EXISTS (
                        SELECT 1 FROM clubs c WHERE c.name = od.{name_col}
                    )
                """)
                migrated_orgs = cursor.rowcount
                print(f"✅ Migrated {migrated_orgs} organizations to clubs")
            else:
                print("⚠️ No suitable name column found in organization_details")

        # 3. Migrate organization memberships to club memberships
        print("👥 Migrating organization memberships...")
        
        cursor.execute("SHOW TABLES LIKE 'organization_memberships'")
        if cursor.fetchone():
            # Check columns in organization_memberships
            cursor.execute("SHOW COLUMNS FROM organization_memberships")
            mem_columns = {row[0] for row in cursor.fetchall()}
            
            # Check columns in organization_details for join
            cursor.execute("SHOW COLUMNS FROM organization_details")
            org_columns = {row[0] for row in cursor.fetchall()}
            
            name_col = "organization_name" if "organization_name" in org_columns else ("name" if "name" in org_columns else None)
            
            if name_col and "user_id" in mem_columns and "organization_id" in mem_columns:
                # Build dynamic query based on available columns
                select_parts = [
                    "c.id",
                    "om.user_id",
                    "CASE WHEN om.status = 'member' THEN 'approved' ELSE COALESCE(om.status, 'approved') END" if "status" in mem_columns else "'approved'",
                    "COALESCE(om.joined_at, NOW())" if "joined_at" in mem_columns else "NOW()",
                    "om.application_message" if "application_message" in mem_columns else "''"
                ]
                
                cursor.execute(f"""
                    INSERT IGNORE INTO club_memberships (
                        club_id, user_id, status, joined_at, application_message
                    )
                    SELECT 
                        {', '.join(select_parts)}
                    FROM organization_memberships om
                    JOIN organization_details od ON od.id = om.organization_id
                    JOIN clubs c ON c.name = od.{name_col}
                    WHERE NOT EXISTS (
                        SELECT 1 FROM club_memberships cm 
                        WHERE cm.club_id = c.id AND cm.user_id = om.user_id
                    )
                """)
                migrated_memberships = cursor.rowcount
                print(f"✅ Migrated {migrated_memberships} organization memberships")
            else:
                print("⚠️ Cannot migrate memberships - missing required columns")

        # 4. Add popular clubs like E-Cell, etc.
        print("🎯 Adding popular college clubs...")
        
        popular_clubs = [
            ("E-Cell", "Entrepreneurship Cell - Foster entrepreneurial spirit and innovation", "entrepreneurship", "business"),
            ("Drama Club", "Theatrical performances and dramatic arts", "arts", "entertainment"),
            ("Music Club", "Musical performances, band activities, and concerts", "arts", "entertainment"),
            ("Photography Club", "Photography workshops, contests, and exhibitions", "arts", "creative"),
            ("Dance Club", "Various dance forms and cultural performances", "arts", "entertainment"),
            ("Coding Club", "Programming competitions, hackathons, and tech workshops", "technology", "academic"),
            ("Robotics Club", "Build robots, participate in competitions", "technology", "academic"),
            ("Literary Club", "Writing, poetry, debates, and literary events", "academic", "intellectual"),
            ("Environmental Club", "Sustainability initiatives and environmental awareness", "social", "service"),
            ("Sports Club", "Various sports activities and competitions", "sports", "fitness"),
            ("Cultural Club", "Organize cultural festivals and events", "cultural", "entertainment"),
            ("Debate Society", "Debates, public speaking, and rhetoric", "academic", "intellectual"),
            ("Social Service Club", "Community service and volunteer activities", "social", "service"),
            ("AI/ML Club", "Artificial Intelligence and Machine Learning projects", "technology", "academic"),
            ("Finance Club", "Investment, trading, and financial literacy", "business", "academic")
        ]
        
        for club_name, description, category, org_type in popular_clubs:
            try:
                cursor.execute("""
                    INSERT IGNORE INTO clubs (
                        name, description, category, organization_type, college_id, 
                        created_by, is_active, is_recruiting, max_members
                    ) VALUES (%s, %s, %s, %s, 1, 1, TRUE, TRUE, 100)
                """, (club_name, description, category, org_type))
            except mysql.connector.Error as e:
                print(f"⚠️ Warning adding {club_name}: {e}")

        connection.commit()
        print("✅ Database migration completed successfully!")
        
        # 5. Show summary
        cursor.execute("SELECT COUNT(*) FROM clubs")
        total_clubs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM club_memberships")
        total_memberships = cursor.fetchone()[0]
        
        print(f"""
📊 Migration Summary:
   • Total Clubs: {total_clubs}
   • Total Memberships: {total_memberships}
   • Popular clubs added (E-Cell, Drama, Music, etc.)
   • Organization data migrated to clubs
   • Club memberships table populated
        """)

    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def main():
    print("🚀 Starting organizations to clubs migration...")
    try:
        migrate_organizations_to_clubs()
        print("🎉 Migration completed successfully!")
    except Exception as e:
        print(f"💥 Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()