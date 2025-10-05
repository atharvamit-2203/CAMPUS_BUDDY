from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum

class UserRole(str, Enum):
    student = "student"
    faculty = "faculty"
    organization = "organization"
    admin = "admin"

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    college_id: Optional[str] = None
    
    # Student specific fields
    student_id: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    batch: Optional[str] = None
    
    # Preferences
    interests: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    
    # Faculty specific fields
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    
    # Organization specific fields
    organization_type: Optional[str] = None
    
    # Common fields
    department: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None

    @validator('username')
    def username_must_be_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must contain only letters, numbers, hyphens, and underscores')
        return v

    @validator('password')
    def password_must_be_strong(cls, v):
        # Accept any password content as long as it has at least 6 characters
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('college_id')
    def college_id_length(cls, v):
        # If provided, must be 1..15 characters
        if v is None:
            return v
        s = str(v)
        if not (1 <= len(s) <= 15):
            raise ValueError('college_id must be between 1 and 15 characters')
        return s

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    college_id: Optional[str]
    department: Optional[str]
    bio: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

class CollegeResponse(BaseModel):
    id: int
    name: str
    code: str
    type: str
    city: Optional[str]
    state: Optional[str]

    class Config:
        from_attributes = True

# ============================================================================
# CLUB MANAGEMENT SCHEMAS
# ============================================================================

class ClubCreate(BaseModel):
    name: str
    description: str
    category: str
    college_id: int
    max_members: Optional[int] = 100

class ClubResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    college_id: int
    max_members: int
    member_count: Optional[int] = 0
    created_by: int
    is_active: bool
    created_at: datetime

class ClubApplicationCreate(BaseModel):
    club_id: int
    application_message: Optional[str] = ""

class ClubApplicationResponse(BaseModel):
    id: int
    club_id: int
    user_id: int
    application_message: str
    status: str  # pending, approved, rejected
    applied_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]

class ClubApplicationAction(BaseModel):
    application_id: int
    action: str  # approve, reject
    review_message: Optional[str] = ""

# ============================================================================
# EVENT MANAGEMENT SCHEMAS
# ============================================================================

class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str
    start_time: datetime
    end_time: datetime
    venue: str
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    is_public: bool = True

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    event_type: str
    start_time: datetime
    end_time: datetime
    venue: str
    max_participants: Optional[int]
    current_participants: Optional[int] = 0
    registration_deadline: Optional[datetime]
    is_public: bool
    organizer_id: int
    organizer_name: Optional[str]
    college_id: int
    created_at: datetime

class EventRSVP(BaseModel):
    event_id: int
    response: str  # attending, not_attending, maybe

class EventRSVPResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    response: str
    rsvp_date: datetime

# ============================================================================
# CANTEEN MANAGEMENT SCHEMAS
# ============================================================================

class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    category: str
    is_vegetarian: bool = True
    is_available: bool = True

class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str
    is_vegetarian: bool
    is_available: bool
    created_at: datetime

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int

class CanteenOrderCreate(BaseModel):
    items: List[OrderItemCreate]
    special_instructions: Optional[str] = ""

class CanteenOrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str  # pending, preparing, ready, completed, cancelled
    special_instructions: str
    order_date: datetime
    items: List[dict]

# ============================================================================
# TEACHER SCHEDULING SCHEMAS
# ============================================================================

class ExtraLectureCreate(BaseModel):
    subject: str
    topic: str
    date: date
    start_time: time
    end_time: time
    venue: str
    max_students: int
    description: Optional[str] = ""

class ExtraLectureResponse(BaseModel):
    id: int
    faculty_id: int
    faculty_name: Optional[str]
    subject: str
    topic: str
    date: date
    start_time: time
    end_time: time
    venue: str
    max_students: int
    enrolled_students: Optional[int] = 0
    description: str
    created_at: datetime

class ConsultationSlotCreate(BaseModel):
    date: date
    start_time: time
    end_time: time
    subject: Optional[str] = ""
    max_bookings: int = 1

