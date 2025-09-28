-- Part 1: Enums and Custom Types
-- Run this first in Supabase SQL Editor

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'organization');
CREATE TYPE event_type AS ENUM ('workshop', 'seminar', 'conference', 'hackathon', 'cultural', 'sports', 'placement', 'other');
CREATE TYPE college_type AS ENUM ('Engineering', 'Medical', 'Management', 'Arts', 'Science', 'Commerce', 'Law', 'Other');
CREATE TYPE semester_enum AS ENUM ('First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth');
CREATE TYPE academic_year AS ENUM ('2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27', '2027-28');
CREATE TYPE faculty_designation AS ENUM ('Assistant Professor', 'Associate Professor', 'Professor', 'Head of Department', 'Dean', 'Director', 'Lecturer', 'Principal');
CREATE TYPE club_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE announcement_type AS ENUM ('general', 'academic', 'placement', 'event', 'research', 'workshop');
