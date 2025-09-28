#!/usr/bin/env python3
"""
Simple MySQL table creation for Campus Connect
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_essential_tables():
    """Create essential tables for Campus Connect"""
    connection = None
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database='campus_connect',
            autocommit=True
        )
        
        cursor = connection.cursor()
        
        # Essential tables for the application
        tables = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role ENUM('student', 'faculty', 'admin') DEFAULT 'student',
                college_id INT DEFAULT 1,
                department VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_number VARCHAR(20) NOT NULL,
                room_name VARCHAR(100),
                building VARCHAR(50),
                capacity INT DEFAULT 0,
                room_type VARCHAR(50) DEFAULT 'classroom',
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS canteen_menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(50),
                is_available BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS canteen_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                total_amount DECIMAL(10,2) NOT NULL,
                order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
                payment_method ENUM('cash', 'online', 'card') DEFAULT 'cash',
                payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qr_code VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS room_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                room_id INT,
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                purpose VARCHAR(200),
                status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            )
            """
        ]
        
        # Create tables
        for i, table_sql in enumerate(tables, 1):
            try:
                cursor.execute(table_sql)
                table_name = table_sql.split('TABLE IF NOT EXISTS ')[1].split(' (')[0]
                print(f"✅ Created table: {table_name}")
            except Error as e:
                print(f"❌ Error creating table {i}: {e}")
        
        # Insert sample data
        sample_data = [
            """
            INSERT INTO users (username, email, password_hash, full_name, role, department)
            VALUES 
            ('admin', 'admin@campus.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', 'Admin User', 'admin', 'IT'),
            ('student1', 'student1@campus.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', 'John Student', 'student', 'Computer Science'),
            ('faculty1', 'faculty1@campus.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', 'Prof. Smith', 'faculty', 'Computer Science')
            ON DUPLICATE KEY UPDATE username=username
            """,
            """
            INSERT INTO rooms (room_number, room_name, building, capacity, room_type)
            VALUES 
            ('A101', 'Lecture Hall A', 'Academic Block A', 100, 'lecture_hall'),
            ('B201', 'Computer Lab 1', 'Academic Block B', 30, 'lab'),
            ('C301', 'Conference Room', 'Administrative Block', 20, 'meeting_room'),
            ('A102', 'Classroom 2', 'Academic Block A', 50, 'classroom')
            """,
            """
            INSERT INTO canteen_menu_items (name, description, price, category)
            VALUES 
            ('Veg Burger', 'Delicious vegetarian burger with fresh vegetables', 80.00, 'Main Course'),
            ('Chicken Sandwich', 'Grilled chicken sandwich with mayo', 120.00, 'Main Course'),
            ('Masala Chai', 'Traditional Indian spiced tea', 20.00, 'Beverages'),
            ('Coffee', 'Fresh brewed coffee', 25.00, 'Beverages'),
            ('Pasta', 'Italian pasta with tomato sauce', 150.00, 'Main Course'),
            ('Ice Cream', 'Vanilla ice cream', 40.00, 'Desserts')
            """
        ]
        
        # Insert sample data
        for data_sql in sample_data:
            try:
                cursor.execute(data_sql)
                print(f"✅ Inserted sample data")
            except Error as e:
                print(f"⚠️  Sample data warning: {e}")
        
        cursor.close()
        return True
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            connection.close()

def show_tables():
    """Show created tables"""
    connection = None
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database='campus_connect'
        )
        
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n📊 Tables in campus_connect database:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"  - {table[0]}: {count} records")
        
        cursor.close()
        
    except Error as e:
        print(f"❌ Error showing tables: {e}")
    finally:
        if connection and connection.is_connected():
            connection.close()

if __name__ == "__main__":
    print("🚀 Creating essential MySQL tables for Campus Connect...")
    
    if create_essential_tables():
        print("\n✅ Essential tables created successfully!")
        show_tables()
        print("\n🎉 Campus Connect MySQL database is ready!")
        print("\n💡 Default login credentials:")
        print("   Email: admin@campus.com")
        print("   Password: testpass123")
    else:
        print("\n❌ Failed to create tables")
