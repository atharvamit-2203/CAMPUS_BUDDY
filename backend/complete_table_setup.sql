-- Complete Campus Connect Database Setup with Enhanced Tables
-- This script creates all tables with proper relationships and ensures
-- proper linking between students, faculty, classes, subjects, batches, and organizations

-- Drop and recreate database
DROP DATABASE IF EXISTS campus_connect;
CREATE DATABASE campus_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_connect;

-- ==========================================
-- 1. FOUNDATION TABLES
-- ==========================================

-- Universities Table
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

-- Academic Years Table
CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year VARCHAR(10) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Colleges Table
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

-- Departments Table
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

-- Courses Table
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

-- Batches Table (NEW - for grouping students)
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    batch_name VARCHAR(50) NOT NULL,
    academic_year_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    current_semester INT DEFAULT 1,
    max_students INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_batch_year (course_id, batch_name, academic_year_id)
);

-- Subjects Table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    credits INT DEFAULT 0,
    department_id INT,
    semester INT,
    year INT,
    course_id INT,
    subject_type ENUM('core', 'elective', 'optional') DEFAULT 'core',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Rooms Table
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

-- Semesters Table
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
-- 2. USERS AND DETAILS TABLES
-- ==========================================

-- Users Table (Enhanced with proper relationships)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
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

-- Student Details Table (Enhanced with batch relationship)
CREATE TABLE student_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    course_id INT,
    batch_id INT,
    current_semester INT DEFAULT 1,
    current_year INT DEFAULT 1,
    admission_date DATE,
    graduation_date DATE,
    cgpa DECIMAL(3,2) DEFAULT 0.00,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

-- Faculty Details Table
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

-- Organization Details Table (Enhanced for club login)
CREATE TABLE organization_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type ENUM('technical', 'cultural', 'sports', 'academic', 'social', 'other') DEFAULT 'other',
    founded_date DATE,
    faculty_advisor_id INT,
    description TEXT,
    website VARCHAR(255),
    registration_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_advisor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. CLASS AND SCHEDULING TABLES
-- ==========================================

-- Class Schedule Table (Enhanced with batch relationship)
CREATE TABLE class_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    batch_id INT NOT NULL,
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
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Faculty Subject Assignment (Many-to-Many relationship)
CREATE TABLE faculty_subject_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    batch_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_subject_batch (faculty_id, subject_id, batch_id, academic_year_id)
);

-- Student Batch Enrollment (Many-to-Many relationship for handling transfers)
CREATE TABLE student_batch_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    batch_id INT NOT NULL,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. AI FEATURES TABLES
-- ==========================================

-- Class Cancellations Table
CREATE TABLE class_cancellations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_schedule_id INT NOT NULL,
    cancelled_by INT NOT NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE,
    rescheduled_to INT NULL,
    FOREIGN KEY (class_schedule_id) REFERENCES class_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rescheduled_to) REFERENCES class_schedule(id) ON DELETE SET NULL
);

