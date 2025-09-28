#!/usr/bin/env python3
"""
Add missing table for canteen order items
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def add_missing_table():
    """Add canteen_order_items table"""
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
        
        # Create missing table
        create_table = """
        CREATE TABLE IF NOT EXISTS canteen_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT,
            menu_item_id INT,
            quantity INT DEFAULT 1,
            item_price DECIMAL(10,2),
            total_price DECIMAL(10,2),
            FOREIGN KEY (order_id) REFERENCES canteen_orders(id),
            FOREIGN KEY (menu_item_id) REFERENCES canteen_menu_items(id)
        )
        """
        
        cursor.execute(create_table)
        print("✅ Created canteen_order_items table")
        
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    add_missing_table()
