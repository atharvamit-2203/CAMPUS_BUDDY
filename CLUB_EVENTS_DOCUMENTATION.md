# Club Events and Timeline Management System

## Overview

This system allows all clubs/organizations to manage their event schedules and timelines, with the **Student Council** serving as the head organization with oversight over all club activities.

## Key Features

### 1. **Student Council Governance**
- Student Council is marked as the head of all clubs
- Has approval authority over all club events
- Can view all club activities and events
- Receives notifications for pending event approvals
- Dashboard with comprehensive overview of all club activities

### 2. **Club Event Management**
- Clubs can create and manage their events
- Events require Student Council approval (except Student Council's own events)
- Support for various event types: meetings, workshops, competitions, seminars, social events, recruitment
- Event registration system with participant limits
- Event status tracking: draft, pending_approval, approved, rejected, cancelled, completed

### 3. **Club Timeline/Timetable**
- Recurring activities (weekly meetings, practice sessions, etc.)
- Day-wise schedule management
- Venue and time slot management
- Effective date ranges for activities

## Database Schema

### Tables Created

#### 1. `club_events`
```sql
- id: Primary key
- club_id: Foreign key to clubs table
- title: Event title
- description: Event description
- event_date: Date of the event
- start_time: Event start time
- end_time: Event end time
- venue: Event location
- event_type: meeting, workshop, competition, seminar, social, recruitment, other
- max_participants: Maximum number of participants
- registration_required: Boolean
- registration_deadline: Deadline for registration
- status: draft, pending_approval, approved, rejected, cancelled, completed
- approved_by: User who approved/rejected
- approved_at: Approval timestamp
- rejection_reason: Reason for rejection
- created_by: User who created the event
- is_public: Whether event is public
- poster_url: Event poster image URL
- contact_email: Contact email
- contact_phone: Contact phone
```

#### 2. `club_event_registrations`
```sql
- id: Primary key
- event_id: Foreign key to club_events
- user_id: Foreign key to users
- registration_date: When user registered
- status: registered, attended, cancelled
- attendance_marked_by: Who marked attendance
- attendance_marked_at: When attendance was marked
```

#### 3. `club_timeline`
```sql
- id: Primary key
- club_id: Foreign key to clubs
- activity_name: Name of recurring activity
- description: Activity description
- day_of_week: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- start_time: Activity start time
- end_time: Activity end time
- venue: Activity location
- activity_type: meeting, practice, workshop, training, other
- is_active: Boolean
- effective_from: Start date for this schedule
- effective_until: End date for this schedule
- created_by: User who created the timeline entry
```

#### 4. `clubs` table enhancement
```sql
- is_student_council: Boolean flag to mark Student Council
```

## API Endpoints

### 1. Create Club Event
**POST** `/clubs/{club_id}/events`

**Authorization:** Club admin, club members, Student Council, admin, faculty

**Request Body:**
```json
{
  "title": "Tech Workshop 2024",
  "description": "Annual technology workshop",
  "event_date": "2024-12-15",
  "start_time": "10:00:00",
  "end_time": "16:00:00",
  "venue": "Auditorium A",
  "event_type": "workshop",
  "max_participants": 100,
  "registration_required": true,
  "registration_deadline": "2024-12-10T23:59:59",
  "is_public": true,
  "poster_url": "https://example.com/poster.jpg",
  "contact_email": "techclub@college.edu",
  "contact_phone": "+1234567890"
}
```

**Response:**
```json
{
  "event_id": 1,
  "message": "Event created successfully with status: pending_approval",
  "status": "pending_approval",
  "club_name": "Tech Club"
}
```

**Note:** Student Council events are auto-approved. Other clubs' events need approval.

### 2. Get Club Events
**GET** `/clubs/{club_id}/events?status=approved`

**Authorization:** Public for approved events, club admin/Student Council for all events

**Response:**
```json
[
  {
    "id": 1,
    "club_id": 5,
    "club_name": "Tech Club",
    "title": "Tech Workshop 2024",
    "description": "Annual technology workshop",
    "event_date": "2024-12-15",
    "start_time": "10:00:00",
    "end_time": "16:00:00",
    "venue": "Auditorium A",
    "event_type": "workshop",
    "status": "approved",
    "registration_count": 45,
    "created_by_name": "John Doe",
    "created_at": "2024-11-01T10:00:00"
  }
]
```

### 3. Get All Club Events (Calendar View)
**GET** `/clubs/events/all?status=approved&from_date=2024-12-01`

**Authorization:** Authenticated users

**Response:** Array of all club events across all clubs

### 4. Approve/Reject Club Event
**POST** `/clubs/events/{event_id}/approve`

**Authorization:** Student Council members, admin, faculty

**Request Body:**
```json
{
  "action": "approve",  // or "reject"
  "rejection_reason": "Conflicts with another event"  // required if rejecting
}
```

**Response:**
```json
{
  "message": "Event approved successfully",
  "event_id": 1,
  "status": "approve"
}
```

### 5. Create Club Timeline (Recurring Activity)
**POST** `/clubs/{club_id}/timeline`

**Authorization:** Club admin, admin, faculty

**Request Body:**
```json
{
  "activity_name": "Weekly Team Meeting",
  "description": "Regular team sync-up meeting",
  "day_of_week": "monday",
  "start_time": "18:00:00",
  "end_time": "19:00:00",
  "venue": "Room 301",
  "activity_type": "meeting",
  "effective_from": "2024-12-01",
  "effective_until": "2025-05-31"
}
```

**Response:**
```json
{
  "timeline_id": 1,
  "message": "Timeline activity created successfully",
  "club_name": "Tech Club"
}
```

### 6. Get Club Timeline
**GET** `/clubs/{club_id}/timeline`

**Authorization:** Authenticated users

**Response:**
```json
[
  {
    "id": 1,
    "club_id": 5,
    "club_name": "Tech Club",
    "activity_name": "Weekly Team Meeting",
    "description": "Regular team sync-up meeting",
    "day_of_week": "monday",
    "start_time": "18:00:00",
    "end_time": "19:00:00",
    "venue": "Room 301",
    "activity_type": "meeting",
    "is_active": true,
    "effective_from": "2024-12-01",
    "effective_until": "2025-05-31",
    "created_by_name": "John Doe"
  }
]
```

### 7. Register for Event
**POST** `/clubs/events/{event_id}/register`

**Authorization:** Authenticated users

**Response:**
```json
{
  "message": "Successfully registered for Tech Workshop 2024",
  "event_title": "Tech Workshop 2024",
  "club_name": "Tech Club"
}
```

### 8. Student Council Dashboard
**GET** `/student-council/dashboard`

**Authorization:** Student Council members, admin, faculty

**Response:**
```json
{
  "stats": {
    "pending_events": 5,
    "upcoming_events": 23,
    "total_clubs": 8
  },
  "club_activity": [
    {
      "club_name": "Tech Club",
      "category": "Technology",
      "event_count": 12,
      "last_event_date": "2024-11-15"
    }
  ],
  "pending_approvals": [
    {
      "id": 1,
      "club_name": "Tech Club",
      "title": "Tech Workshop 2024",
      "event_date": "2024-12-15",
      "created_by_name": "John Doe",
      "created_at": "2024-11-01T10:00:00"
    }
  ]
}
```

### 9. Mark Club as Student Council
**POST** `/admin/clubs/{club_id}/mark-student-council`

**Authorization:** Admin only

**Response:**
```json
{
  "message": "Club marked as Student Council successfully"
}
```

## Setup Instructions

### 1. Add Imports to main.py

At the top of `main.py`, add:
```python
# Import club events API
from club_events_api import (
    create_club_event, get_club_events, get_all_club_events, approve_club_event,
    create_club_timeline, get_club_timeline, register_for_event,
    get_student_council_dashboard, mark_student_council
)
```

### 2. Add Endpoints to main.py

Copy all endpoints from `club_events_endpoints.py` to the end of `main.py`.

### 3. Mark Student Council

Run this command to mark the Student Council club:
```bash
# Find the Student Council club ID first
curl -X GET http://localhost:8000/clubs

# Then mark it as Student Council (replace {club_id} with actual ID)
curl -X POST http://localhost:8000/admin/clubs/{club_id}/mark-student-council \
  -H "Authorization: Bearer {admin_token}"
```

Or use the API directly from your admin account.

## Usage Workflow

### For Regular Clubs:

1. **Create an Event**
   - Club admin creates an event
   - Event status: `pending_approval`
   - Student Council receives notification

2. **Student Council Reviews**
   - Student Council views pending events
   - Approves or rejects with reason
   - Club admin receives notification

3. **Event Goes Live**
   - Approved events are visible to all users
   - Students can register if registration is required
   - Club can manage registrations and attendance

4. **Recurring Activities**
   - Club admin creates timeline entries
   - Weekly/regular activities are displayed
   - Helps students know when club activities happen

### For Student Council:

1. **Auto-Approved Events**
   - Student Council events are automatically approved
   - No approval workflow needed

2. **Oversight Dashboard**
   - View all club activities
   - Monitor event distribution
   - Approve/reject pending events
   - Track club engagement

3. **Notifications**
   - Receive alerts for new event submissions
   - Track approval requests
   - Monitor club activity

## Frontend Integration Examples

### Display Club Events Calendar
```typescript
// Fetch all club events
const response = await fetch('/clubs/events/all?status=approved&from_date=2024-12-01', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const events = await response.json();

// Display in calendar component
<Calendar events={events} />
```

### Create Event Form
```typescript
const createEvent = async (clubId: number, eventData: any) => {
  const response = await fetch(`/clubs/${clubId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });
  return response.json();
};
```

### Student Council Dashboard
```typescript
const response = await fetch('/student-council/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const dashboard = await response.json();

// Display stats and pending approvals
<StudentCouncilDashboard data={dashboard} />
```

### Club Timeline Display
```typescript
const response = await fetch(`/clubs/${clubId}/timeline`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const timeline = await response.json();

// Display weekly schedule
<WeeklySchedule activities={timeline} />
```

## Notifications

The system automatically sends notifications for:

1. **Event Submission** → Student Council members
2. **Event Approved** → Club admin
3. **Event Rejected** → Club admin with reason
4. **Event Registration** → User confirmation

## Security & Permissions

- **Create Events:** Club admin, club members, Student Council, admin, faculty
- **Approve Events:** Student Council members, admin, faculty
- **View All Events:** Student Council members, admin, faculty
- **View Approved Events:** All authenticated users
- **Register for Events:** All authenticated users
- **Manage Timeline:** Club admin, admin, faculty
- **Mark Student Council:** Admin only

## Best Practices

1. **Event Planning:** Create events at least 2 weeks in advance for approval time
2. **Timeline Management:** Keep recurring activities updated
3. **Registration Limits:** Set realistic participant limits
4. **Venue Coordination:** Check venue availability before creating events
5. **Student Council:** Review pending events within 48 hours
6. **Communication:** Use clear event descriptions and contact information

## Troubleshooting

### Events Not Showing
- Check event status (must be "approved" for public view)
- Verify event date is in the future
- Ensure user has proper permissions

### Cannot Create Event
- Verify user is club member or admin
- Check club_id is valid
- Ensure all required fields are provided

### Approval Not Working
- Verify user is Student Council member
- Check is_student_council flag on clubs table
- Ensure proper authentication token

## Future Enhancements

- Event conflict detection
- Automated venue booking integration
- Email notifications for event reminders
- Event analytics and attendance tracking
- QR code check-in for events
- Event feedback and ratings
- Calendar export (iCal format)
- Integration with college timetable system
