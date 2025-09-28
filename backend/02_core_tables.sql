-- Part 2: Core Tables
-- Run this after Part 1

-- Colleges table
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type college_type NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website_url VARCHAR(500),
    established_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (students, faculty, organizations)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    college_id INTEGER REFERENCES colleges(id),
    
    -- Student specific fields
    student_id VARCHAR(20),
    course VARCHAR(255),
    branch VARCHAR(255),
    semester semester_enum,
    academic_year academic_year,
    batch VARCHAR(20),
    cgpa DECIMAL(4,2) CHECK (cgpa >= 0 AND cgpa <= 10),
    date_of_birth DATE,
    phone_number VARCHAR(15),
    address TEXT,
    
    -- Faculty specific fields
    employee_id VARCHAR(20),
    designation faculty_designation,
    specialization VARCHAR(255),
    experience_years INTEGER,
    research_interests TEXT,
    
    -- Organization specific fields
    organization_type VARCHAR(100),
    
    -- Common fields
    department VARCHAR(255),
    bio TEXT,
    profile_picture_url VARCHAR(500),
    social_links JSONB,
    skills TEXT[],
    interests TEXT[],
    
    -- Privacy and status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
