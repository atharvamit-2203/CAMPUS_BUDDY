-- Campus Connect - Complete MySQL Database Schema and Data
-- MySQL Workbench Compatible Script
-- Run this script to create the complete database with all features and sample data
-- Tables are ordered correctly to respect foreign key dependencies

-- Create Database
DROP DATABASE IF EXISTS campus_connect;
CREATE DATABASE campus_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_connect;

-- ==========================================
-- 1. FOUNDATION TABLES (No Dependencies)
-- ==========================================

-- Universities Table (No dependencies)
CREATE TABLE universities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Academic Years Table (No dependencies)
CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year VARCHAR(10) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. FIRST LEVEL DEPENDENCIES
-- ==========================================

-- Colleges Table (depends on universities)
CREATE TABLE colleges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    university_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE,
    dean_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    established_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Semesters Table (depends on academic_years)
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_year_id INT NOT NULL,
    semester_number INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. SECOND LEVEL DEPENDENCIES
-- ==========================================

-- Departments Table (depends on colleges)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    head_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    department_type ENUM('Engineering', 'Business', 'Arts', 'Science', 'Medicine', 'Other') DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. THIRD LEVEL DEPENDENCIES
-- ==========================================

-- Courses Table (depends on departments)
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    credits INT DEFAULT 0,
    duration_years INT DEFAULT 4,
    course_type ENUM('undergraduate', 'postgraduate', 'diploma', 'certificate') DEFAULT 'undergraduate',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Subjects Table (depends on departments)
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    credits INT DEFAULT 0,
    department_id INT,
    semester INT,
    year INT,
    subject_type ENUM('core', 'elective', 'optional') DEFAULT 'core',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Rooms Table (No dependencies - standalone)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    room_name VARCHAR(255),
    building VARCHAR(100),
    floor INT,
    capacity INT DEFAULT 0,
    room_type ENUM('classroom', 'laboratory', 'auditorium', 'meeting', 'office', 'other') DEFAULT 'classroom',
    facilities JSON,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table (depends on universities, colleges, departments)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'faculty', 'admin', 'organization') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    university_id INT,
    college_id INT,
    department_id INT,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Canteen Menu Items Table (No dependencies - standalone)
CREATE TABLE canteen_menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('main_course', 'snacks', 'beverages', 'desserts', 'breakfast') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    dietary_info ENUM('vegetarian', 'non_vegetarian', 'vegan', 'gluten_free') DEFAULT 'vegetarian',
    image_url VARCHAR(500),
    preparation_time_minutes INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. FOURTH LEVEL DEPENDENCIES (depends on users)
-- ==========================================

-- Student Details Table (depends on users, courses)
CREATE TABLE student_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    course_id INT,
    current_semester INT DEFAULT 1,
    current_year INT DEFAULT 1,
    admission_date DATE,
    graduation_date DATE,
    cgpa DECIMAL(3,2) DEFAULT 0.00,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Faculty Details Table (depends on users)
CREATE TABLE faculty_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100),
    hire_date DATE,
    office_location VARCHAR(255),
    research_interests TEXT,
    qualifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organization Details Table (depends on users)
CREATE TABLE organization_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type ENUM('technical', 'cultural', 'sports', 'academic', 'social', 'other') DEFAULT 'other',
    founded_date DATE,
    faculty_advisor_id INT,
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_advisor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Class Schedule Table (depends on subjects, users, rooms, semesters)
CREATE TABLE class_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    room_id INT,
    semester_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type ENUM('lecture', 'practical', 'tutorial', 'seminar') DEFAULT 'lecture',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Canteen Orders Table (depends on users)
