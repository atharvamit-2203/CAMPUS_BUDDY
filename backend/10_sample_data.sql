-- Part 10: Sample Application Data
-- Run this after Part 9

-- Insert sample clubs
INSERT INTO clubs (name, description, category, created_by, member_count) VALUES
('AI & Machine Learning Society', 'A community for students interested in artificial intelligence, machine learning, and data science. We organize workshops, guest lectures, and hackathons. Focus on Indian AI applications.', 'Technology', 16, 248),
('Web Development Club', 'Learn modern web development technologies including React, Node.js, and full-stack development. Build real-world projects for Indian startups and collaborate with peers.', 'Technology', 17, 156),
('Entrepreneurship Cell', 'Supporting student entrepreneurs with mentorship, funding opportunities, and startup incubation. Connect with like-minded innovators and learn from successful Indian entrepreneurs.', 'Business', 26, 189),
('Cybersecurity Club', 'Dedicated to learning ethical hacking, penetration testing, and cybersecurity best practices. Regular CTF competitions and hands-on security workshops.', 'Technology', 12, 92),
('Robotics & Automation Society', 'Building robots, drones, and automated systems. Working on projects for smart cities and Industry 4.0 applications in India.', 'Technology', 21, 134),
('Data Science Hub', 'Exploring big data, analytics, and business intelligence. Collaborating with Indian companies on real data science projects and case studies.', 'Technology', 6, 167),
('Mobile App Development Club', 'Creating mobile applications for Android and iOS. Focus on solving Indian market problems through innovative mobile solutions.', 'Technology', 19, 203),
('Blockchain & Cryptocurrency Society', 'Understanding distributed ledger technology, smart contracts, and cryptocurrency. Exploring blockchain applications for Indian financial services.', 'Technology', 5, 78),
('UI/UX Design Community', 'Designing user-friendly interfaces and experiences. Working with startups to create accessible designs for Indian users and diverse needs.', 'Design', 24, 145),
('Open Source Contributors', 'Contributing to open source projects and building collaborative software solutions. Promoting open source culture in Indian tech community.', 'Technology', 18, 112);

-- Insert sample events
INSERT INTO events (title, description, event_type, start_date, end_date, location, college_id, organizer_id, max_participants, is_public) VALUES
('TechFest Mumbai 2025', 'Annual technology festival featuring hackathons, workshops, and tech talks by industry leaders from Indian tech giants like TCS, Infosys, and Flipkart.', 'conference', '2025-10-15 09:00:00', '2025-10-17 18:00:00', 'MPSTME Campus, Mumbai', 1, 22, 500, true),
('AI Workshop Series', 'Comprehensive workshop on machine learning, deep learning, and AI applications in Indian industries like healthcare, finance, and agriculture.', 'workshop', '2025-09-20 10:00:00', '2025-09-20 16:00:00', 'DJSCE Auditorium', 2, 23, 100, true),
('Startup Pitch Competition', 'Students present their startup ideas to a panel of investors and successful entrepreneurs from the Indian startup ecosystem.', 'other', '2025-11-05 14:00:00', '2025-11-05 17:00:00', 'TSEC Conference Hall', 3, 26, 50, true),
('Cybersecurity CTF Challenge', 'Capture The Flag competition testing cybersecurity skills with real-world scenarios faced by Indian organizations.', 'hackathon', '2025-10-08 09:00:00', '2025-10-09 18:00:00', 'VESIT Lab Complex', 4, 12, 150, true),
('Cultural Night 2025', 'Celebrating Indian culture and diversity through music, dance, and art performances by students from different states.', 'cultural', '2025-12-10 19:00:00', '2025-12-10 23:00:00', 'SPIT Main Auditorium', 5, 14, 300, true),
('Industry Placement Drive', 'Campus placement event with top Indian and multinational companies recruiting for software engineering and IT roles.', 'placement', '2025-09-25 09:00:00', '2025-09-27 17:00:00', 'KJSCE Placement Cell', 6, 27, 200, false),
('Inter-College Sports Meet', 'Annual sports competition featuring cricket, football, basketball, and traditional Indian games like kabaddi.', 'sports', '2025-10-30 08:00:00', '2025-11-02 18:00:00', 'ACE Sports Complex', 7, 19, 400, true),
('Research Symposium 2025', 'Showcasing student and faculty research in emerging technologies, sustainable development, and innovation for Indian challenges.', 'seminar', '2025-11-20 10:00:00', '2025-11-21 16:00:00', 'PCE Research Center', 8, 20, 120, true);

-- Insert sample faculty announcements
INSERT INTO faculty_announcements (faculty_id, title, content, announcement_type, target_audience, is_urgent) VALUES
(22, 'Guest Lecture on AI in Healthcare', 'Join us for an insightful session on how artificial intelligence is revolutionizing healthcare in India. Dr. Pradeep Singh from AIIMS will share real-world applications and case studies from Indian hospitals.', 'academic', ARRAY['students', 'faculty'], false),
(23, 'Internship Opportunities at TCS', 'TCS is offering summer internship positions for final year students in software development, data analytics, and cloud computing. Applications open until October 15th.', 'placement', ARRAY['students'], true),
(24, 'Research Collaboration Opportunity', 'Exciting opportunity to collaborate with IIT Mumbai on a project focusing on smart city solutions for Indian urban challenges. Looking for motivated students in IoT and data science.', 'research', ARRAY['students'], false),
(25, 'Workshop on Digital Marketing', 'Learn the latest digital marketing strategies specifically tailored for the Indian market. Session will cover social media marketing, content strategy, and e-commerce optimization.', 'workshop', ARRAY['students'], false),
(26, 'Industry Visit to Infosys Pune', 'Educational visit to Infosys development center in Pune. Students will get exposure to real software development processes and agile methodologies used in the industry.', 'event', ARRAY['students'], false);

-- Insert sample club join requests
INSERT INTO club_join_requests (club_id, user_id, message, status) VALUES
(1, 3, 'I am passionate about AI and have completed online courses in machine learning. Would love to contribute to the society and learn from experienced members.', 'pending'),
(2, 8, 'I have experience with React and Node.js development. I have built several personal projects and would like to collaborate on real-world applications.', 'approved'),
(3, 11, 'As an aspiring entrepreneur, I believe this cell will provide the perfect platform to network with like-minded individuals and learn from successful startups.', 'pending'),
(4, 13, 'I have been practicing ethical hacking and have basic knowledge of penetration testing. Eager to participate in CTF competitions and enhance my skills.', 'approved'),
(5, 15, 'I have worked with Arduino and Raspberry Pi on several IoT projects. Would love to contribute to robotics projects and learn advanced automation techniques.', 'pending');

-- Insert sample announcement interests
INSERT INTO announcement_interests (announcement_id, student_id, interest_level, message) VALUES
(1, 1, 'very_interested', 'I am very interested in AI applications in healthcare and would love to attend this session.'),
(1, 7, 'interested', 'This aligns with my career interests in AI and healthcare technology.'),
(2, 3, 'very_interested', 'TCS internship would be a great opportunity for my career growth.'),
(2, 10, 'interested', 'I meet the requirements and would like to apply for the data analytics position.'),
(3, 2, 'very_interested', 'I have been working on IoT projects and this collaboration sounds amazing.'),
(4, 6, 'interested', 'Digital marketing skills would complement my technical background.'),
(5, 4, 'very_interested', 'Industry exposure at Infosys would provide valuable insights.');
