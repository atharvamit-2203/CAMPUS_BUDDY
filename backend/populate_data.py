#!/usr/bin/env python3
"""
Campus Connect Data Population Script
Populates database with 50+ interconnected Indian data records
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta, date, time
import json

# Load environment variables
load_dotenv()

class CampusDataPopulator:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.connect_to_db()
        
    def connect_to_db(self):
        """Connect to MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('MYSQL_HOST', 'localhost'),
                port=int(os.getenv('MYSQL_PORT', '3306')),
                user=os.getenv('MYSQL_USER', 'root'),
                password=os.getenv('MYSQL_PASSWORD', ''),
                database='campus_connect',
                autocommit=True
            )
            self.cursor = self.connection.cursor()
            print("✅ Connected to MySQL database")
        except Error as e:
            print(f"❌ Database connection error: {e}")
            exit(1)

    def clear_existing_data(self):
        """Clear existing data from tables"""
        tables = [
            'room_bookings', 'canteen_orders', 'canteen_order_items',
            'canteen_menu_items', 'rooms', 'users'
        ]
        
        print("🧹 Clearing existing data...")
        for table in tables:
            try:
                self.cursor.execute(f"DELETE FROM {table}")
                print(f"  ✅ Cleared {table}")
            except Error as e:
                print(f"  ⚠️  Warning clearing {table}: {e}")
    
    def populate_users(self):
        """Populate users table with Indian names and data"""
        print("👥 Populating users...")
        
        # Indian names data
        indian_names = {
            'male_first': ['Aarav', 'Arjun', 'Rohan', 'Vikram', 'Rahul', 'Karan', 'Adithya', 'Ravi', 'Suresh', 'Amit', 'Raj', 'Deepak', 'Ankit', 'Nikhil', 'Prateek', 'Siddharth', 'Varun', 'Ashish', 'Rishabh', 'Harsh'],
            'female_first': ['Priya', 'Ananya', 'Shreya', 'Kavya', 'Neha', 'Pooja', 'Divya', 'Riya', 'Meera', 'Swati', 'Sakshi', 'Nisha', 'Pallavi', 'Rekha', 'Sunita', 'Geeta', 'Madhuri', 'Sonia', 'Kiran', 'Usha'],
            'last': ['Sharma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Agarwal', 'Jain', 'Bansal', 'Mehta', 'Shah', 'Verma', 'Malhotra', 'Chopra', 'Arora', 'Kapoor', 'Saxena', 'Mishra', 'Joshi', 'Tyagi', 'Pandey', 'Yadav', 'Reddy', 'Rao', 'Nair', 'Iyer']
        }
        
        departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'Electrical', 'Chemical', 'Biotechnology']
        
        users_data = []
        
        # Admin users
        admin_users = [
            ('admin', 'admin@campus.com', 'Dr. Rajesh Kumar', 'admin', 'Administration'),
            ('principal', 'principal@campus.com', 'Dr. Sunita Sharma', 'admin', 'Administration'),
        ]
        
        for username, email, full_name, role, dept in admin_users:
            users_data.append((username, email, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', full_name, role, dept, True, True))
        
        # Faculty users (15 faculty members)
        faculty_titles = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']
        for i in range(15):
            gender = random.choice(['male', 'female'])
            first_name = random.choice(indian_names[f'{gender}_first'])
            last_name = random.choice(indian_names['last'])
            title = random.choice(faculty_titles)
            full_name = f"{title} {first_name} {last_name}"
            username = f"faculty{i+1}"
            email = f"faculty{i+1}@campus.com"
            department = random.choice(departments)
            
            users_data.append((username, email, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', full_name, 'faculty', department, True, True))
        
        # Student users (35 students)
        for i in range(35):
            gender = random.choice(['male', 'female'])
            first_name = random.choice(indian_names[f'{gender}_first'])
            last_name = random.choice(indian_names['last'])
            full_name = f"{first_name} {last_name}"
            username = f"student{i+1}"
            email = f"student{i+1}@campus.com"
            department = random.choice(departments)
            
            users_data.append((username, email, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkyNQNq7HMV2yzq', full_name, 'student', department, True, True))
        
        # Insert users
        insert_query = """
        INSERT INTO users (username, email, password_hash, full_name, role, department, is_active, is_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            self.cursor.executemany(insert_query, users_data)
            print(f"  ✅ Inserted {len(users_data)} users")
        except Error as e:
            print(f"  ❌ Error inserting users: {e}")
    
    def populate_rooms(self):
        """Populate rooms table with Indian college infrastructure"""
        print("🏢 Populating rooms...")
        
        rooms_data = []
        
        # Academic Block A - Lecture Halls
        for i in range(1, 11):
            rooms_data.append((f"A{i:03d}", f"Lecture Hall A{i}", "Academic Block A", random.randint(80, 120), "lecture_hall"))
        
        # Academic Block B - Classrooms
        for i in range(1, 16):
            rooms_data.append((f"B{i:03d}", f"Classroom B{i}", "Academic Block B", random.randint(40, 60), "classroom"))
        
        # Engineering Block - Labs
        lab_types = ["Computer Lab", "Electronics Lab", "Physics Lab", "Chemistry Lab", "Mechanical Workshop"]
        for i in range(1, 11):
            lab_type = random.choice(lab_types)
            rooms_data.append((f"E{i:03d}", f"{lab_type} {i}", "Engineering Block", random.randint(25, 35), "lab"))
        
        # Administrative Block - Meeting Rooms
        for i in range(1, 8):
            rooms_data.append((f"AD{i:02d}", f"Meeting Room {i}", "Administrative Block", random.randint(15, 25), "meeting_room"))
        
        # Library Block
        library_rooms = [
            ("LIB01", "Reading Hall 1", "Library Block", 100, "study_hall"),
            ("LIB02", "Reading Hall 2", "Library Block", 80, "study_hall"),
            ("LIB03", "Group Study Room 1", "Library Block", 12, "study_room"),
            ("LIB04", "Group Study Room 2", "Library Block", 12, "study_room"),
            ("LIB05", "Discussion Room", "Library Block", 20, "meeting_room"),
        ]
        rooms_data.extend(library_rooms)
        
        # Sports Complex
        sports_rooms = [
            ("SP01", "Basketball Court", "Sports Complex", 200, "sports"),
            ("SP02", "Badminton Court 1", "Sports Complex", 50, "sports"),
            ("SP03", "Badminton Court 2", "Sports Complex", 50, "sports"),
            ("SP04", "Table Tennis Room", "Sports Complex", 30, "sports"),
            ("SP05", "Gymnasium", "Sports Complex", 100, "sports"),
        ]
        rooms_data.extend(sports_rooms)
        
        # Insert rooms
        insert_query = """
        INSERT INTO rooms (room_number, room_name, building, capacity, room_type)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        try:
            self.cursor.executemany(insert_query, rooms_data)
            print(f"  ✅ Inserted {len(rooms_data)} rooms")
        except Error as e:
            print(f"  ❌ Error inserting rooms: {e}")
    
    def populate_canteen_menu(self):
        """Populate canteen menu with Indian food items"""
        print("🍽️ Populating canteen menu...")
        
        menu_items = [
            # Main Course - Indian Items
            ("Aloo Paratha", "Fresh wheat bread stuffed with spiced potatoes", 45.00, "Main Course"),
            ("Chole Bhature", "Spicy chickpeas with fried bread", 65.00, "Main Course"),
            ("Rajma Rice", "Kidney beans curry with steamed rice", 70.00, "Main Course"),
            ("Dal Tadka", "Yellow lentils tempered with spices", 50.00, "Main Course"),
            ("Paneer Butter Masala", "Cottage cheese in rich tomato gravy", 85.00, "Main Course"),
            ("Chicken Biryani", "Aromatic rice with spiced chicken", 120.00, "Main Course"),
            ("Mutton Curry", "Spicy goat meat curry", 150.00, "Main Course"),
            ("Fish Fry", "Crispy fried fish with spices", 90.00, "Main Course"),
            ("Veg Biryani", "Aromatic rice with mixed vegetables", 80.00, "Main Course"),
            ("Samosa", "Deep fried pastry with potato filling", 25.00, "Snacks"),
            ("Pav Bhaji", "Spicy vegetable curry with bread", 60.00, "Main Course"),
            ("Dosa", "Crispy South Indian crepe", 55.00, "Main Course"),
            ("Idli Sambhar", "Steamed rice cakes with lentil soup", 40.00, "Main Course"),
            
            # Beverages
            ("Masala Chai", "Traditional Indian spiced tea", 20.00, "Beverages"),
            ("Coffee", "South Indian filter coffee", 25.00, "Beverages"),
            ("Lassi", "Sweet yogurt drink", 35.00, "Beverages"),
            ("Nimbu Paani", "Fresh lime water", 30.00, "Beverages"),
            ("Mango Juice", "Fresh mango juice", 40.00, "Beverages"),
            ("Buttermilk", "Spiced yogurt drink", 25.00, "Beverages"),
            
            # Snacks
            ("Pakora", "Deep fried vegetable fritters", 35.00, "Snacks"),
            ("Bhel Puri", "Puffed rice snack with chutneys", 45.00, "Snacks"),
            ("Dabeli", "Spiced potato sandwich", 40.00, "Snacks"),
            ("Kachori", "Fried pastry with spiced filling", 30.00, "Snacks"),
            ("Aloo Chaat", "Spicy potato snack", 35.00, "Snacks"),
            
            # Desserts
            ("Gulab Jamun", "Sweet milk dumplings in syrup", 50.00, "Desserts"),
            ("Rasgulla", "Spongy cottage cheese balls in syrup", 45.00, "Desserts"),
            ("Kulfi", "Traditional Indian ice cream", 40.00, "Desserts"),
            ("Jalebi", "Crispy sweet pretzel in syrup", 35.00, "Desserts"),
            ("Kheer", "Rice pudding with nuts", 45.00, "Desserts"),
        ]
        
        insert_query = """
        INSERT INTO canteen_menu_items (name, description, price, category)
        VALUES (%s, %s, %s, %s)
        """
        
        try:
            self.cursor.executemany(insert_query, menu_items)
            print(f"  ✅ Inserted {len(menu_items)} menu items")
        except Error as e:
            print(f"  ❌ Error inserting menu items: {e}")
    
    def populate_room_bookings(self):
        """Populate room bookings with realistic data"""
        print("📅 Populating room bookings...")
        
        # Get user and room IDs
        self.cursor.execute("SELECT id FROM users WHERE role IN ('faculty', 'student')")
        user_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT id FROM rooms")
        room_ids = [row[0] for row in self.cursor.fetchall()]
        
        bookings_data = []
        
        # Generate bookings for next 30 days
        base_date = date.today()
        
        for day_offset in range(30):
            booking_date = base_date + timedelta(days=day_offset)
            
            # Skip weekends for academic bookings
            if booking_date.weekday() < 5:  # Monday to Friday
                # Generate 3-8 bookings per day
                num_bookings = random.randint(3, 8)
                
                for _ in range(num_bookings):
                    user_id = random.choice(user_ids)
                    room_id = random.choice(room_ids)
                    
                    # Random time slots
                    start_hour = random.randint(9, 16)  # 9 AM to 4 PM
                    start_time = time(start_hour, random.choice([0, 30]))
                    end_time = time(start_hour + random.randint(1, 2), random.choice([0, 30]))
                    
                    purposes = [
                        "Lecture - Computer Science",
                        "Lab Session - Programming",
                        "Faculty Meeting",
                        "Student Presentation",
                        "Workshop - Web Development",
                        "Seminar - Data Science",
                        "Group Study",
                        "Project Discussion",
                        "Exam Preparation",
                        "Club Meeting"
                    ]
                    purpose = random.choice(purposes)
                    status = random.choices(['confirmed', 'pending', 'completed'], weights=[60, 20, 20])[0]
                    
                    bookings_data.append((user_id, room_id, booking_date, start_time, end_time, purpose, status))
        
        insert_query = """
        INSERT INTO room_bookings (user_id, room_id, booking_date, start_time, end_time, purpose, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            self.cursor.executemany(insert_query, bookings_data)
            print(f"  ✅ Inserted {len(bookings_data)} room bookings")
        except Error as e:
            print(f"  ❌ Error inserting room bookings: {e}")
    
    def populate_canteen_orders(self):
        """Populate canteen orders with realistic Indian ordering patterns"""
        print("🛒 Populating canteen orders...")
        
        # Get user and menu item IDs
        self.cursor.execute("SELECT id FROM users WHERE role IN ('student', 'faculty')")
        user_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT id, price FROM canteen_menu_items")
        menu_items = {row[0]: row[1] for row in self.cursor.fetchall()}
        
        orders_data = []
        
        # Generate orders for past 15 days
        base_date = datetime.now()
        
        for day_offset in range(-15, 1):  # Past 15 days to today
            order_date = base_date + timedelta(days=day_offset)
            
            # Generate 20-40 orders per day
            num_orders = random.randint(20, 40)
            
            for _ in range(num_orders):
                user_id = random.choice(user_ids)
                
                # Random number of items per order (1-5)
                num_items = random.randint(1, 5)
                selected_items = random.sample(list(menu_items.keys()), min(num_items, len(menu_items)))
                
                total_amount = sum(menu_items[item_id] * random.randint(1, 3) for item_id in selected_items)
                
                payment_methods = ['cash', 'online', 'card']
                payment_method = random.choices(payment_methods, weights=[50, 30, 20])[0]
                
                payment_status = random.choices(['paid', 'pending'], weights=[85, 15])[0]
                order_status = random.choices(['completed', 'ready', 'preparing'], weights=[70, 20, 10])[0]
                
                qr_code = f"QR{random.randint(100000, 999999)}"
                
                orders_data.append((user_id, total_amount, order_status, payment_method, payment_status, order_date, qr_code))
        
        insert_query = """
        INSERT INTO canteen_orders (user_id, total_amount, order_status, payment_method, payment_status, order_date, qr_code)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            self.cursor.executemany(insert_query, orders_data)
            print(f"  ✅ Inserted {len(orders_data)} canteen orders")
        except Error as e:
            print(f"  ❌ Error inserting canteen orders: {e}")
    
    def show_data_summary(self):
        """Show summary of populated data"""
        print("\n📊 Data Population Summary:")
        print("=" * 50)
        
        tables = ['users', 'rooms', 'canteen_menu_items', 'room_bookings', 'canteen_orders']
        
        for table in tables:
            try:
                self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = self.cursor.fetchone()[0]
                print(f"  📋 {table.replace('_', ' ').title()}: {count} records")
            except Error as e:
                print(f"  ❌ Error counting {table}: {e}")
        
        # Show sample data
        print("\n👥 Sample Users:")
        self.cursor.execute("SELECT full_name, role, department FROM users LIMIT 5")
        for user in self.cursor.fetchall():
            print(f"  - {user[0]} ({user[1]}) - {user[2]}")
        
        print("\n🏢 Sample Rooms:")
        self.cursor.execute("SELECT room_number, room_name, building FROM rooms LIMIT 5")
        for room in self.cursor.fetchall():
            print(f"  - {room[0]}: {room[1]} in {room[2]}")
        
        print("\n🍽️ Sample Menu Items:")
        self.cursor.execute("SELECT name, category, price FROM canteen_menu_items LIMIT 5")
        for item in self.cursor.fetchall():
            print(f"  - {item[0]} ({item[1]}): ₹{item[2]}")
        
        print("\n🔑 Login Credentials:")
        print("  Admin: admin@campus.com / testpass123")
        print("  Faculty: faculty1@campus.com / testpass123")
        print("  Student: student1@campus.com / testpass123")
    
    def close_connection(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("\n✅ Database connection closed")

def main():
    """Main function to populate all data"""
    print("🚀 Starting Campus Connect Data Population...")
    print("🇮🇳 Using Indian names and data\n")
    
    populator = CampusDataPopulator()
    
    try:
        # Clear existing data
        populator.clear_existing_data()
        
        # Populate all tables
        populator.populate_users()
        populator.populate_rooms()
        populator.populate_canteen_menu()
        populator.populate_room_bookings()
        populator.populate_canteen_orders()
        
        # Show summary
        populator.show_data_summary()
        
        print("\n🎉 Data population completed successfully!")
        print("🚀 You can now start the FastAPI server and see the data in action!")
        
    except Exception as e:
        print(f"❌ Error during data population: {e}")
    finally:
        populator.close_connection()

if __name__ == "__main__":
    main()