CREATE TABLE canteen_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'online', 'card', 'pay_later') DEFAULT 'cash',
    order_status ENUM('placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'placed',
    qr_code_data VARCHAR(500),
    pickup_time TIMESTAMP NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Room Bookings Table (depends on users, rooms)
CREATE TABLE room_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    booking_type ENUM('class', 'meeting', 'event', 'practice', 'other') DEFAULT 'other',
    attendees_count INT DEFAULT 1,
    special_requirements TEXT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Extra Classes Table (depends on users, subjects, rooms)
CREATE TABLE extra_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    room_id INT,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    max_students INT DEFAULT 30,
    registration_deadline TIMESTAMP,
    status ENUM('open', 'closed', 'cancelled', 'completed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- Notifications Table (depends on users)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('general', 'academic', 'canteen', 'booking', 'payment', 'system') DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    action_url VARCHAR(500),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- QR Code Scans Table (depends on users)
CREATE TABLE qr_code_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code_data VARCHAR(500) NOT NULL,
    scanned_by INT,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_location VARCHAR(255),
    scan_type ENUM('canteen_pickup', 'room_access', 'attendance', 'event_checkin', 'other') DEFAULT 'other',
    is_valid BOOLEAN DEFAULT TRUE,
    additional_data JSON,
    FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 6. FIFTH LEVEL DEPENDENCIES
-- ==========================================

-- Canteen Order Items Table (depends on canteen_orders, canteen_menu_items)
CREATE TABLE canteen_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES canteen_menu_items(id) ON DELETE CASCADE
);

-- Extra Class Registrations Table (depends on extra_classes, users)
CREATE TABLE extra_class_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extra_class_id INT NOT NULL,
    student_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status ENUM('registered', 'attended', 'absent', 'cancelled') DEFAULT 'registered',
    FOREIGN KEY (extra_class_id) REFERENCES extra_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (extra_class_id, student_id)
);

-- ==========================================
-- 7. ANALYTICS TABLES (depends on other tables)
-- ==========================================

-- Canteen Analytics Table (depends on canteen_menu_items)
CREATE TABLE canteen_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    most_popular_item_id INT,
    avg_order_value DECIMAL(10,2) DEFAULT 0.00,
    peak_hour INT,
    total_customers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (most_popular_item_id) REFERENCES canteen_menu_items(id) ON DELETE SET NULL,
    UNIQUE KEY unique_date (date)
);

-- Room Utilization Analytics Table (depends on rooms)
CREATE TABLE room_utilization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    date DATE NOT NULL,
    total_bookings INT DEFAULT 0,
    total_hours_booked DECIMAL(5,2) DEFAULT 0.00,
    utilization_percentage DECIMAL(5,2) DEFAULT 0.00,
    peak_usage_hour INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_date (room_id, date)
);

-- ==========================================
-- 9. INDEXES FOR PERFORMANCE
-- ==========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_university ON users(university_id);
CREATE INDEX idx_users_college ON users(college_id);
CREATE INDEX idx_users_department ON users(department_id);

-- Class schedule indexes
CREATE INDEX idx_schedule_faculty ON class_schedule(faculty_id);
CREATE INDEX idx_schedule_room ON class_schedule(room_id);
CREATE INDEX idx_schedule_day_time ON class_schedule(day_of_week, start_time);
CREATE INDEX idx_schedule_semester ON class_schedule(semester_id);

-- Canteen indexes
CREATE INDEX idx_orders_user ON canteen_orders(user_id);
CREATE INDEX idx_orders_date ON canteen_orders(order_date);
CREATE INDEX idx_orders_status ON canteen_orders(order_status);
CREATE INDEX idx_menu_category ON canteen_menu_items(category);
CREATE INDEX idx_menu_available ON canteen_menu_items(is_available);

-- Room booking indexes
CREATE INDEX idx_bookings_user ON room_bookings(user_id);
CREATE INDEX idx_bookings_room ON room_bookings(room_id);
CREATE INDEX idx_bookings_date ON room_bookings(booking_date);
CREATE INDEX idx_bookings_status ON room_bookings(status);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- QR code indexes
CREATE INDEX idx_qr_scans_data ON qr_code_scans(qr_code_data);
CREATE INDEX idx_qr_scans_user ON qr_code_scans(scanned_by);
CREATE INDEX idx_qr_scans_timestamp ON qr_code_scans(scan_timestamp);

