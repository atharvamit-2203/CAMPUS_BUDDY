-- Sample Data for Campus Connect Database
-- This file populates the database with test data for development and testing

-- Insert Universities
INSERT INTO universities (name, address, city, state, country, website, contact_email, contact_phone) VALUES
('SVKM''s Mukesh Patel School of Technology Management & Engineering', 'NMIMS Campus, Vile Parle West', 'Mumbai', 'Maharashtra', 'India', 'https://mpstme.nmims.edu', 'info@mpstme.nmims.edu', '+91-22-4233-6396'),
('Indian Institute of Technology Bombay', 'Powai', 'Mumbai', 'Maharashtra', 'India', 'https://www.iitb.ac.in', 'info@iitb.ac.in', '+91-22-2572-2545'),
('Delhi Technological University', 'Shahbad Daulatpur, Rohini', 'New Delhi', 'Delhi', 'India', 'https://www.dtu.ac.in', 'registrar@dtu.ac.in', '+91-11-2787-1017');

-- Insert Colleges/Schools
INSERT INTO colleges (university_id, name, code, dean_name, contact_email, contact_phone, established_year) VALUES
(1, 'School of Technology Management & Engineering', 'STME', 'Dr. Ramesh Kumar', 'dean.stme@nmims.edu', '+91-22-4233-6400', 2006),
(1, 'School of Business Management', 'SBM', 'Dr. Priya Sharma', 'dean.sbm@nmims.edu', '+91-22-4233-6401', 2005),
(2, 'School of Engineering', 'ENG', 'Dr. Anil Verma', 'dean.eng@iitb.ac.in', '+91-22-2572-2550', 1958);

-- Insert Departments
INSERT INTO departments (college_id, name, code, head_name, contact_email, contact_phone) VALUES
(1, 'Computer Engineering', 'CMPN', 'Dr. Rajesh Patel', 'head.cmpn@nmims.edu', '+91-22-4233-6410', 'Engineering'),
(1, 'Information Technology', 'INFT', 'Dr. Sneha Joshi', 'head.inft@nmims.edu', '+91-22-4233-6411', 'Engineering'),
(1, 'Electronics & Telecommunication', 'EXTC', 'Dr. Amit Singh', 'head.extc@nmims.edu', '+91-22-4233-6412', 'Engineering'),
(2, 'Finance', 'FIN', 'Dr. Kavita Mehta', 'head.fin@nmims.edu', '+91-22-4233-6420', 'Business'),
(3, 'Computer Science', 'CS', 'Dr. Suresh Gupta', 'head.cs@iitb.ac.in', '+91-22-2572-2560', 'Engineering');

-- Insert Courses
INSERT INTO courses (department_id, name, code, credits, duration_years, course_type, description) VALUES
(1, 'Bachelor of Technology in Computer Engineering', 'B.Tech CMPN', 160, 4, 'undergraduate', 'Comprehensive computer engineering program'),
(2, 'Bachelor of Technology in Information Technology', 'B.Tech IT', 160, 4, 'undergraduate', 'Information technology and systems program'),
(3, 'Bachelor of Technology in Electronics & Telecommunication', 'B.Tech EXTC', 160, 4, 'undergraduate', 'Electronics and communication systems'),
(1, 'Master of Technology in Computer Engineering', 'M.Tech CMPN', 64, 2, 'postgraduate', 'Advanced computer engineering studies'),
(4, 'Master of Business Administration', 'MBA', 120, 2, 'postgraduate', 'Business administration and management');

-- Insert Academic Years
INSERT INTO academic_years (year, start_date, end_date, is_current) VALUES
('2023-24', '2023-07-01', '2024-06-30', false),
('2024-25', '2024-07-01', '2025-06-30', true),
('2025-26', '2025-07-01', '2026-06-30', false);

-- Insert Semesters
INSERT INTO semesters (academic_year_id, semester_number, name, start_date, end_date, is_current) VALUES
(2, 1, 'Semester 1', '2024-07-01', '2024-11-30', false),
(2, 2, 'Semester 2', '2024-12-01', '2025-05-31', true),
(3, 1, 'Semester 1', '2025-07-01', '2025-11-30', false);

-- Insert Users (Students, Faculty, Organizations)
INSERT INTO users (
    email, password_hash, first_name, last_name, role, is_active, 
    university_id, college_id, department_id, phone, date_of_birth, 
    address, city, state, postal_code, emergency_contact_name, 
    emergency_contact_phone, profile_picture_url
) VALUES
-- Students
('student1@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Arjun', 'Sharma', 'student', true, 1, 1, 1, '+91-98765-43210', '2002-05-15', '123 Main St', 'Mumbai', 'Maharashtra', '400057', 'Rajesh Sharma', '+91-98765-43211', null),
('student2@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Priya', 'Patel', 'student', true, 1, 1, 2, '+91-98765-43212', '2002-08-22', '456 Oak Ave', 'Mumbai', 'Maharashtra', '400058', 'Suresh Patel', '+91-98765-43213', null),
('student3@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Rohit', 'Kumar', 'student', true, 1, 1, 1, '+91-98765-43214', '2001-12-10', '789 Pine Rd', 'Mumbai', 'Maharashtra', '400059', 'Mohan Kumar', '+91-98765-43215', null),