-- Enhanced Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('class_cancelled', 'venue_change', 'quiz_alert', 'deadline', 'booking_confirmed', 'general') DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    scheduled_for TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lost and Found Table
CREATE TABLE lost_found (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('lost', 'found') NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    location_found VARCHAR(255),
    image_url VARCHAR(500),
    contact_info VARCHAR(255),
    status ENUM('active', 'resolved', 'expired') DEFAULT 'active',
    category VARCHAR(100),
    date_lost_found DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Equipment Table
CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    total_quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment Bookings
CREATE TABLE equipment_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    quantity_requested INT DEFAULT 1,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 5. CANTEEN TABLES
-- ==========================================

-- Canteen Menu Items Table
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

-- Canteen Orders Table
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

-- Canteen Order Items Table
CREATE TABLE canteen_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES canteen_menu_items(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. EVENT AND BOOKING TABLES
-- ==========================================

-- Events Table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255),
    organizer_id INT,
    organization_id INT,
    category VARCHAR(100),
    max_participants INT,
    registration_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Room Bookings Table
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

-- ==========================================
-- 7. INDEXES FOR PERFORMANCE
-- ==========================================

-- Performance indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_college_dept ON users(college_id, department_id);
CREATE INDEX idx_students_batch ON student_details(batch_id);
CREATE INDEX idx_class_schedule_batch_day ON class_schedule(batch_id, day_of_week);
CREATE INDEX idx_class_schedule_faculty ON class_schedule(faculty_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_lost_found_status ON lost_found(status, type);
CREATE INDEX idx_equipment_bookings_date ON equipment_bookings(booking_date);
CREATE INDEX idx_room_bookings_date_time ON room_bookings(booking_date, start_time, end_time);
CREATE INDEX idx_canteen_orders_user_date ON canteen_orders(user_id, order_date);

-- ==========================================
-- 8. SAMPLE DATA INSERTION
-- ==========================================

-- Insert Universities
INSERT INTO universities (name, city, state, country, contact_email, contact_phone) VALUES
('MPSTME University', 'Mumbai', 'Maharashtra', 'India', 'info@mpstme.edu', '+91-22-2659-3434');

-- Insert Academic Years
INSERT INTO academic_years (year, start_date, end_date, is_current) VALUES
('2024-25', '2024-07-01', '2025-06-30', TRUE),
('2023-24', '2023-07-01', '2024-06-30', FALSE);

-- Insert Colleges
INSERT INTO colleges (university_id, name, code, dean_name, contact_email) VALUES
(1, 'School of Engineering and Technology', 'SET', 'Dr. John Smith', 'dean.set@mpstme.edu'),
(1, 'School of Business Management', 'SBM', 'Dr. Jane Doe', 'dean.sbm@mpstme.edu');

-- Insert Departments
INSERT INTO departments (college_id, name, code, head_name, department_type) VALUES
(1, 'Computer Science and Engineering', 'CSE', 'Dr. Alice Johnson', 'Engineering'),
(1, 'Information Technology', 'IT', 'Dr. Bob Wilson', 'Engineering'),
(2, 'Business Administration', 'BBA', 'Dr. Carol Brown', 'Business');

-- Insert Courses
INSERT INTO courses (department_id, name, code, credits, duration_years, course_type) VALUES
(1, 'Bachelor of Technology in Computer Science', 'BTECHCSE', 160, 4, 'undergraduate'),
(2, 'Bachelor of Technology in Information Technology', 'BTECHIT', 160, 4, 'undergraduate'),
(3, 'Bachelor of Business Administration', 'BBA', 120, 3, 'undergraduate');

-- Insert Batches
INSERT INTO batches (course_id, batch_name, academic_year_id, start_date, current_semester, max_students) VALUES
(1, 'CSE-A', 1, '2024-07-01', 3, 60),
(1, 'CSE-B', 1, '2024-07-01', 3, 60),
(2, 'IT-A', 1, '2024-07-01', 3, 60),
(3, 'BBA-A', 1, '2024-07-01', 3, 50);

-- Insert Subjects
INSERT INTO subjects (name, code, credits, department_id, semester, year, course_id, subject_type) VALUES
('Data Structures and Algorithms', 'CSE301', 4, 1, 3, 2, 1, 'core'),
('Database Management Systems', 'CSE302', 4, 1, 3, 2, 1, 'core'),
('Operating Systems', 'CSE303', 4, 1, 3, 2, 1, 'core'),
('Computer Networks', 'IT301', 4, 2, 3, 2, 2, 'core'),
('Web Technologies', 'IT302', 3, 2, 3, 2, 2, 'core'),
('Business Statistics', 'BBA301', 3, 3, 3, 2, 3, 'core');

-- Insert Rooms
INSERT INTO rooms (room_number, room_name, building, floor, capacity, room_type) VALUES
('A101', 'Computer Lab 1', 'Block A', 1, 40, 'laboratory'),
('A102', 'Lecture Hall 1', 'Block A', 1, 60, 'classroom'),
('A201', 'Lecture Hall 2', 'Block A', 2, 80, 'classroom'),
('B101', 'Seminar Room 1', 'Block B', 1, 30, 'meeting'),
('B201', 'Auditorium', 'Block B', 2, 200, 'auditorium');

-- Insert Semesters
INSERT INTO semesters (academic_year_id, semester_number, name, start_date, end_date, is_current) VALUES
(1, 1, 'Semester 1', '2024-07-01', '2024-11-30', FALSE),
(1, 2, 'Semester 2', '2024-12-01', '2025-04-30', FALSE),
(1, 3, 'Semester 3', '2025-05-01', '2025-06-30', TRUE);

-- Insert Sample Users (Faculty)
INSERT INTO users (email, password_hash, first_name, last_name, role, university_id, college_id, department_id, phone) VALUES
('prof.smith@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'John', 'Smith', 'faculty', 1, 1, 1, '+91-98765-43210'),
('prof.johnson@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Alice', 'Johnson', 'faculty', 1, 1, 1, '+91-98765-43211'),
('prof.wilson@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Bob', 'Wilson', 'faculty', 1, 1, 2, '+91-98765-43212');

-- Insert Faculty Details
INSERT INTO faculty_details (user_id, employee_id, designation, hire_date, office_location) VALUES
(1, 'FAC001', 'Professor', '2020-07-01', 'A-301'),
(2, 'FAC002', 'Associate Professor', '2021-07-01', 'A-302'),
(3, 'FAC003', 'Assistant Professor', '2022-07-01', 'A-303');

-- Insert Sample Students
INSERT INTO users (email, password_hash, first_name, last_name, role, university_id, college_id, department_id, phone) VALUES
('student1@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Rahul', 'Sharma', 'student', 1, 1, 1, '+91-98765-00001'),
('student2@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Priya', 'Patel', 'student', 1, 1, 1, '+91-98765-00002'),
('student3@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Amit', 'Kumar', 'student', 1, 1, 2, '+91-98765-00003');

-- Insert Student Details
INSERT INTO student_details (user_id, student_id, course_id, batch_id, current_semester, admission_date, cgpa) VALUES
(4, 'CSE2024001', 1, 1, 3, '2024-07-01', 8.5),
(5, 'CSE2024002', 1, 1, 3, '2024-07-01', 9.0),
(6, 'IT2024001', 2, 3, 3, '2024-07-01', 8.2);

-- Insert Student Batch Enrollments
INSERT INTO student_batch_enrollments (student_id, batch_id, enrollment_date) VALUES
(4, 1, '2024-07-01'),
(5, 1, '2024-07-01'),
(6, 3, '2024-07-01');

-- Insert Sample Organizations
INSERT INTO users (email, password_hash, first_name, last_name, role, university_id, college_id, department_id) VALUES
('techclub@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Tech', 'Club', 'organization', 1, 1, 1),
('culturalclub@mpstme.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQr2ZONCSBzECN2', 'Cultural', 'Society', 'organization', 1, 1, 1);

-- Insert Organization Details
INSERT INTO organization_details (user_id, organization_name, organization_type, faculty_advisor_id, founded_date, is_verified) VALUES
(7, 'Technical Club MPSTME', 'technical', 1, '2020-01-15', TRUE),
(8, 'Cultural Society MPSTME', 'cultural', 2, '2020-02-20', TRUE);

-- Insert Faculty Subject Assignments
INSERT INTO faculty_subject_assignments (faculty_id, subject_id, batch_id, academic_year_id) VALUES
(1, 1, 1, 1), -- Prof Smith teaches DSA to CSE-A
(2, 2, 1, 1), -- Prof Johnson teaches DBMS to CSE-A
(3, 4, 3, 1); -- Prof Wilson teaches Computer Networks to IT-A

-- Insert Class Schedule
INSERT INTO class_schedule (subject_id, faculty_id, batch_id, room_id, semester_id, day_of_week, start_time, end_time, class_type) VALUES
(1, 1, 1, 2, 3, 'monday', '09:00:00', '10:30:00', 'lecture'),
(2, 2, 1, 2, 3, 'tuesday', '10:45:00', '12:15:00', 'lecture'),
(1, 1, 1, 1, 3, 'wednesday', '14:00:00', '17:00:00', 'practical'),
(4, 3, 3, 2, 3, 'thursday', '09:00:00', '10:30:00', 'lecture');

-- Insert Canteen Menu Items
INSERT INTO canteen_menu_items (name, description, category, price, dietary_info) VALUES
('Vegetable Biryani', 'Aromatic rice dish with mixed vegetables', 'main_course', 120.00, 'vegetarian'),
('Chicken Curry', 'Spicy chicken curry with rice', 'main_course', 150.00, 'non_vegetarian'),
('Samosa', 'Crispy fried pastry with potato filling', 'snacks', 20.00, 'vegetarian'),
('Tea', 'Hot Indian tea', 'beverages', 15.00, 'vegetarian'),
('Coffee', 'Fresh brewed coffee', 'beverages', 25.00, 'vegetarian'),
('Gulab Jamun', 'Sweet milk dumplings in syrup', 'desserts', 30.00, 'vegetarian');

-- Insert Equipment
INSERT INTO equipment (name, description, category, total_quantity, available_quantity, location, requires_approval) VALUES
('Projector', 'HD Projector for presentations', 'AV Equipment', 10, 8, 'AV Store Room', TRUE),
('Laptop', 'Dell Laptop for student use', 'Computing', 20, 15, 'IT Department', TRUE),
('Microphone', 'Wireless microphone', 'AV Equipment', 15, 12, 'AV Store Room', FALSE),
('Camera', 'DSLR Camera for photography', 'Media', 5, 4, 'Media Lab', TRUE);

COMMIT;
