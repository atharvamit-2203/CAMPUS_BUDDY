from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, DECIMAL, Date, ARRAY, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    college_id = Column(Integer)
    
    # Student specific fields
    student_id = Column(String(20))
    course = Column(String(255))
    branch = Column(String(255))
    semester = Column(String(20))
    academic_year = Column(String(20))
    batch = Column(String(20))
    cgpa = Column(DECIMAL(4, 2))
    date_of_birth = Column(Date)
    phone_number = Column(String(15))
    address = Column(Text)
    
    # Faculty specific fields
    employee_id = Column(String(20))
    designation = Column(String(50))
    specialization = Column(String(255))
    experience_years = Column(Integer)
    research_interests = Column(Text)
    
    # Organization specific fields
    organization_type = Column(String(100))
    
    # Common fields
    department = Column(String(255))
    bio = Column(Text)
    profile_picture_url = Column(String(500))
    social_links = Column(JSON)
    skills = Column(ARRAY(String))
    interests = Column(ARRAY(String))
    
    # Privacy and status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    type = Column(String(50), nullable=False)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    website_url = Column(String(500))
    established_year = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
