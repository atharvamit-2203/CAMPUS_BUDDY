-- Part 8A: Student Users Data (Part 1)
-- Run this after Part 7

INSERT INTO users (email, password_hash, full_name, role, college_id, course, batch, department, bio, username, cgpa, student_id, semester, employee_id, designation, specialization) VALUES
-- MPSTME Students
('arjun.sharma@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Arjun Sharma', 'student', 1, 'Computer Science Engineering', 'Class of 2025', 'Computer Science', 'Passionate about AI and web development. Love building innovative solutions for Indian startups.', 'arjun_sharma25', 8.7, 'MPSTME2022001', 'Sixth', NULL, NULL, NULL),
('priya.patel@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Priya Patel', 'student', 1, 'Information Technology', 'Class of 2025', 'IT', 'Data enthusiast with a focus on machine learning and analytics. Interested in fintech solutions.', 'priya_patel25', 9.1, 'MPSTME2022002', 'Sixth', NULL, NULL, NULL),
('rohit.kumar@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Rohit Kumar', 'student', 1, 'Electronics Engineering', 'Class of 2026', 'Electronics', 'Full-stack developer interested in modern web technologies and IoT platforms.', 'rohit_kumar26', 8.4, 'MPSTME2023001', 'Fourth', NULL, NULL, NULL),
('sneha.gupta@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Sneha Gupta', 'student', 1, 'Mechanical Engineering', 'Class of 2025', 'Mechanical', 'Aspiring entrepreneur with a passion for technology startups and digital transformation.', 'sneha_gupta25', 8.9, 'MPSTME2022003', 'Sixth', NULL, NULL, NULL),

-- DJSCE Students
('vikram.singh@djsce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Vikram Singh', 'student', 2, 'Computer Engineering', 'Class of 2026', 'Computer Science', 'Blockchain enthusiast and cryptocurrency researcher. Interested in DeFi and Web3 technologies.', 'vikram_singh26', 8.6, 'DJSCE2023001', 'Fourth', NULL, NULL, NULL),
('ananya.reddy@djsce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Ananya Reddy', 'student', 2, 'Information Technology', 'Class of 2025', 'IT', 'Creative technologist focusing on UI/UX and digital experiences for Indian mobile users.', 'ananya_reddy25', 9.3, 'DJSCE2022001', 'Sixth', NULL, NULL, NULL),
('kiran.joshi@djsce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Kiran Joshi', 'student', 2, 'Electronics & Telecommunication', 'Class of 2024', 'Electronics', 'AI researcher working on robotics and computer vision for smart city applications.', 'kiran_joshi24', 8.8, 'DJSCE2021001', 'Eighth', NULL, NULL, NULL),

-- TSEC Students
('isha.mehta@tsec.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Isha Mehta', 'student', 3, 'Computer Engineering', 'Class of 2025', 'Computer Science', 'IoT and embedded systems enthusiast. Working on smart home automation projects.', 'isha_mehta25', 8.5, 'TSEC2022001', 'Sixth', NULL, NULL, NULL),
('aditya.agarwal@tsec.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Aditya Agarwal', 'student', 3, 'Mechanical Engineering', 'Class of 2026', 'Mechanical', 'Interested in Industry 4.0, automation, and sustainable manufacturing technologies.', 'aditya_agarwal26', 8.2, 'TSEC2023001', 'Fourth', NULL, NULL, NULL),
('kavya.nair@tsec.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Kavya Nair', 'student', 3, 'Information Technology', 'Class of 2024', 'IT', 'Full-stack developer with expertise in React and Node.js. Passionate about creating accessible web applications.', 'kavya_nair24', 9.0, 'TSEC2021001', 'Eighth', NULL, NULL, NULL),

-- VESIT Students
('rahul.deshmukh@vesit.ves.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Rahul Deshmukh', 'student', 4, 'Computer Engineering', 'Class of 2025', 'Computer Science', 'Machine learning enthusiast working on computer vision and natural language processing projects.', 'rahul_deshmukh25', 8.6, 'VESIT2022001', 'Sixth', NULL, NULL, NULL),
('pooja.iyer@vesit.ves.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Pooja Iyer', 'student', 4, 'Information Technology', 'Class of 2026', 'IT', 'Cybersecurity specialist focusing on ethical hacking and penetration testing. Competitive programming enthusiast.', 'pooja_iyer26', 8.9, 'VESIT2023001', 'Fourth', NULL, NULL, NULL),

-- SPIT Students
('amit.shah@spit.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Amit Shah', 'student', 5, 'Computer Engineering', 'Class of 2024', 'Computer Science', 'Software engineer with expertise in cloud computing and DevOps. Passionate about scalable system design.', 'amit_shah24', 8.7, 'SPIT2021001', 'Eighth', NULL, NULL, NULL),
('riya.kapoor@spit.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Riya Kapoor', 'student', 5, 'Electronics Engineering', 'Class of 2025', 'Electronics', 'Hardware enthusiast working on Arduino and Raspberry Pi projects. Interested in IoT and robotics.', 'riya_kapoor25', 8.3, 'SPIT2022001', 'Sixth', NULL, NULL, NULL);
