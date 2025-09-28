-- Part 8B: Student Users Data (Part 2)
-- Run this after Part 8A

INSERT INTO users (email, password_hash, full_name, role, college_id, course, batch, department, bio, username, cgpa, student_id, semester, employee_id, designation, specialization) VALUES
-- KJSCE Students
('siddhant.jain@kjsce.somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Siddhant Jain', 'student', 6, 'Computer Engineering', 'Class of 2026', 'Computer Science', 'Game developer and AR/VR enthusiast. Working on immersive experiences for educational applications.', 'siddhant_jain26', 8.4, 'KJSCE2023001', 'Fourth', NULL, NULL, NULL),
('tanvi.kulkarni@kjsce.somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Tanvi Kulkarni', 'student', 6, 'Information Technology', 'Class of 2025', 'IT', 'Data scientist with a focus on predictive analytics and business intelligence. Interested in healthcare technology.', 'tanvi_kulkarni25', 9.2, 'KJSCE2022001', 'Sixth', NULL, NULL, NULL),

-- ACE Students
('arush.pandey@atharvacoe.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Arush Pandey', 'student', 7, 'Computer Science Engineering', 'Class of 2024', 'Computer Science', 'Open source contributor and Linux enthusiast. Working on distributed systems and microservices architecture.', 'arush_pandey24', 8.8, 'ACE2021001', 'Eighth', NULL, NULL, NULL),
('diya.singh@atharvacoe.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Diya Singh', 'student', 7, 'Electronics Engineering', 'Class of 2026', 'Electronics', 'Renewable energy enthusiast working on solar panel optimization and smart grid technologies.', 'diya_singh26', 8.5, 'ACE2023001', 'Fourth', NULL, NULL, NULL),

-- PCE Students
('nisha.desai@pcce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Nisha Desai', 'student', 8, 'Information Technology', 'Class of 2026', 'IT', 'Mobile app developer focusing on Flutter and React Native. UX design enthusiast.', 'nisha_desai26', 8.8, 'PCCE2023001', 'Fourth', NULL, NULL, NULL),

-- RAIT Students
('harsh.jain@rait.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Harsh Jain', 'student', 9, 'Computer Science Engineering', 'Class of 2024', 'Computer Science', 'DevOps engineer and cloud computing specialist. Kubernetes and Docker expert.', 'harsh_jain24', 8.9, 'RAIT2021001', 'Eighth', NULL, NULL, NULL),

-- Universal College Students
('meera.krishnan@universal.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Meera Krishnan', 'student', 10, 'Electronics Engineering', 'Class of 2025', 'Electronics', 'Robotics and automation engineer. Drone technology and autonomous systems researcher.', 'meera_krishnan25', 8.7, 'UNIV2022001', 'Sixth', NULL, NULL, NULL);
