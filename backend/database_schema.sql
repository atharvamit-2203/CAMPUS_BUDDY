-- Campus Connect Database Schema
-- PostgreSQL Database Setup Script
-- Created: September 7, 2025

-- Drop existing tables if they exist (in reverse dependency order)
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
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'organization');
CREATE TYPE event_type AS ENUM ('workshop', 'seminar', 'competition', 'social');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'pending');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (students, faculty, organizations)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    course VARCHAR(255),
    batch VARCHAR(20),
    department VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    member_count INTEGER DEFAULT 0,
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
    max_capacity INTEGER,
    current_registrations INTEGER DEFAULT 0,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- User interests junction table
CREATE TABLE user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    CHECK (requester_id != recipient_id),
    UNIQUE(requester_id, recipient_id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
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

-- Event indexes
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_club ON events(club_id);

-- Club indexes
CREATE INDEX idx_clubs_category ON clubs(category);
CREATE INDEX idx_clubs_active ON clubs(is_active);

-- Junction table indexes
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);

-- Connection indexes
CREATE INDEX idx_connections_requester ON user_connections(requester_id);
CREATE INDEX idx_connections_recipient ON user_connections(recipient_id);
CREATE INDEX idx_connections_status ON user_connections(status);

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
('JavaScript', 'Programming', 'Modern JavaScript programming language'),
('React', 'Frontend', 'Popular JavaScript library for building user interfaces'),
('Python', 'Programming', 'Versatile programming language for various applications'),
('Machine Learning', 'AI/ML', 'Artificial intelligence and machine learning techniques'),
('Node.js', 'Backend', 'JavaScript runtime for server-side development'),
('TypeScript', 'Programming', 'Typed superset of JavaScript'),
('Java', 'Programming', 'Object-oriented programming language'),
('SQL', 'Database', 'Structured Query Language for database management'),
('HTML/CSS', 'Frontend', 'Markup and styling languages for web development'),
('Git', 'Tools', 'Version control system for code management'),
('Docker', 'DevOps', 'Containerization platform'),
('AWS', 'Cloud', 'Amazon Web Services cloud platform'),
('UI/UX Design', 'Design', 'User interface and experience design'),
('Data Analysis', 'Analytics', 'Statistical analysis and data interpretation'),
('Mobile Development', 'Development', 'iOS and Android app development'),
('Blockchain', 'Technology', 'Distributed ledger technology'),
('Cybersecurity', 'Security', 'Information security and protection'),
('Project Management', 'Management', 'Planning and managing projects'),
('Digital Marketing', 'Marketing', 'Online marketing strategies'),
('Public Speaking', 'Soft Skills', 'Presentation and communication skills');

-- Insert sample interests
INSERT INTO interests (name, category, description) VALUES
('Web Development', 'Technology', 'Creating websites and web applications'),
('Artificial Intelligence', 'Technology', 'AI and machine learning research'),
('Entrepreneurship', 'Business', 'Starting and running businesses'),
('Blockchain Technology', 'Technology', 'Distributed ledger and cryptocurrency'),
('UI/UX Design', 'Design', 'User interface and experience design'),
('Data Science', 'Analytics', 'Data analysis and statistical modeling'),
('Mobile App Development', 'Technology', 'iOS and Android development'),
('Cybersecurity', 'Technology', 'Information security and ethical hacking'),
('Cloud Computing', 'Technology', 'AWS, Azure, and cloud platforms'),
('Game Development', 'Technology', 'Video game design and development'),
('Robotics', 'Technology', 'Robotic systems and automation'),
('Digital Marketing', 'Marketing', 'Online marketing and social media'),
('Photography', 'Creative', 'Digital and film photography'),
('Music Production', 'Creative', 'Audio engineering and music creation'),
('Environmental Science', 'Science', 'Environmental research and sustainability'),
('Sports Analytics', 'Analytics', 'Statistical analysis in sports'),
('Financial Technology', 'Finance', 'Fintech and digital banking'),
('Social Innovation', 'Social', 'Technology for social good'),
('Virtual Reality', 'Technology', 'VR and immersive technologies'),
('Sustainable Technology', 'Technology', 'Green technology and sustainability');