-- ==========================================
-- 10. SAMPLE DATA INSERTION
-- ==========================================

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
INSERT INTO departments (college_id, name, code, head_name, contact_email, contact_phone, department_type) VALUES
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
('2023-24', '2023-07-01', '2024-06-30', FALSE),
('2024-25', '2024-07-01', '2025-06-30', TRUE),
('2025-26', '2025-07-01', '2026-06-30', FALSE);

-- Insert Semesters
INSERT INTO semesters (academic_year_id, semester_number, name, start_date, end_date, is_current) VALUES
(2, 1, 'Semester 1', '2024-07-01', '2024-11-30', FALSE),
(2, 2, 'Semester 2', '2024-12-01', '2025-05-31', TRUE),
(3, 1, 'Semester 1', '2025-07-01', '2025-11-30', FALSE);

-- Insert Users (Students, Faculty, Organizations)
INSERT INTO users (
    email, password_hash, first_name, last_name, role, is_active, 
    university_id, college_id, department_id, phone, date_of_birth, 
    address, city, state, postal_code, emergency_contact_name, 
    emergency_contact_phone, profile_picture_url
) VALUES
-- Students
('student1@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Arjun', 'Sharma', 'student', TRUE, 1, 1, 1, '+91-98765-43210', '2002-05-15', '123 Main St', 'Mumbai', 'Maharashtra', '400057', 'Rajesh Sharma', '+91-98765-43211', NULL),
('student2@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Priya', 'Patel', 'student', TRUE, 1, 1, 2, '+91-98765-43212', '2002-08-22', '456 Oak Ave', 'Mumbai', 'Maharashtra', '400058', 'Suresh Patel', '+91-98765-43213', NULL),
('student3@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Rohit', 'Kumar', 'student', TRUE, 1, 1, 1, '+91-98765-43214', '2001-12-10', '789 Pine Rd', 'Mumbai', 'Maharashtra', '400059', 'Mohan Kumar', '+91-98765-43215', NULL),

-- Faculty
('faculty1@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dr. Rajesh', 'Patel', 'faculty', TRUE, 1, 1, 1, '+91-98765-43220', '1975-03-20', '100 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Meera Patel', '+91-98765-43221', NULL),
('faculty2@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dr. Sneha', 'Joshi', 'faculty', TRUE, 1, 1, 2, '+91-98765-43222', '1978-07-08', '101 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Amit Joshi', '+91-98765-43223', NULL),
('faculty3@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Prof. Amit', 'Singh', 'faculty', TRUE, 1, 1, 3, '+91-98765-43224', '1980-11-15', '102 Faculty Colony', 'Mumbai', 'Maharashtra', '400060', 'Sunita Singh', '+91-98765-43225', NULL),

-- Organizations
('techclub@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Tech', 'Club', 'organization', TRUE, 1, 1, 1, '+91-98765-43230', NULL, 'Student Activity Center', 'Mumbai', 'Maharashtra', '400057', 'Dr. Rajesh Patel', '+91-98765-43220', NULL),
('dramatics@nmims.edu', '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBIrkAuITHfZGe', 'Dramatics', 'Society', 'organization', TRUE, 1, 1, NULL, '+91-98765-43231', NULL, 'Cultural Center', 'Mumbai', 'Maharashtra', '400057', 'Dr. Sneha Joshi', '+91-98765-43222', NULL);

