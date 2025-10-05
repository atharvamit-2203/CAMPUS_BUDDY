#!/usr/bin/env python3
"""
Add application form fields to organization_memberships table
"""

import mysql.connector
from mysql.connector import Error
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import settings

def add_application_fields():
    """Add application form fields to organization_memberships table"""
    try:
        connection = mysql.connector.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE
        )
        cursor = connection.cursor()

        print("Adding application form fields to organization_memberships table...")

        # Check existing columns
        cursor.execute("DESCRIBE organization_memberships")
        existing_columns = [col[0] for col in cursor.fetchall()]

        # Add columns for application form data if they don't exist
        columns_to_add = [
            ("full_name", "VARCHAR(255)"),
            ("batch", "VARCHAR(50)"),
            ("year_of_study", "VARCHAR(50)"),
            ("sap_id", "VARCHAR(50)"),
            ("department_to_join", "VARCHAR(255)"),
            ("why_join", "TEXT"),
            ("contribution", "TEXT"),
            ("can_stay_longer", "BOOLEAN DEFAULT FALSE"),
            ("application_date", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]

        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                query = f"ALTER TABLE organization_memberships ADD COLUMN {col_name} {col_type}"
                try:
                    cursor.execute(query)
                    print(f"Added column: {col_name}")
                except Error as e:
                    print(f"Error adding {col_name}: {e}")
            else:
                print(f"Column {col_name} already exists")

        connection.commit()
        print("Successfully added application form fields!")

        # Verify the table structure
        cursor.execute("DESCRIBE organization_memberships")
        columns = cursor.fetchall()
        print("\nUpdated table structure:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")

    except Error as e:
        print(f"Database error: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    add_application_fields()