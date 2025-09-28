#!/usr/bin/env python3
"""
MySQL Database Setup Script for Campus Connect
This script creates the database and imports the schema
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', '3306')),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': True
}

DATABASE_NAME = os.getenv('MYSQL_DATABASE', 'campus_connect')

def create_database():
    """Create the Campus Connect database if it doesn't exist"""
    connection = None
    try:
        # Connect to MySQL server (without database)
        connection = mysql.connector.connect(**{k: v for k, v in MYSQL_CONFIG.items() if k != 'database'})
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute(f"SHOW DATABASES LIKE '{DATABASE_NAME}'")
        database_exists = cursor.fetchone()
        
        if database_exists:
            logger.info(f"✅ Database '{DATABASE_NAME}' already exists")
        else:
            # Create database
            cursor.execute(f"CREATE DATABASE {DATABASE_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            logger.info(f"✅ Database '{DATABASE_NAME}' created successfully")
        
        cursor.close()
        return True
        
    except Error as e:
        logger.error(f"❌ Error creating database: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            connection.close()

def test_connection():
    """Test connection to the Campus Connect database"""
    connection = None
    try:
        # Add database to config
        config = MYSQL_CONFIG.copy()
        config['database'] = DATABASE_NAME
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Test query
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            logger.info("✅ Database connection test successful")
            return True
        else:
            logger.error("❌ Database connection test failed")
            return False
            
    except Error as e:
        logger.error(f"❌ Database connection error: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def import_schema():
    """Import the database schema from SQL files"""
    connection = None
    try:
        # Add database to config
        config = MYSQL_CONFIG.copy()
        config['database'] = DATABASE_NAME
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # List of SQL files to execute in order
        sql_files = [
            'campus_connect_mysql_complete.sql',
            'ai_enhancement_tables.sql'
        ]
        
        for sql_file in sql_files:
            file_path = os.path.join(os.path.dirname(__file__), sql_file)
            
            if os.path.exists(file_path):
                logger.info(f"📂 Importing {sql_file}...")
                
                # Read and execute SQL file
                with open(file_path, 'r', encoding='utf-8') as file:
                    sql_content = file.read()
                    
                    # Split by semicolons and execute each statement
                    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
                    
                    for i, statement in enumerate(statements):
                        try:
                            if statement.upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP')):
                                cursor.execute(statement)
                                logger.debug(f"  ✅ Executed statement {i+1}/{len(statements)}")
                        except Error as e:
                            # Log warning but continue (some statements might fail if tables already exist)
                            logger.warning(f"  ⚠️  Statement {i+1} warning: {e}")
                
                logger.info(f"✅ Successfully imported {sql_file}")
            else:
                logger.warning(f"⚠️  SQL file not found: {sql_file}")
        
        cursor.close()
        return True
        
    except Error as e:
        logger.error(f"❌ Error importing schema: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            connection.close()

def show_database_info():
    """Display database information"""
    connection = None
    try:
        config = MYSQL_CONFIG.copy()
        config['database'] = DATABASE_NAME
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Get table count
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        logger.info(f"📊 Database: {DATABASE_NAME}")
        logger.info(f"📊 Tables: {len(tables)}")
        
        if tables:
            logger.info("📋 Table list:")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                logger.info(f"  - {table[0]}: {count} records")
        
        cursor.close()
        
    except Error as e:
        logger.error(f"❌ Error getting database info: {e}")
    finally:
        if connection and connection.is_connected():
            connection.close()

def main():
    """Main setup function"""
    logger.info("🚀 Starting MySQL database setup for Campus Connect...")
    
    # Step 1: Create database
    logger.info("\n📦 Step 1: Creating database...")
    if not create_database():
        logger.error("❌ Failed to create database. Exiting.")
        return False
    
    # Step 2: Test connection
    logger.info("\n🔌 Step 2: Testing database connection...")
    if not test_connection():
        logger.error("❌ Database connection failed. Exiting.")
        return False
    
    # Step 3: Import schema
    logger.info("\n📋 Step 3: Importing database schema...")
    if not import_schema():
        logger.error("❌ Schema import failed. Exiting.")
        return False
    
    # Step 4: Show database info
    logger.info("\n📊 Step 4: Database information...")
    show_database_info()
    
    logger.info("\n🎉 MySQL database setup completed successfully!")
    logger.info(f"🔗 Connection details:")
    logger.info(f"   Host: {MYSQL_CONFIG['host']}")
    logger.info(f"   Port: {MYSQL_CONFIG['port']}")
    logger.info(f"   Database: {DATABASE_NAME}")
    logger.info(f"   User: {MYSQL_CONFIG['user']}")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            exit(0)
        else:
            exit(1)
    except KeyboardInterrupt:
        logger.info("\n⚠️  Setup interrupted by user")
        exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        exit(1)