-- Insert sample users
INSERT INTO users (email, password_hash, full_name, role, course, batch, department, bio) VALUES
('alex.johnson@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Alex Johnson', 'student', 'Computer Science Engineering', 'Class of 2025', 'Computer Science', 'Passionate about AI and web development. Love building innovative solutions.'),
('sarah.chen@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Sarah Chen', 'student', 'Data Science', 'Class of 2025', 'Computer Science', 'Data enthusiast with a focus on machine learning and analytics.'),
('mike.rodriguez@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Mike Rodriguez', 'student', 'Computer Science', 'Class of 2026', 'Computer Science', 'Full-stack developer interested in modern web technologies.'),
('emily.watson@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Emily Watson', 'student', 'Business Administration', 'Class of 2025', 'Business', 'Aspiring entrepreneur with a passion for technology startups.'),
('david.kim@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'David Kim', 'student', 'Information Technology', 'Class of 2026', 'IT', 'Blockchain enthusiast and cryptocurrency researcher.'),
('lisa.zhang@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Lisa Zhang', 'student', 'Design', 'Class of 2025', 'Design', 'Creative technologist focusing on UI/UX and digital experiences.'),
('james.wilson@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'James Wilson', 'student', 'Computer Engineering', 'Class of 2024', 'Engineering', 'AI researcher working on robotics and computer vision.'),
('dr.smith@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Robert Smith', 'faculty', NULL, NULL, 'Computer Science', 'Professor of Computer Science specializing in AI and Machine Learning.'),
('startup.incubator@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'University Startup Incubator', 'organization', NULL, NULL, 'Innovation', 'Supporting student entrepreneurs and startup initiatives.'),
('tech.society@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Technology Society', 'organization', NULL, NULL, 'Technology', 'Promoting technology education and innovation on campus.');

-- Insert sample clubs
INSERT INTO clubs (name, description, category, created_by, member_count) VALUES
('AI & Machine Learning Society', 'A community for students interested in artificial intelligence, machine learning, and data science. We organize workshops, guest lectures, and hackathons.', 'Technology', 8, 248),
('Web Development Club', 'Learn modern web development technologies including React, Node.js, and full-stack development. Build real-world projects and collaborate with peers.', 'Technology', 8, 156),
('Entrepreneurship Cell', 'Supporting student entrepreneurs with mentorship, funding opportunities, and startup incubation. Connect with like-minded innovators.', 'Business', 9, 189),
('Blockchain Technology Group', 'Exploring the future of blockchain, cryptocurrency, and decentralized applications. Research and development community.', 'Technology', 8, 97),
('UI/UX Design Community', 'Creative designers focusing on user experience and interface design. Share portfolios, get feedback, and learn design tools.', 'Design', 8, 134),
('Competitive Programming Club', 'Practice algorithms, data structures, and competitive programming. Participate in coding contests and technical interviews.', 'Technology', 8, 203),
('Data Science Hub', 'Analyze data, build predictive models, and extract insights. Work with real datasets and modern analytics tools.', 'Analytics', 8, 178),
('Cybersecurity Alliance', 'Learn ethical hacking, network security, and information protection. Hands-on cybersecurity training and competitions.', 'Security', 8, 142),
('Mobile Development Group', 'Build iOS and Android applications. Learn native development, React Native, and mobile design patterns.', 'Technology', 8, 119),
('Robotics Society', 'Design and build robots for competitions and research. Combine hardware, software, and AI for innovative solutions.', 'Engineering', 8, 87);

-- Insert sample events
INSERT INTO events (title, description, event_type, event_date, start_time, end_time, location, max_capacity, organized_by, club_id) VALUES
('Advanced React Patterns Workshop', 'Deep dive into advanced React patterns including hooks, context, and performance optimization. Hands-on coding session with real projects.', 'workshop', '2025-09-12', '14:00', '17:00', 'Tech Lab A-201', 50, 8, 2),
('Future of AI: Industry Panel Discussion', 'Leading AI experts from industry discuss the future of artificial intelligence, career opportunities, and emerging trends.', 'seminar', '2025-09-15', '10:00', '12:00', 'Main Auditorium', 200, 8, 1),
('Startup Pitch Competition 2025', 'Student entrepreneurs pitch their startup ideas to investors and mentors. Win funding and incubation opportunities.', 'competition', '2025-09-20', '09:00', '18:00', 'Innovation Hub', 100, 9, 3),
('Blockchain & Web3 Meetup', 'Explore decentralized applications, smart contracts, and the future of web3. Networking session with blockchain developers.', 'social', '2025-09-18', '18:00', '20:00', 'Conference Room B-105', 80, 8, 4),
('UI/UX Design Sprint', 'Collaborative design workshop focusing on user research, prototyping, and usability testing. Work on real client projects.', 'workshop', '2025-09-22', '13:00', '16:00', 'Design Studio', 30, 8, 5),
('Tech Career Fair 2025', 'Meet recruiters from top tech companies. Resume reviews, mock interviews, and networking opportunities.', 'seminar', '2025-09-25', '10:00', '16:00', 'Campus Central Plaza', 500, 8, NULL),
('Cybersecurity CTF Challenge', 'Capture The Flag competition testing cybersecurity skills. Team-based challenges in web security, cryptography, and forensics.', 'competition', '2025-09-28', '15:00', '20:00', 'Security Lab', 60, 8, 8),
('Mobile App Development Bootcamp', 'Three-day intensive bootcamp covering React Native development. Build and deploy a complete mobile application.', 'workshop', '2025-10-01', '09:00', '17:00', 'Mobile Dev Lab', 40, 8, 9);

-- Insert user skills relationships
INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES
-- Alex Johnson (user_id: 1)
(1, 1, 4), -- JavaScript
(1, 2, 4), -- React
(1, 3, 3), -- Python
(1, 4, 3), -- Machine Learning
(1, 5, 3), -- Node.js
(1, 6, 4), -- TypeScript
-- Sarah Chen (user_id: 2)
(2, 3, 5), -- Python
(2, 4, 4), -- Machine Learning
(2, 8, 4), -- SQL
(2, 14, 5), -- Data Analysis
-- Mike Rodriguez (user_id: 3)
(3, 1, 5), -- JavaScript
(3, 2, 4), -- React
(3, 5, 4), -- Node.js
(3, 9, 4), -- HTML/CSS
-- Emily Watson (user_id: 4)
(4, 18, 4), -- Project Management
(4, 19, 3), -- Digital Marketing
(4, 20, 4), -- Public Speaking
-- David Kim (user_id: 5)
(5, 16, 4), -- Blockchain
(5, 1, 3), -- JavaScript
(5, 17, 3), -- Cybersecurity
-- Lisa Zhang (user_id: 6)
(6, 13, 5), -- UI/UX Design
(6, 9, 4), -- HTML/CSS
(6, 2, 3); -- React

-- Insert user interests relationships
INSERT INTO user_interests (user_id, interest_id) VALUES
-- Alex Johnson
(1, 1), -- Web Development
(1, 2), -- Artificial Intelligence
(1, 3), -- Entrepreneurship
(1, 4), -- Blockchain Technology
(1, 5), -- UI/UX Design
-- Sarah Chen
(2, 2), -- Artificial Intelligence
(2, 6), -- Data Science
(2, 16), -- Sports Analytics
-- Mike Rodriguez
(3, 1), -- Web Development
(3, 7), -- Mobile App Development
-- Emily Watson
(4, 3), -- Entrepreneurship
(4, 18), -- Social Innovation
(4, 12), -- Digital Marketing
-- David Kim
(5, 4), -- Blockchain Technology
(5, 17), -- Financial Technology
(5, 8), -- Cybersecurity
-- Lisa Zhang
(6, 5), -- UI/UX Design
(6, 1), -- Web Development
(6, 13), -- Photography
-- James Wilson
(7, 2), -- Artificial Intelligence
(7, 11), -- Robotics
(7, 19); -- Virtual Reality

-- Insert club memberships
INSERT INTO club_memberships (user_id, club_id, role, status) VALUES
(1, 1, 'member', 'active'),
(1, 2, 'member', 'active'),
(1, 3, 'member', 'active'),
(2, 1, 'vice-president', 'active'),
(2, 7, 'member', 'active'),
(3, 2, 'president', 'active'),
(3, 9, 'member', 'active'),
(4, 3, 'secretary', 'active'),
(5, 4, 'president', 'active'),
(6, 5, 'president', 'active'),
(7, 1, 'member', 'active'),
(7, 10, 'member', 'active');

-- Insert event registrations
INSERT INTO event_registrations (user_id, event_id, attendance_status) VALUES
(1, 1, 'registered'),
(1, 2, 'registered'),
(1, 3, 'registered'),
(2, 2, 'attended'),
(2, 7, 'registered'),
(3, 1, 'attended'),
(3, 6, 'registered'),
(4, 3, 'registered'),
(4, 6, 'registered'),
(5, 4, 'registered'),
(6, 5, 'registered'),
(7, 2, 'registered');

-- Insert user connections
INSERT INTO user_connections (requester_id, recipient_id, status, message) VALUES
(1, 2, 'accepted', 'Hi Sarah! I saw your work on the ML project. Would love to connect and collaborate!'),
(1, 3, 'accepted', 'Hey Mike! Fellow developer here. Let''s connect!'),
(2, 7, 'accepted', 'Hi James! Interested in your AI research. Would love to discuss collaboration opportunities.'),
(3, 6, 'pending', 'Hi Lisa! Love your design work. Would like to connect for potential web projects.'),
(4, 1, 'accepted', 'Hi Alex! Saw your startup idea at the pitch event. Very impressive!'),
(5, 1, 'pending', 'Hey Alex! Fellow blockchain enthusiast here. Let''s connect!');

-- Insert sample chat messages
INSERT INTO chat_messages (sender_id, recipient_id, message, is_read) VALUES
(1, 2, 'Hey Sarah! How''s the ML project going?', true),
(2, 1, 'Going great! Just finished the data preprocessing. Want to review the code together?', true),
(1, 2, 'Absolutely! When are you free this week?', false),
(3, 1, 'Alex, check out this new React library I found!', true),
(1, 3, 'Thanks Mike! I''ll take a look at it this weekend.', false);

-- =============================================================================
-- USEFUL VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for user profiles with skills and interests
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.course,
    u.batch,
    u.department,
    u.bio,
    u.avatar_url,
    ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills,
    ARRAY_AGG(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as interests
FROM users u
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.id
WHERE u.is_active = true
GROUP BY u.id, u.full_name, u.email, u.role, u.course, u.batch, u.department, u.bio, u.avatar_url;

-- View for club details with member count
CREATE VIEW club_details AS
SELECT 
    c.*,
    COUNT(cm.user_id) as actual_member_count,
    u.full_name as created_by_name
FROM clubs c
LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.status = 'active'
LEFT JOIN users u ON c.created_by = u.id
WHERE c.is_active = true
GROUP BY c.id, u.full_name;

-- View for upcoming events with registration count
CREATE VIEW upcoming_events AS
SELECT 
    e.*,
    COUNT(er.user_id) as registration_count,
    u.full_name as organizer_name,
    c.name as club_name
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
LEFT JOIN users u ON e.organized_by = u.id
LEFT JOIN clubs c ON e.club_id = c.id
WHERE e.is_active = true AND e.event_date >= CURRENT_DATE
GROUP BY e.id, u.full_name, c.name
ORDER BY e.event_date, e.start_time;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update club member count
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE clubs SET member_count = member_count - 1 WHERE id = NEW.club_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for club member count
CREATE TRIGGER trigger_update_club_member_count
    AFTER INSERT OR UPDATE OR DELETE ON club_memberships
    FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- Function to update event registration count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events SET current_registrations = current_registrations + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events SET current_registrations = current_registrations - 1 WHERE id = OLD.event_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event registration count
CREATE TRIGGER trigger_update_event_registration_count
    AFTER INSERT OR DELETE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_event_registration_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================================================

-- Test queries (commented out for production)
/*
-- Get all users with their skills and interests
SELECT * FROM user_profiles WHERE role = 'student';

-- Get upcoming events with registration details
SELECT * FROM upcoming_events;

-- Get club details with actual member counts
SELECT * FROM club_details ORDER BY actual_member_count DESC;

-- Find students with similar interests to Alex Johnson
SELECT DISTINCT u2.full_name, u2.course, i.name as common_interest
FROM users u1
JOIN user_interests ui1 ON u1.id = ui1.user_id
JOIN interests i ON ui1.interest_id = i.id
JOIN user_interests ui2 ON i.id = ui2.interest_id
JOIN users u2 ON ui2.user_id = u2.id
WHERE u1.full_name = 'Alex Johnson' 
  AND u2.id != u1.id 
  AND u2.role = 'student'
ORDER BY u2.full_name;

-- Get user connections and their status
SELECT 
    u1.full_name as requester,
    u2.full_name as recipient,
    uc.status,
    uc.created_at
FROM user_connections uc
JOIN users u1 ON uc.requester_id = u1.id
JOIN users u2 ON uc.recipient_id = u2.id
ORDER BY uc.created_at DESC;
*/

-- End of schema
COMMIT;