-- Faculty
('faculty1@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dr. Rajesh', 'Patel', 'faculty', true, 1, 1, 1, '+91-98765-43220', '1975-03-20', '100 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Meera Patel', '+91-98765-43221', null),
('faculty2@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dr. Sneha', 'Joshi', 'faculty', true, 1, 1, 2, '+91-98765-43222', '1978-07-08', '101 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Amit Joshi', '+91-98765-43223', null),
('faculty3@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Prof. Amit', 'Singh', 'faculty', true, 1, 1, 3, '+91-98765-43224', '1980-11-15', '102 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Sunita Singh', '+91-98765-43225', null),

-- Organizations
('techclub@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Tech', 'Club', 'organization', true, 1, 1, 1, '+91-98765-43230', null, 'Student Activity Center', 'Mumbai', 'Maharashtra', '400057', 'Dr. Rajesh Patel', '+91-98765-43220', null),
('dramatics@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dramatics', 'Society', 'organization', true, 1, 1, null, '+91-98765-43231', null, 'Cultural Center', 'Mumbai', 'Maharashtra', '400057', 'Dr. Sneha Joshi', '+91-98765-43222', null);

-- Insert Student Details
INSERT INTO student_details (user_id, student_id, course_id, current_semester, current_year, admission_date, graduation_date, cgpa, attendance_percentage) VALUES
(1, 'MPSTME2024001', 1, 2, 1, '2024-07-01', '2028-06-30', 8.5, 85.5),
(2, 'MPSTME2024002', 2, 2, 1, '2024-07-01', '2028-06-30', 9.2, 92.3),
(3, 'MPSTME2023001', 1, 4, 2, '2023-07-01', '2027-06-30', 7.8, 78.9);

-- Insert Faculty Details
INSERT INTO faculty_details (user_id, employee_id, designation, hire_date, office_location, research_interests, qualifications) VALUES
(4, 'NMIMS001', 'Professor', '2015-08-01', 'Room 201, Block A', 'Machine Learning, Data Science', 'Ph.D. Computer Science, M.Tech Computer Engineering'),
(5, 'NMIMS002', 'Associate Professor', '2018-01-15', 'Room 202, Block A', 'Software Engineering, Web Development', 'Ph.D. Information Technology, M.Tech IT'),
(6, 'NMIMS003', 'Assistant Professor', '2020-07-01', 'Room 203, Block B', 'Signal Processing, IoT', 'Ph.D. Electronics, M.Tech EXTC');

-- Insert Organization Details
INSERT INTO organization_details (user_id, organization_name, organization_type, founded_date, faculty_advisor_id, description, website) VALUES
(7, 'Tech Club MPSTME', 'technical', '2010-08-15', 4, 'Technical club for computer science students', 'https://techclub.mpstme.edu'),
(8, 'Dramatics Society', 'cultural', '2008-03-20', 5, 'Cultural club for performing arts', 'https://dramatics.mpstme.edu');

-- Insert Subjects
INSERT INTO subjects (name, code, credits, department_id, semester, year, subject_type, description) VALUES
('Data Structures and Algorithms', 'CMPN301', 4, 1, 3, 2, 'core', 'Fundamental data structures and algorithmic techniques'),
('Database Management Systems', 'CMPN302', 4, 1, 3, 2, 'core', 'Relational database design and management'),
('Computer Networks', 'CMPN303', 3, 1, 4, 2, 'core', 'Network protocols and architectures'),
('Machine Learning', 'CMPN401', 4, 1, 7, 4, 'elective', 'Introduction to machine learning algorithms'),
('Web Technologies', 'INFT301', 3, 2, 3, 2, 'core', 'Frontend and backend web development'),
('Mobile App Development', 'INFT401', 3, 2, 7, 4, 'elective', 'Android and iOS application development');

