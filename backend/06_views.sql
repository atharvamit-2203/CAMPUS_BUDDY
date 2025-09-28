-- Part 6: Views for Easy Data Access
-- Run this after Part 5

-- View for student profiles with college info
CREATE VIEW student_profiles AS
SELECT 
    u.id, u.username, u.email, u.full_name, u.student_id, u.course, u.branch, 
    u.semester, u.academic_year, u.batch, u.cgpa, u.bio, u.skills, u.interests,
    c.name as college_name, c.code as college_code, c.city as college_city,
    u.created_at, u.is_active
FROM users u
LEFT JOIN colleges c ON u.college_id = c.id
WHERE u.role = 'student';

-- View for faculty profiles with college info
CREATE VIEW faculty_profiles AS
SELECT 
    u.id, u.username, u.email, u.full_name, u.employee_id, u.designation, 
    u.department, u.specialization, u.experience_years, u.research_interests, u.bio,
    c.name as college_name, c.code as college_code, c.city as college_city,
    u.created_at, u.is_active
FROM users u
LEFT JOIN colleges c ON u.college_id = c.id
WHERE u.role = 'faculty';

-- View for club details with creator info
CREATE VIEW club_details AS
SELECT 
    cl.id, cl.name, cl.description, cl.category, cl.member_count, cl.is_active,
    cl.created_at, cl.updated_at,
    u.full_name as creator_name, u.username as creator_username,
    c.name as college_name, c.code as college_code
FROM clubs cl
LEFT JOIN users u ON cl.created_by = u.id
LEFT JOIN colleges c ON cl.college_id = c.id;

-- View for event details with organizer info
CREATE VIEW event_details AS
SELECT 
    e.id, e.title, e.description, e.event_type, e.start_date, e.end_date, 
    e.location, e.max_participants, e.registration_deadline, e.is_public,
    u.full_name as organizer_name, u.username as organizer_username,
    c.name as college_name, c.code as college_code,
    COUNT(er.id) as registered_count
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
LEFT JOIN colleges c ON e.college_id = c.id
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, u.full_name, u.username, c.name, c.code;

-- View for pending club join requests
CREATE VIEW pending_club_requests AS
SELECT 
    cjr.id, cjr.message, cjr.created_at,
    cl.name as club_name, cl.id as club_id,
    u.full_name as student_name, u.username as student_username, u.id as student_id,
    c.name as college_name
FROM club_join_requests cjr
JOIN clubs cl ON cjr.club_id = cl.id
JOIN users u ON cjr.user_id = u.id
LEFT JOIN colleges c ON u.college_id = c.id
WHERE cjr.status = 'pending';

-- View for faculty announcements with faculty info
CREATE VIEW announcement_details AS
SELECT 
    fa.id, fa.title, fa.content, fa.announcement_type, fa.target_audience,
    fa.target_colleges, fa.target_courses, fa.target_semesters, fa.is_urgent,
    fa.expires_at, fa.created_at, fa.updated_at,
    u.full_name as faculty_name, u.designation as faculty_designation,
    c.name as college_name, c.code as college_code,
    COUNT(ai.id) as interest_count
FROM faculty_announcements fa
JOIN users u ON fa.faculty_id = u.id
LEFT JOIN colleges c ON u.college_id = c.id
LEFT JOIN announcement_interests ai ON fa.id = ai.announcement_id
GROUP BY fa.id, u.full_name, u.designation, c.name, c.code;
