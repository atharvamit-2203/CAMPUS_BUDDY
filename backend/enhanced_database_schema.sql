-- Enhanced Campus Connect Database Schema
-- PostgreSQL Database Setup Script for Advanced Features
-- Created: September 12, 2025
-- Features: Timetable Management, Room Booking, Canteen Orders, QR Codes, Notifications

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS qr_code_scans CASCADE;
DROP TABLE IF EXISTS canteen_receipts CASCADE;
DROP TABLE IF EXISTS canteen_order_items CASCADE;
DROP TABLE IF EXISTS canteen_orders CASCADE;
DROP TABLE IF EXISTS canteen_menu_items CASCADE;
DROP TABLE IF EXISTS canteen_categories CASCADE;
DROP TABLE IF EXISTS room_bookings CASCADE;
DROP TABLE IF EXISTS extra_classes CASCADE;
DROP TABLE IF EXISTS timetable_changes CASCADE;
DROP TABLE IF EXISTS class_schedule CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS club_memberships CASCADE;
DROP TABLE IF EXISTS user_connections CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'organization', 'admin', 'canteen_staff');
CREATE TYPE event_type AS ENUM ('workshop', 'seminar', 'competition', 'social', 'academic');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE room_type AS ENUM ('classroom', 'lab', 'auditorium', 'conference', 'library');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'wallet', 'pay_later');
CREATE TYPE notification_type AS ENUM ('timetable_change', 'booking_update', 'order_ready', 'payment_due', 'class_cancelled', 'room_available', 'general');
CREATE TYPE class_type AS ENUM ('regular', 'extra', 'makeup', 'tutorial', 'lab');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Enhanced Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    employee_id VARCHAR(50) UNIQUE,
    course VARCHAR(255),
    batch VARCHAR(20),
    semester INTEGER,
    department VARCHAR(255),
    designation VARCHAR(100), -- For faculty
    bio TEXT,
    avatar_url VARCHAR(500),
    phone VARCHAR(15),
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    faculty_id INTEGER REFERENCES users(id),
    department VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    room_name VARCHAR(255),
    room_type room_type NOT NULL,
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER DEFAULT 30,
    facilities TEXT[], -- Array of facilities like 'projector', 'ac', 'computer'
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TIMETABLE AND SCHEDULING TABLES
-- =============================================================================