-- Insert Rooms
INSERT INTO rooms (room_number, room_name, building, floor, capacity, room_type, facilities, is_available) VALUES
('A101', 'Computer Lab 1', 'Block A', 1, 30, 'laboratory', '{"computers": 30, "projector": true, "ac": true}', true),
('A102', 'Lecture Hall 1', 'Block A', 1, 60, 'classroom', '{"projector": true, "ac": true, "whiteboard": true}', true),
('A201', 'Conference Room', 'Block A', 2, 20, 'meeting', '{"projector": true, "video_conf": true, "ac": true}', true),
('B101', 'Electronics Lab', 'Block B', 1, 25, 'laboratory', '{"equipment": true, "projector": true, "ac": true}', true),
('B201', 'Seminar Hall', 'Block B', 2, 100, 'auditorium', '{"projector": true, "sound_system": true, "ac": true}', true);

-- Insert Class Schedule
INSERT INTO class_schedule (
    subject_id, faculty_id, room_id, semester_id, day_of_week, start_time, end_time, 
    class_type, is_active
) VALUES
(1, 4, 1, 2, 'monday', '09:00:00', '10:30:00', 'lecture', true),
(1, 4, 1, 2, 'wednesday', '09:00:00', '10:30:00', 'lecture', true),
(1, 4, 1, 2, 'friday', '11:00:00', '12:30:00', 'practical', true),
(2, 4, 2, 2, 'tuesday', '10:30:00', '12:00:00', 'lecture', true),
(2, 4, 2, 2, 'thursday', '10:30:00', '12:00:00', 'lecture', true),
(5, 5, 1, 2, 'monday', '14:00:00', '15:30:00', 'lecture', true),
(5, 5, 1, 2, 'wednesday', '14:00:00', '15:30:00', 'practical', true);