-- Insert Student Details
INSERT INTO student_details (user_id, student_id, course_id, current_semester, current_year, admission_date, graduation_date, cgpa, attendance_percentage) VALUES
(1, 'MPSTME2024001', 1, 2, 1, '2024-07-01', '2028-06-30', 8.50, 85.50),
(2, 'MPSTME2024002', 2, 2, 1, '2024-07-01', '2028-06-30', 9.20, 92.30),
(3, 'MPSTME2023001', 1, 4, 2, '2023-07-01', '2027-06-30', 7.80, 78.90);

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
('A101', 'Computer Lab 1', 'Block A', 1, 30, 'laboratory', '{"computers": 30, "projector": true, "ac": true}', TRUE),
('A102', 'Lecture Hall 1', 'Block A', 1, 60, 'classroom', '{"projector": true, "ac": true, "whiteboard": true}', TRUE),
('A201', 'Conference Room', 'Block A', 2, 20, 'meeting', '{"projector": true, "video_conf": true, "ac": true}', TRUE),
('B101', 'Electronics Lab', 'Block B', 1, 25, 'laboratory', '{"equipment": true, "projector": true, "ac": true}', TRUE),
('B201', 'Seminar Hall', 'Block B', 2, 100, 'auditorium', '{"projector": true, "sound_system": true, "ac": true}', TRUE);

-- Insert Class Schedule
INSERT INTO class_schedule (
    subject_id, faculty_id, room_id, semester_id, day_of_week, start_time, end_time, 
    class_type, is_active
) VALUES
(1, 4, 1, 2, 'monday', '09:00:00', '10:30:00', 'lecture', TRUE),
(1, 4, 1, 2, 'wednesday', '09:00:00', '10:30:00', 'lecture', TRUE),
(1, 4, 1, 2, 'friday', '11:00:00', '12:30:00', 'practical', TRUE),
(2, 4, 2, 2, 'tuesday', '10:30:00', '12:00:00', 'lecture', TRUE),
(2, 4, 2, 2, 'thursday', '10:30:00', '12:00:00', 'lecture', TRUE),
(5, 5, 1, 2, 'monday', '14:00:00', '15:30:00', 'lecture', TRUE),
(5, 5, 1, 2, 'wednesday', '14:00:00', '15:30:00', 'practical', TRUE);