-- Class Schedule table (Regular timetable)
CREATE TABLE class_schedule (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    faculty_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES rooms(id),
    course VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type class_type DEFAULT 'regular',
    is_active BOOLEAN DEFAULT true,
    academic_year VARCHAR(20) DEFAULT '2024-25',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetable Changes table (Track modifications)
CREATE TABLE timetable_changes (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES class_schedule(id),
    changed_by INTEGER REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL, -- 'reschedule', 'cancel', 'room_change', 'faculty_change'
    old_values JSONB, -- Store old values as JSON
    new_values JSONB, -- Store new values as JSON
    reason TEXT,
    affected_date DATE, -- Specific date if it's a one-time change
    is_permanent BOOLEAN DEFAULT false, -- true for permanent timetable changes
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extra Classes table (Student/Faculty requested classes)
CREATE TABLE extra_classes (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    requested_by INTEGER REFERENCES users(id), -- Can be student or faculty
    faculty_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES rooms(id),
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(255),
    reason TEXT,
    max_students INTEGER DEFAULT 50,
    current_enrolled INTEGER DEFAULT 0,
    booking_status booking_status DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Bookings table (For meetings, events, study groups)
CREATE TABLE room_bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    booked_by INTEGER REFERENCES users(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    expected_attendees INTEGER,
    special_requirements TEXT,
    booking_status booking_status DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    booking_reference VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CANTEEN MANAGEMENT TABLES
-- =============================================================================

-- Canteen Categories table
CREATE TABLE canteen_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Menu Items table
CREATE TABLE canteen_menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES canteen_categories(id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    image_url VARCHAR(500),
    emoji VARCHAR(10),
    is_vegetarian BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 10, -- in minutes
    nutritional_info JSONB, -- calories, protein, etc.
    allergens TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Orders table
CREATE TABLE canteen_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    order_status order_status DEFAULT 'pending',
    special_instructions TEXT,
    estimated_ready_time TIMESTAMP,
    actual_ready_time TIMESTAMP,
    pickup_time TIMESTAMP,
    qr_code_data TEXT, -- QR code content
    qr_code_url VARCHAR(500), -- URL to QR code image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Order Items table
CREATE TABLE canteen_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES canteen_orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES canteen_menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Receipts table (For QR code scanning)
CREATE TABLE canteen_receipts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES canteen_orders(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    is_scanned BOOLEAN DEFAULT false,
    scanned_at TIMESTAMP,
    scanned_by INTEGER REFERENCES users(id), -- Canteen staff who scanned
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR Code Scans table (Track all QR code scans)
CREATE TABLE qr_code_scans (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES canteen_receipts(id),
    order_id INTEGER REFERENCES canteen_orders(id),
    scanned_by INTEGER REFERENCES users(id),
    scan_location VARCHAR(100), -- 'canteen', 'main_gate', etc.
    scan_device VARCHAR(100),
    scan_result VARCHAR(50), -- 'success', 'invalid', 'already_used'
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- NOTIFICATION SYSTEM
-- =============================================================================

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    related_entity_id INTEGER, -- ID of related entity (order, booking, etc.)
    related_entity_type VARCHAR(50), -- 'order', 'booking', 'class', etc.
    is_read BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    action_url VARCHAR(500), -- URL for action button
    action_text VARCHAR(100), -- Text for action button
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- =============================================================================
-- EXISTING TABLES (Enhanced)
-- =============================================================================

-- Skills master table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interests master table
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    logo_url VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    faculty_coordinator INTEGER REFERENCES users(id),
    member_count INTEGER DEFAULT 0,
    meeting_room INTEGER REFERENCES rooms(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(255),
    room_id INTEGER REFERENCES rooms(id),
    max_capacity INTEGER,
    current_registrations INTEGER DEFAULT 0,
    registration_fee DECIMAL(8,2) DEFAULT 0.00,
    organized_by INTEGER REFERENCES users(id),
    club_id INTEGER REFERENCES clubs(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RELATIONSHIP TABLES
-- =============================================================================

-- User skills junction table
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5) DEFAULT 3,
    verified BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- User interests junction table
CREATE TABLE user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 5) DEFAULT 3,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, interest_id)
);

-- Club memberships
CREATE TABLE club_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    status membership_status DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, club_id)
);

-- Event registrations
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status payment_status DEFAULT 'pending',
    attendance_status VARCHAR(20) DEFAULT 'registered',
    UNIQUE(user_id, event_id)
);

-- User connections (networking)
CREATE TABLE user_connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, recipient_id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_course ON users(course);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Timetable indexes
CREATE INDEX idx_class_schedule_day ON class_schedule(day_of_week);
CREATE INDEX idx_class_schedule_time ON class_schedule(start_time, end_time);
CREATE INDEX idx_class_schedule_room ON class_schedule(room_id);
CREATE INDEX idx_class_schedule_faculty ON class_schedule(faculty_id);
CREATE INDEX idx_class_schedule_course ON class_schedule(course, semester);

-- Booking indexes
CREATE INDEX idx_room_bookings_date ON room_bookings(booking_date);
CREATE INDEX idx_room_bookings_room ON room_bookings(room_id);
CREATE INDEX idx_room_bookings_status ON room_bookings(booking_status);
CREATE INDEX idx_extra_classes_date ON extra_classes(class_date);
CREATE INDEX idx_extra_classes_status ON extra_classes(booking_status);

-- Canteen indexes
CREATE INDEX idx_canteen_orders_user ON canteen_orders(user_id);
CREATE INDEX idx_canteen_orders_status ON canteen_orders(order_status);
CREATE INDEX idx_canteen_orders_number ON canteen_orders(order_number);
CREATE INDEX idx_canteen_receipts_qr ON canteen_receipts(qr_code_data);
CREATE INDEX idx_menu_items_category ON canteen_menu_items(category_id);
CREATE INDEX idx_menu_items_available ON canteen_menu_items(is_available);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Room indexes
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_available ON rooms(is_available);
CREATE INDEX idx_rooms_building ON rooms(building);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_class_schedule_timestamp BEFORE UPDATE ON class_schedule FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_room_bookings_timestamp BEFORE UPDATE ON room_bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_extra_classes_timestamp BEFORE UPDATE ON extra_classes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_canteen_orders_timestamp BEFORE UPDATE ON canteen_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_canteen_menu_timestamp BEFORE UPDATE ON canteen_menu_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(NEW.id::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference = 'BKG' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(NEW.id::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.receipt_number = 'RCP' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(NEW.id::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply generation triggers
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON canteen_orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();
CREATE TRIGGER generate_booking_reference_trigger BEFORE INSERT ON room_bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();
CREATE TRIGGER generate_receipt_number_trigger BEFORE INSERT ON canteen_receipts FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- Function to send notifications on timetable changes
CREATE OR REPLACE FUNCTION notify_timetable_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_users CURSOR FOR 
        SELECT DISTINCT u.id 
        FROM users u 
        WHERE u.course = (SELECT course FROM class_schedule WHERE id = NEW.schedule_id)
        AND u.semester = (SELECT semester FROM class_schedule WHERE id = NEW.schedule_id)
        AND u.role = 'student';
    user_record RECORD;
    schedule_info RECORD;
BEGIN
    -- Get schedule information
    SELECT s.subject_name, cs.course, cs.semester, cs.day_of_week, cs.start_time, cs.end_time
    INTO schedule_info
    FROM class_schedule cs
    JOIN subjects s ON cs.subject_id = s.id
    WHERE cs.id = NEW.schedule_id;
    
    -- Insert notifications for affected students
    FOR user_record IN affected_users LOOP
        INSERT INTO notifications (
            user_id, 
            title, 
            message, 
            notification_type, 
            related_entity_id, 
            related_entity_type,
            is_urgent
        ) VALUES (
            user_record.id,
            'Timetable Change Alert',
            'Changes made to ' || schedule_info.subject_name || ' schedule. Reason: ' || COALESCE(NEW.reason, 'Not specified'),
            'timetable_change',
            NEW.schedule_id,
            'class_schedule',
            true
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply notification trigger
CREATE TRIGGER notify_timetable_change_trigger AFTER INSERT ON timetable_changes FOR EACH ROW EXECUTE FUNCTION notify_timetable_change();

-- Function to notify when order is ready
CREATE OR REPLACE FUNCTION notify_order_ready()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_status = 'ready' AND OLD.order_status != 'ready' THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            notification_type,
            related_entity_id,
            related_entity_type,
            is_urgent,
            action_url,
            action_text
        ) VALUES (
            NEW.user_id,
            'Order Ready for Pickup!',
            'Your order #' || NEW.order_number || ' is ready for pickup at the canteen.',
            'order_ready',
            NEW.id,
            'canteen_order',
            true,
            '/canteen/orders/' || NEW.id,
            'View Order'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply order notification trigger
CREATE TRIGGER notify_order_ready_trigger AFTER UPDATE ON canteen_orders FOR EACH ROW EXECUTE FUNCTION notify_order_ready();

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert canteen categories
INSERT INTO canteen_categories (category_name, description, display_order) VALUES
('Breakfast', 'Morning meals and beverages', 1),
('Lunch', 'Main course meals', 2),
('Snacks', 'Light bites and finger foods', 3),
('Beverages', 'Drinks and refreshments', 4),
('Desserts', 'Sweet treats and desserts', 5),
('Healthy Options', 'Nutritious and diet-friendly options', 6);

-- Insert sample rooms
INSERT INTO rooms (room_number, room_name, room_type, building, floor, capacity, facilities) VALUES
('A101', 'Computer Lab 1', 'lab', 'Academic Block A', 1, 40, ARRAY['computers', 'projector', 'ac', 'whiteboard']),
('A201', 'Lecture Hall 1', 'classroom', 'Academic Block A', 2, 60, ARRAY['projector', 'ac', 'whiteboard', 'speakers']),
('B301', 'Conference Room', 'conference', 'Academic Block B', 3, 20, ARRAY['projector', 'ac', 'round_table', 'video_conf']),
('C101', 'Auditorium', 'auditorium', 'Central Block', 1, 300, ARRAY['stage', 'sound_system', 'lighting', 'ac']),
('L201', 'Library Study Room 1', 'library', 'Library Block', 2, 15, ARRAY['quiet_zone', 'ac', 'whiteboard']);

-- Insert sample courses
INSERT INTO courses (course_code, course_name, department, semester, credits) VALUES
('CSE', 'Computer Science Engineering', 'Computer Science', 1, 180),
('ECE', 'Electronics and Communication', 'Electronics', 1, 180),
('ME', 'Mechanical Engineering', 'Mechanical', 1, 180),
('CE', 'Civil Engineering', 'Civil', 1, 180);

-- Insert sample users
INSERT INTO users (email, password_hash, full_name, role, student_id, course, batch, semester, department, phone, wallet_balance) VALUES
('john.doe@student.com', '$2b$12$example_hash', 'John Doe', 'student', 'CSE2024001', 'CSE', '2024-28', 3, 'Computer Science', '9876543210', 500.00),
('jane.smith@student.com', '$2b$12$example_hash', 'Jane Smith', 'student', 'ECE2024001', 'ECE', '2024-28', 3, 'Electronics', '9876543211', 300.00),
('prof.kumar@faculty.com', '$2b$12$example_hash', 'Dr. Rajesh Kumar', 'faculty', NULL, NULL, NULL, NULL, 'Computer Science', '9876543212', 0.00),
('canteen.staff@college.com', '$2b$12$example_hash', 'Ramesh Canteen', 'canteen_staff', NULL, NULL, NULL, NULL, 'Administration', '9876543213', 0.00);

-- Update employee_id for faculty
UPDATE users SET employee_id = 'FAC001' WHERE email = 'prof.kumar@faculty.com';
UPDATE users SET employee_id = 'CAN001' WHERE email = 'canteen.staff@college.com';

-- Insert sample subjects
INSERT INTO subjects (subject_code, subject_name, course_id, faculty_id, department, semester, credits) VALUES
('CSE301', 'Data Structures and Algorithms', 1, 3, 'Computer Science', 3, 4),
('CSE302', 'Database Management Systems', 1, 3, 'Computer Science', 3, 4),
('CSE303', 'Computer Networks', 1, 3, 'Computer Science', 3, 3);

-- Insert sample class schedule
INSERT INTO class_schedule (subject_id, faculty_id, room_id, course, semester, day_of_week, start_time, end_time, class_type) VALUES
(1, 3, 1, 'CSE', 3, 1, '09:00', '10:00', 'regular'), -- Monday DSA
(2, 3, 2, 'CSE', 3, 2, '10:00', '11:00', 'regular'), -- Tuesday DBMS
(3, 3, 1, 'CSE', 3, 3, '11:00', '12:00', 'regular'); -- Wednesday Networks

-- Insert sample menu items
INSERT INTO canteen_menu_items (category_id, item_name, description, price, emoji, is_vegetarian, preparation_time) VALUES
(1, 'Masala Dosa', 'Crispy dosa with spiced potato filling', 45.00, '🥞', true, 15),
(1, 'Idli Sambar', 'Steamed rice cakes with sambar and chutney', 35.00, '🍘', true, 10),
(2, 'Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 120.00, '🍛', false, 25),
(2, 'Paneer Butter Masala', 'Creamy paneer curry with rice/roti', 95.00, '🍛', true, 20),
(3, 'Samosa', 'Crispy pastry with spiced potato filling', 15.00, '🥟', true, 5),
(3, 'Vada Pav', 'Mumbai street food with potato vada', 25.00, '🍔', true, 8),
(4, 'Masala Chai', 'Spiced Indian tea', 10.00, '☕', true, 3),
(4, 'Fresh Lime Soda', 'Refreshing lime drink', 20.00, '🥤', true, 2),
(5, 'Gulab Jamun', 'Sweet milk dumplings in syrup', 30.00, '🍰', true, 0),
(6, 'Green Salad', 'Fresh mixed vegetables', 40.00, '🥗', true, 5);

-- Insert sample skills and interests
INSERT INTO skills (name, category, description) VALUES
('JavaScript', 'Programming', 'Modern JavaScript programming language'),
('Python', 'Programming', 'Versatile programming language'),
('Public Speaking', 'Communication', 'Ability to speak confidently in public'),
('Project Management', 'Management', 'Planning and executing projects');

INSERT INTO interests (name, category, description) VALUES
('Artificial Intelligence', 'Technology', 'Machine learning and AI systems'),
('Photography', 'Creative', 'Digital and film photography'),
('Cricket', 'Sports', 'Playing and watching cricket'),
('Music', 'Arts', 'Playing instruments and listening to music');

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for current day's schedule
CREATE VIEW today_schedule AS
SELECT 
    cs.id,
    s.subject_name,
    u.full_name as faculty_name,
    r.room_number,
    cs.course,
    cs.semester,
    cs.start_time,
    cs.end_time,
    cs.class_type
FROM class_schedule cs
JOIN subjects s ON cs.subject_id = s.id
JOIN users u ON cs.faculty_id = u.id
JOIN rooms r ON cs.room_id = r.id
WHERE cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE) + 1
AND cs.is_active = true
ORDER BY cs.start_time;

-- View for pending orders
CREATE VIEW pending_orders AS
SELECT 
    co.id,
    co.order_number,
    u.full_name as customer_name,
    co.total_amount,
    co.order_status,
    co.estimated_ready_time,
    co.created_at
FROM canteen_orders co
JOIN users u ON co.user_id = u.id
WHERE co.order_status IN ('pending', 'confirmed', 'preparing')
ORDER BY co.created_at;

-- View for available rooms
CREATE VIEW available_rooms_now AS
SELECT 
    r.id,
    r.room_number,
    r.room_name,
    r.room_type,
    r.capacity,
    r.facilities
FROM rooms r
WHERE r.is_available = true
AND r.id NOT IN (
    SELECT cs.room_id 
    FROM class_schedule cs 
    WHERE cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE) + 1
    AND CURRENT_TIME BETWEEN cs.start_time AND cs.end_time
    AND cs.is_active = true
);

-- View for user notifications
CREATE VIEW user_notifications AS
SELECT 
    n.id,
    n.title,
    n.message,
    n.notification_type,
    n.is_read,
    n.is_urgent,
    n.action_url,
    n.action_text,
    n.created_at
FROM notifications n
WHERE n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP
ORDER BY n.is_urgent DESC, n.created_at DESC;

-- =============================================================================
-- SECURITY AND PERMISSIONS
-- =============================================================================

-- Create roles (commented out for development)
-- CREATE ROLE student_role;
-- CREATE ROLE faculty_role;
-- CREATE ROLE admin_role;
-- CREATE ROLE canteen_staff_role;

-- Grant appropriate permissions (commented out for development)
-- GRANT SELECT, INSERT, UPDATE ON canteen_orders, canteen_order_items TO student_role;
-- GRANT SELECT ON canteen_menu_items, canteen_categories TO student_role;
-- GRANT ALL ON class_schedule, timetable_changes TO faculty_role;
-- GRANT ALL ON ALL TABLES TO admin_role;

COMMIT;

-- Success message
SELECT 'Enhanced Campus Connect Database Schema Created Successfully!' as status;
