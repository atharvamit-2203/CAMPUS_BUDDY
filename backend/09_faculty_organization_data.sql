-- Part 9: Faculty and Organization Data
-- Run this after Part 8B

INSERT INTO users (email, password_hash, full_name, role, college_id, course, batch, department, bio, username, cgpa, student_id, semester, employee_id, designation, specialization) VALUES
-- Faculty Members from MPSTME
('dr.amit.kumar@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Amit Kumar', 'faculty', 1, NULL, NULL, 'Computer Science', 'Professor of Computer Science specializing in AI and Machine Learning. 15 years of industry experience with TCS and Infosys.', 'dr_amit_kumar', NULL, NULL, NULL, 'EMP001', 'Professor', 'Artificial Intelligence, Machine Learning'),
('dr.sunita.sharma@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Sunita Sharma', 'faculty', 1, NULL, NULL, 'Computer Science', 'Associate Professor specializing in Data Structures and Algorithms. Former software architect at Wipro.', 'dr_sunita_sharma', NULL, NULL, NULL, 'EMP002', 'Associate Professor', 'Data Structures, Algorithms'),
('dr.rajesh.gupta@mpstme.edu.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Rajesh Gupta', 'faculty', 1, NULL, NULL, 'Information Technology', 'Professor of Database Systems and Big Data Analytics. Expert in distributed systems and cloud computing.', 'dr_rajesh_gupta', NULL, NULL, NULL, 'EMP003', 'Professor', 'Database Systems, Big Data Analytics'),

-- Faculty Members from DJSCE
('dr.meera.jain@djsce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Meera Jain', 'faculty', 2, NULL, NULL, 'Computer Science', 'Assistant Professor in Cybersecurity and Network Security. Ethical hacking and penetration testing expert.', 'dr_meera_jain', NULL, NULL, NULL, 'EMP004', 'Assistant Professor', 'Cybersecurity, Network Security'),
('dr.vikash.singh@djsce.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Vikash Singh', 'faculty', 2, NULL, NULL, 'Computer Science', 'Professor of Software Engineering and Project Management. Agile methodology and DevOps specialist.', 'dr_vikash_singh', NULL, NULL, NULL, 'EMP005', 'Professor', 'Software Engineering, Project Management'),

-- Faculty Members from TSEC
('dr.priya.agarwal@tsec.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Priya Agarwal', 'faculty', 3, NULL, NULL, 'Computer Science', 'Associate Professor of Human-Computer Interaction and UI/UX Design. Design thinking and user research expert.', 'dr_priya_agarwal', NULL, NULL, NULL, 'EMP006', 'Associate Professor', 'Human-Computer Interaction, UI/UX Design'),
('dr.suresh.reddy@tsec.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Suresh Reddy', 'faculty', 3, NULL, NULL, 'Electronics', 'Professor of Computer Networks and Internet Technologies. IoT and embedded systems researcher.', 'dr_suresh_reddy', NULL, NULL, NULL, 'EMP007', 'Professor', 'Computer Networks, IoT Systems'),

-- Faculty Members from VESIT
('dr.kavita.verma@vesit.ves.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Kavita Verma', 'faculty', 4, NULL, NULL, 'IT', 'Professor of Applied Mathematics and Statistics. Machine learning and data science methodology expert.', 'dr_kavita_verma', NULL, NULL, NULL, 'EMP008', 'Professor', 'Applied Mathematics, Data Science'),
('dr.anand.mishra@vesit.ves.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Anand Mishra', 'faculty', 4, NULL, NULL, 'Computer Science', 'Associate Professor of Digital Marketing and E-commerce. Startup incubation and entrepreneurship mentor.', 'dr_anand_mishra', NULL, NULL, NULL, 'EMP009', 'Associate Professor', 'Digital Marketing, Entrepreneurship'),

-- Faculty Members from SPIT
('dr.neha.pandey@spit.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Neha Pandey', 'faculty', 5, NULL, NULL, 'Electrical', 'Assistant Professor of Robotics and Automation. Industrial automation and smart manufacturing expert.', 'dr_neha_pandey', NULL, NULL, NULL, 'EMP010', 'Assistant Professor', 'Robotics, Industrial Automation'),
('dr.sanjay.kulkarni@spit.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYZ6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Dr. Sanjay Kulkarni', 'faculty', 5, NULL, NULL, 'Chemical', 'Professor of Chemical Engineering and Environmental Technology. Green chemistry and sustainability expert.', 'dr_sanjay_kulkarni', NULL, NULL, NULL, 'EMP011', 'Professor', 'Environmental Technology, Green Chemistry'),

-- Organizations
('startup.incubator@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'University Innovation Hub', 'organization', NULL, NULL, NULL, 'Innovation', 'Supporting student entrepreneurs and startup initiatives. Connecting students with industry mentors and funding opportunities.', 'innovation_hub', NULL, NULL, NULL, NULL, NULL, NULL),
('tech.society@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Technology Excellence Center', 'organization', NULL, NULL, NULL, 'Technology', 'Promoting technology education and innovation on campus. Industry partnerships and skill development programs.', 'tech_excellence', NULL, NULL, NULL, NULL, NULL, NULL),
('research.center@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Advanced Research Center', 'organization', NULL, NULL, NULL, 'Research', 'Facilitating cutting-edge research in AI, IoT, and emerging technologies. Collaboration with IITs and international universities.', 'research_center', NULL, NULL, NULL, NULL, NULL, NULL),
('placement.cell@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe', 'Career Development Cell', 'organization', NULL, NULL, NULL, 'Placement', 'Career guidance, placement assistance, and industry connections. Partnerships with top IT companies and startups.', 'placement_cell', NULL, NULL, NULL, NULL, NULL, NULL);
