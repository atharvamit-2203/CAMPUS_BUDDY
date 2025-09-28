-- Part 4: Faculty and Messaging Tables
-- Run this after Part 3

-- Faculty announcements
CREATE TABLE faculty_announcements (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type announcement_type DEFAULT 'general',
    target_audience TEXT[], -- ['all', 'students', 'faculty', 'specific_course', 'specific_semester']
    target_colleges INTEGER[], -- Array of college IDs, NULL means all colleges
    target_courses TEXT[], -- Specific courses if applicable
    target_semesters semester_enum[], -- Specific semesters if applicable
    is_urgent BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student interests in faculty announcements
CREATE TABLE announcement_interests (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES faculty_announcements(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interest_level VARCHAR(20) DEFAULT 'interested', -- 'very_interested', 'interested', 'maybe'
    message TEXT, -- Optional message from student
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, student_id)
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User connections/networking
CREATE TABLE user_connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);