class ConsultationBooking(BaseModel):
    slot_id: int
    purpose: str

class ConsultationBookingResponse(BaseModel):
    id: int
    slot_id: int
    student_id: int
    student_name: Optional[str]
    purpose: str
    status: str  # confirmed, cancelled, completed
    booking_date: datetime

# ============================================================================
# ROOM/HOSTEL MANAGEMENT SCHEMAS
# ============================================================================

class RoomBookingCreate(BaseModel):
    room_id: int
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    purpose: str

class RoomBookingResponse(BaseModel):
    id: int
    room_id: int
    room_name: Optional[str]
    user_id: int
    user_name: Optional[str]
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    purpose: str
    status: str  # pending, approved, rejected, completed
    booking_date: datetime

class RoomResponse(BaseModel):
    id: int
    room_number: str
    building: str
    room_type: str
    capacity: int
    facilities: Optional[str]
    is_available: bool

# ============================================================================
# ACADEMIC SCHEMAS
# ============================================================================

class AssignmentCreate(BaseModel):
    title: str
    description: str
    subject: str
    due_date: datetime
    max_marks: int

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    subject: str
    due_date: datetime
    max_marks: int
    faculty_id: int
    faculty_name: Optional[str]
    created_at: datetime

class SubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: Optional[str] = ""
    file_url: Optional[str] = ""

class AttendanceCreate(BaseModel):
    subject: str
    date: date
    student_ids: List[int]

# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================

class NotificationCreate(BaseModel):
    title: str
    message: str
    category: str  # announcement, assignment, event, club, canteen, maintenance, etc.
    priority: str = "medium"  # low, medium, high, urgent
    target_role: str = "all"  # all, student, faculty, admin

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_audience: str  # all, students, faculty, specific_course
    course_filter: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    target_audience: str
    course_filter: Optional[str]
    priority: str
    created_by: int
    created_by_name: Optional[str]
    created_at: datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

# ============================================================================
# MISSING SCHEMAS
# ============================================================================

class MaintenanceRequestCreate(BaseModel):
    category: str  # electrical, plumbing, furniture, cleaning, etc.
    location: str
    description: str
    priority: str = "medium"  # low, medium, high, urgent

class StatusUpdate(BaseModel):
    status: str

class AssignmentSubmissionCreate(BaseModel):
    content: str
    file_path: Optional[str] = None

class GradeSubmission(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None

# ============================================================================
# ADMIN SCHEMAS
# ============================================================================

class UserUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    role: Optional[str] = None

class ClubCreate(BaseModel):
    name: str
    description: str
    category: str
    college_id: int
    max_members: Optional[int] = 100

class ClubResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    college_id: int
    max_members: int
    member_count: Optional[int] = 0
    created_by: int
    is_active: bool
    created_at: datetime

class ClubApplicationCreate(BaseModel):
    club_id: int
    application_message: Optional[str] = ""

class ClubApplicationResponse(BaseModel):
    id: int
    club_id: int
    user_id: int
    application_message: str
    status: str  # pending, approved, rejected
    applied_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]

class ClubApplicationAction(BaseModel):
    application_id: int
    action: str  # approve, reject
    review_message: Optional[str] = ""

class OrganizationApplicationCreate(BaseModel):
    club_id: int
    full_name: str
    batch: str
    year_of_study: str
    sap_id: str
    department_to_join: str
    why_join: str
    what_contribute: str
    can_stay_longer_hours: bool

class OrganizationApplicationResponse(BaseModel):
    id: int
    club_id: int
    user_id: int
    full_name: str
    batch: str
    year_of_study: str
    sap_id: str
    department_to_join: str
    why_join: str
    what_contribute: str
    can_stay_longer_hours: bool
    status: str  # pending, approved, rejected
    applied_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]

class ReportRequest(BaseModel):
    report_type: str  # user_activity, club_stats, event_stats, canteen_sales
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    filters: Optional[dict] = None