-- Insert Canteen Menu Items
INSERT INTO canteen_menu_items (name, description, category, price, is_available, dietary_info, image_url, preparation_time_minutes) VALUES
-- Main Course
('Butter Chicken', 'Creamy tomato-based chicken curry with Indian spices', 'main_course', 180.00, true, 'non_vegetarian', null, 15),
('Paneer Makhani', 'Rich cottage cheese curry in creamy tomato gravy', 'main_course', 160.00, true, 'vegetarian', null, 12),
('Dal Makhani', 'Slow-cooked black lentils in rich gravy', 'main_course', 140.00, true, 'vegetarian', null, 10),
('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 'main_course', 220.00, true, 'non_vegetarian', null, 20),
('Veg Biryani', 'Fragrant rice with mixed vegetables and spices', 'main_course', 180.00, true, 'vegetarian', null, 18),

-- Snacks
('Samosa', 'Crispy pastry filled with spiced potatoes', 'snacks', 25.00, true, 'vegetarian', null, 5),
('Pav Bhaji', 'Spiced vegetable curry served with bread rolls', 'snacks', 80.00, true, 'vegetarian', null, 8),
('Vada Pav', 'Mumbai street food - spiced potato fritter in bread', 'snacks', 30.00, true, 'vegetarian', null, 3),
('Chicken Sandwich', 'Grilled chicken sandwich with vegetables', 'snacks', 120.00, true, 'non_vegetarian', null, 10),
('Club Sandwich', 'Multi-layered sandwich with chicken and vegetables', 'snacks', 150.00, true, 'non_vegetarian', null, 12),

-- Beverages
('Masala Chai', 'Traditional Indian spiced tea', 'beverages', 20.00, true, 'vegetarian', null, 3),
('Coffee', 'Fresh brewed coffee', 'beverages', 25.00, true, 'vegetarian', null, 2),
('Fresh Lime Soda', 'Refreshing lime drink with soda', 'beverages', 35.00, true, 'vegan', null, 2),
('Mango Lassi', 'Traditional yogurt-based mango drink', 'beverages', 50.00, true, 'vegetarian', null, 3),
('Cold Coffee', 'Iced coffee with milk and sugar', 'beverages', 60.00, true, 'vegetarian', null, 4),

-- Desserts
('Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 'desserts', 40.00, true, 'vegetarian', null, 2),
('Rasgulla', 'Soft cottage cheese balls in syrup', 'desserts', 35.00, true, 'vegetarian', null, 2),
('Ice Cream', 'Vanilla ice cream scoop', 'desserts', 45.00, true, 'vegetarian', null, 1);

-- Insert Sample Canteen Orders
INSERT INTO canteen_orders (
    user_id, order_date, total_amount, payment_status, payment_method, 
    order_status, qr_code_data, pickup_time, special_instructions
) VALUES
(1, '2024-12-19 12:30:00', 200.00, 'pending', 'pay_later', 'confirmed', 
 'ORDER_2024121912301', '2024-12-19 13:00:00', 'Less spicy please'),
(2, '2024-12-19 13:15:00', 145.00, 'paid', 'online', 'preparing', 
 'ORDER_2024121913152', '2024-12-19 13:45:00', null),
(3, '2024-12-19 14:00:00', 90.00, 'paid', 'cash', 'ready', 
 'ORDER_2024121914003', '2024-12-19 14:30:00', 'Extra pickle');

-- Insert Order Items
INSERT INTO canteen_order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order 1
(1, 1, 1, 180.00, 180.00, 'Less spicy'),
(1, 11, 1, 20.00, 20.00, null),
-- Order 2
(2, 5, 1, 180.00, 180.00, null),
(3, 7, 1, 80.00, 80.00, 'Extra pickle'),
(3, 12, 1, 25.00, 25.00, null);

-- Insert Sample Room Bookings
INSERT INTO room_bookings (
    user_id, room_id, booking_date, start_time, end_time, purpose, 
    status, booking_type, attendees_count, special_requirements
) VALUES
(7, 3, '2024-12-20', '15:00:00', '17:00:00', 'Tech Club Meeting', 'confirmed', 'meeting', 15, 'Projector required'),
(8, 5, '2024-12-21', '18:00:00', '20:00:00', 'Drama Practice', 'confirmed', 'practice', 25, 'Sound system needed'),
(4, 1, '2024-12-22', '10:00:00', '12:00:00', 'Extra Programming Class', 'pending', 'class', 20, 'Computer lab setup');

-- Insert Sample Extra Classes
INSERT INTO extra_classes (
    faculty_id, subject_id, room_id, class_date, start_time, end_time, 
    topic, description, max_students, registration_deadline, status
) VALUES
(4, 1, 1, '2024-12-22', '10:00:00', '12:00:00', 'Advanced Algorithms', 
 'Deep dive into complex algorithmic problems and optimization techniques', 20, '2024-12-21 18:00:00', 'open'),
(5, 5, 1, '2024-12-23', '14:00:00', '16:00:00', 'React JS Workshop', 
 'Hands-on workshop on React.js for modern web development', 15, '2024-12-22 18:00:00', 'open');

-- Insert Sample Extra Class Registrations
INSERT INTO extra_class_registrations (extra_class_id, student_id, registration_date, attendance_status) VALUES
(1, 1, '2024-12-19 16:00:00', 'registered'),
(1, 3, '2024-12-19 17:30:00', 'registered'),
(2, 2, '2024-12-19 18:45:00', 'registered');

-- Insert Sample Notifications
INSERT INTO notifications (
    user_id, title, message, notification_type, is_read, priority, 
    action_url, expires_at
) VALUES
(1, 'Order Ready for Pickup', 'Your canteen order #ORDER_2024121912301 is ready for pickup', 'canteen', false, 'high', '/canteen/orders/1', '2024-12-19 15:00:00'),
(2, 'Extra Class Available', 'New extra class on React JS Workshop available for registration', 'academic', false, 'medium', '/extra-classes/2', '2024-12-22 18:00:00'),
(3, 'Timetable Update', 'Database Management Systems class moved to Room A201', 'academic', false, 'high', '/timetable', null),
(7, 'Room Booking Confirmed', 'Your room booking for Conference Room on Dec 20 is confirmed', 'booking', true, 'medium', '/bookings/1', null);

-- Insert Sample QR Code Scans
INSERT INTO qr_code_scans (
    qr_code_data, scanned_by, scan_location, scan_type, 
    is_valid, additional_data
) VALUES
('ORDER_2024121913152', 2, 'Canteen Counter 1', 'canteen_pickup', true, '{"order_id": 2, "pickup_confirmed": true}'),
('ORDER_2024121914003', 3, 'Canteen Counter 2', 'canteen_pickup', true, '{"order_id": 3, "pickup_confirmed": true}');

-- Insert Analytics Data
INSERT INTO canteen_analytics (
    date, total_orders, total_revenue, most_popular_item_id, 
    avg_order_value, peak_hour, total_customers
) VALUES
('2024-12-19', 15, 2500.00, 1, 166.67, 13, 12),
('2024-12-18', 12, 1800.00, 5, 150.00, 12, 10),
('2024-12-17', 18, 3200.00, 7, 177.78, 14, 15);

-- Create some sample views and verify data
DO $$
BEGIN
    -- Update user statistics
    UPDATE users SET last_login = NOW() - INTERVAL '1 hour' WHERE id <= 5;
    
    -- Update some menu item availability
    UPDATE canteen_menu_items SET is_available = false WHERE id = 4; -- Chicken Biryani temporarily unavailable
    
    -- Add some system logs
    RAISE NOTICE 'Sample data insertion completed successfully!';
    RAISE NOTICE 'Total users created: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Total menu items: %', (SELECT COUNT(*) FROM canteen_menu_items);
    RAISE NOTICE 'Total orders: %', (SELECT COUNT(*) FROM canteen_orders);
    RAISE NOTICE 'Total room bookings: %', (SELECT COUNT(*) FROM room_bookings);
END $$;