-- Insert Canteen Menu Items
INSERT INTO canteen_menu_items (name, description, category, price, is_available, dietary_info, image_url, preparation_time_minutes) VALUES
-- Main Course
('Butter Chicken', 'Creamy tomato-based chicken curry with Indian spices', 'main_course', 180.00, TRUE, 'non_vegetarian', NULL, 15),
('Paneer Makhani', 'Rich cottage cheese curry in creamy tomato gravy', 'main_course', 160.00, TRUE, 'vegetarian', NULL, 12),
('Dal Makhani', 'Slow-cooked black lentils in rich gravy', 'main_course', 140.00, TRUE, 'vegetarian', NULL, 10),
('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 'main_course', 220.00, TRUE, 'non_vegetarian', NULL, 20),
('Veg Biryani', 'Fragrant rice with mixed vegetables and spices', 'main_course', 180.00, TRUE, 'vegetarian', NULL, 18),

-- Snacks
('Samosa', 'Crispy pastry filled with spiced potatoes', 'snacks', 25.00, TRUE, 'vegetarian', NULL, 5),
('Pav Bhaji', 'Spiced vegetable curry served with bread rolls', 'snacks', 80.00, TRUE, 'vegetarian', NULL, 8),
('Vada Pav', 'Mumbai street food - spiced potato fritter in bread', 'snacks', 30.00, TRUE, 'vegetarian', NULL, 3),
('Chicken Sandwich', 'Grilled chicken sandwich with vegetables', 'snacks', 120.00, TRUE, 'non_vegetarian', NULL, 10),
('Club Sandwich', 'Multi-layered sandwich with chicken and vegetables', 'snacks', 150.00, TRUE, 'non_vegetarian', NULL, 12),

-- Beverages
('Masala Chai', 'Traditional Indian spiced tea', 'beverages', 20.00, TRUE, 'vegetarian', NULL, 3),
('Coffee', 'Fresh brewed coffee', 'beverages', 25.00, TRUE, 'vegetarian', NULL, 2),
('Fresh Lime Soda', 'Refreshing lime drink with soda', 'beverages', 35.00, TRUE, 'vegan', NULL, 2),
('Mango Lassi', 'Traditional yogurt-based mango drink', 'beverages', 50.00, TRUE, 'vegetarian', NULL, 3),
('Cold Coffee', 'Iced coffee with milk and sugar', 'beverages', 60.00, TRUE, 'vegetarian', NULL, 4),

-- Desserts
('Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 'desserts', 40.00, TRUE, 'vegetarian', NULL, 2),
('Rasgulla', 'Soft cottage cheese balls in syrup', 'desserts', 35.00, TRUE, 'vegetarian', NULL, 2),
('Ice Cream', 'Vanilla ice cream scoop', 'desserts', 45.00, TRUE, 'vegetarian', NULL, 1);

-- Insert Sample Canteen Orders
INSERT INTO canteen_orders (
    user_id, order_date, total_amount, payment_status, payment_method, 
    order_status, qr_code_data, pickup_time, special_instructions
) VALUES
(1, '2024-12-19 12:30:00', 200.00, 'pending', 'pay_later', 'confirmed', 
 'ORDER_2024121912301', '2024-12-19 13:00:00', 'Less spicy please'),
(2, '2024-12-19 13:15:00', 145.00, 'paid', 'online', 'preparing', 
 'ORDER_2024121913152', '2024-12-19 13:45:00', NULL),
(3, '2024-12-19 14:00:00', 90.00, 'paid', 'cash', 'ready', 
 'ORDER_2024121914003', '2024-12-19 14:30:00', 'Extra pickle');

-- Insert Order Items
INSERT INTO canteen_order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order 1
(1, 1, 1, 180.00, 180.00, 'Less spicy'),
(1, 11, 1, 20.00, 20.00, NULL),
-- Order 2
(2, 5, 1, 180.00, 180.00, NULL),
-- Order 3
(3, 7, 1, 80.00, 80.00, 'Extra pickle'),
(3, 12, 1, 25.00, 25.00, NULL);

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
(1, 'Order Ready for Pickup', 'Your canteen order #ORDER_2024121912301 is ready for pickup', 'canteen', FALSE, 'high', '/canteen/orders/1', '2024-12-19 15:00:00'),
(2, 'Extra Class Available', 'New extra class on React JS Workshop available for registration', 'academic', FALSE, 'medium', '/extra-classes/2', '2024-12-22 18:00:00'),
(3, 'Timetable Update', 'Database Management Systems class moved to Room A201', 'academic', FALSE, 'high', '/timetable', NULL),
(7, 'Room Booking Confirmed', 'Your room booking for Conference Room on Dec 20 is confirmed', 'booking', TRUE, 'medium', '/bookings/1', NULL);

-- Insert Sample QR Code Scans
INSERT INTO qr_code_scans (
    qr_code_data, scanned_by, scan_location, scan_type, 
    is_valid, additional_data
) VALUES
('ORDER_2024121913152', 2, 'Canteen Counter 1', 'canteen_pickup', TRUE, '{"order_id": 2, "pickup_confirmed": true}'),
('ORDER_2024121914003', 3, 'Canteen Counter 2', 'canteen_pickup', TRUE, '{"order_id": 3, "pickup_confirmed": true}');

-- Insert Analytics Data
INSERT INTO canteen_analytics (
    date, total_orders, total_revenue, most_popular_item_id, 
    avg_order_value, peak_hour, total_customers
) VALUES
('2024-12-19', 15, 2500.00, 1, 166.67, 13, 12),
('2024-12-18', 12, 1800.00, 5, 150.00, 12, 10),
('2024-12-17', 18, 3200.00, 7, 177.78, 14, 15);

-- Insert Room Utilization Data
INSERT INTO room_utilization (room_id, date, total_bookings, total_hours_booked, utilization_percentage, peak_usage_hour) VALUES
(1, '2024-12-19', 4, 6.50, 81.25, 10),
(2, '2024-12-19', 3, 4.50, 56.25, 11),
(3, '2024-12-19', 2, 3.00, 37.50, 15);

-- ==========================================
-- 11. USEFUL VIEWS FOR QUICK ACCESS
-- ==========================================

-- Student Timetable View
CREATE VIEW student_timetable AS
SELECT 
    cs.id,
    u.first_name,
    u.last_name,
    s.name as subject_name,
    s.code as subject_code,
    CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
    r.room_number,
    r.room_name,
    cs.day_of_week,
    cs.start_time,
    cs.end_time,
    cs.class_type
FROM class_schedule cs
JOIN subjects s ON cs.subject_id = s.id
JOIN users f ON cs.faculty_id = f.id
LEFT JOIN rooms r ON cs.room_id = r.id
JOIN semesters sem ON cs.semester_id = sem.id
JOIN users u ON u.department_id = s.department_id AND u.role = 'student'
WHERE cs.is_active = TRUE AND sem.is_current = TRUE;

-- Faculty Timetable View
CREATE VIEW faculty_timetable AS
SELECT 
    cs.id,
    cs.faculty_id,
    CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
    s.name as subject_name,
    s.code as subject_code,
    r.room_number,
    r.room_name,
    cs.day_of_week,
    cs.start_time,
    cs.end_time,
    cs.class_type
FROM class_schedule cs
JOIN subjects s ON cs.subject_id = s.id
JOIN users f ON cs.faculty_id = f.id
LEFT JOIN rooms r ON cs.room_id = r.id
JOIN semesters sem ON cs.semester_id = sem.id
WHERE cs.is_active = TRUE AND sem.is_current = TRUE;

-- Active Orders View
CREATE VIEW active_canteen_orders AS
SELECT 
    co.id,
    co.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    co.order_date,
    co.total_amount,
    co.payment_status,
    co.order_status,
    co.qr_code_data,
    co.pickup_time,
    GROUP_CONCAT(CONCAT(cmi.name, ' (', coi.quantity, ')') SEPARATOR ', ') as items
FROM canteen_orders co
JOIN users u ON co.user_id = u.id
JOIN canteen_order_items coi ON co.id = coi.order_id
JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
WHERE co.order_status IN ('placed', 'confirmed', 'preparing', 'ready')
GROUP BY co.id;

-- Room Availability View
CREATE VIEW room_availability AS
SELECT 
    r.id,
    r.room_number,
    r.room_name,
    r.building,
    r.capacity,
    r.room_type,
    r.is_available,
    CASE 
        WHEN rb.id IS NOT NULL THEN 'Booked'
        WHEN cs.id IS NOT NULL THEN 'Class Scheduled'
        ELSE 'Available'
    END as current_status
FROM rooms r
LEFT JOIN room_bookings rb ON r.id = rb.room_id 
    AND rb.booking_date = CURDATE() 
    AND CURTIME() BETWEEN rb.start_time AND rb.end_time
    AND rb.status = 'confirmed'
LEFT JOIN class_schedule cs ON r.id = cs.room_id 
    AND DAYNAME(CURDATE()) = cs.day_of_week
    AND CURTIME() BETWEEN cs.start_time AND cs.end_time
    AND cs.is_active = TRUE;

-- ==========================================
-- 12. COMPLETION MESSAGE
-- ==========================================

SELECT 'Campus Connect Database Setup Complete!' as status,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM canteen_menu_items) as menu_items,
       (SELECT COUNT(*) FROM canteen_orders) as total_orders,
       (SELECT COUNT(*) FROM room_bookings) as room_bookings,
       (SELECT COUNT(*) FROM notifications) as notifications,
       'Database is ready for use!' as message;
