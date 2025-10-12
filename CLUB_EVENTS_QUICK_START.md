# Club Events System - Quick Start Guide

## ✅ System Status: READY

All components have been successfully installed and verified!

## 🎯 What's Been Done

1. ✅ **Database Tables Created**
   - `club_events` - Store all club events
   - `club_event_registrations` - Track event registrations
   - `club_timeline` - Manage recurring activities
   - `clubs.is_student_council` - Mark Student Council

2. ✅ **Student Council Configured**
   - Student Council club (ID: 2) marked as head organization
   - Auto-approval enabled for Student Council events
   - Approval authority over all other club events

3. ✅ **API Endpoints Added to main.py**
   - 9 new endpoints for club events management
   - All endpoints integrated and ready to use

4. ✅ **Sample Data Created**
   - 2 sample events created for testing
   - Both events are approved and visible

## 🚀 Start Using the System

### 1. Start/Restart Your Server

```bash
cd d:\MPSTME_HACKATHON\backend
python main.py
```

Or if using uvicorn:
```bash
uvicorn main:app --reload
```

### 2. Access API Documentation

Open your browser and go to:
```
http://localhost:8000/docs
```

You'll see the new endpoints under "Club Events and Timeline Endpoints" section.

### 3. Test the Endpoints

#### View All Events (No Auth Required for Approved Events)
```bash
GET http://localhost:8000/clubs/events/all?status=approved
```

#### Student Council Dashboard (Requires Auth)
```bash
GET http://localhost:8000/student-council/dashboard
Authorization: Bearer {your_token}
```

## 📋 Available Endpoints

### Event Management

1. **Create Club Event**
   ```
   POST /clubs/{club_id}/events
   ```
   - Creates a new event for a club
   - Requires: Club admin, member, or Student Council
   - Status: `pending_approval` (auto-approved for Student Council)

2. **Get Club Events**
   ```
   GET /clubs/{club_id}/events?status=approved
   ```
   - Get all events for a specific club
   - Filter by status: draft, pending_approval, approved, rejected, cancelled, completed

3. **Get All Club Events**
   ```
   GET /clubs/events/all?status=approved&from_date=2024-12-01
   ```
   - Get events from all clubs (calendar view)
   - Perfect for campus-wide event calendar

4. **Approve/Reject Event**
   ```
   POST /clubs/events/{event_id}/approve
   ```
   - Student Council only
   - Approve or reject pending events

### Timeline Management

5. **Create Recurring Activity**
   ```
   POST /clubs/{club_id}/timeline
   ```
   - Add weekly recurring activities
   - Example: Monday meetings, practice sessions

6. **Get Club Timeline**
   ```
   GET /clubs/{club_id}/timeline
   ```
   - View club's weekly schedule

### Event Registration

7. **Register for Event**
   ```
   POST /clubs/events/{event_id}/register
   ```
   - Students can register for events
   - Tracks participant count

### Student Council

8. **Student Council Dashboard**
   ```
   GET /student-council/dashboard
   ```
   - Overview of all club activities
   - Pending approvals
   - Club statistics

9. **Mark Club as Student Council**
   ```
   POST /admin/clubs/{club_id}/mark-student-council
   ```
   - Admin only
   - Mark a club as Student Council

## 🧪 Test Scenarios

### Scenario 1: Create an Event (Club Admin)

**Request:**
```json
POST /clubs/5/events
{
  "title": "AI Workshop 2024",
  "description": "Learn about artificial intelligence",
  "event_date": "2024-12-20",
  "start_time": "14:00:00",
  "end_time": "17:00:00",
  "venue": "Lab 301",
  "event_type": "workshop",
  "max_participants": 50,
  "registration_required": true,
  "registration_deadline": "2024-12-18T23:59:59"
}
```

**Response:**
```json
{
  "event_id": 3,
  "message": "Event created successfully with status: pending_approval",
  "status": "pending_approval",
  "club_name": "Tech Club"
}
```

### Scenario 2: Student Council Approves Event

**Request:**
```json
POST /clubs/events/3/approve
{
  "action": "approve"
}
```

**Response:**
```json
{
  "message": "Event approved successfully",
  "event_id": 3,
  "status": "approve"
}
```

### Scenario 3: Student Registers for Event

**Request:**
```json
POST /clubs/events/3/register
```

**Response:**
```json
{
  "message": "Successfully registered for AI Workshop 2024",
  "event_title": "AI Workshop 2024",
  "club_name": "Tech Club"
}
```

### Scenario 4: Add Weekly Meeting to Timeline

**Request:**
```json
POST /clubs/5/timeline
{
  "activity_name": "Weekly Team Meeting",
  "description": "Regular sync-up",
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

## 🔑 Key Features

### Student Council Governance
- ✅ Marked as head of all clubs
- ✅ Approval authority over events
- ✅ Comprehensive dashboard
- ✅ Auto-approved events
- ✅ Notifications for pending approvals

### Event Workflow
```
Club creates event → pending_approval
         ↓
Student Council reviews
         ↓
    approved/rejected
         ↓
Event visible to students
         ↓
Students can register
```

### Timeline/Timetable
- Weekly recurring activities
- Day-wise schedule
- Venue management
- Effective date ranges

## 📊 Current System State

- **Database:** ✅ All tables created
- **Student Council:** ✅ Configured (Club ID: 2)
- **Sample Events:** ✅ 2 events created
- **API Endpoints:** ✅ 9 endpoints active
- **Status:** ✅ READY FOR USE

## 🎓 User Roles & Permissions

| Action | Student | Club Member | Club Admin | Student Council | Admin |
|--------|---------|-------------|------------|-----------------|-------|
| View approved events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create event | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve event | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage timeline | ❌ | ❌ | ✅ | ✅ | ✅ |
| Register for event | ✅ | ✅ | ✅ | ✅ | �� |

## 📚 Documentation Files

- **CLUB_EVENTS_DOCUMENTATION.md** - Complete API documentation
- **CLUB_EVENTS_SUMMARY.md** - Implementation summary
- **CLUB_EVENTS_QUICK_START.md** - This file

## 🛠️ Maintenance Scripts

- **setup_club_events.py** - Initial setup (already run)
- **add_club_events_to_main.py** - Add endpoints (already run)
- **verify_club_events.py** - Verify installation (already run)

## 🎉 You're All Set!

The club events and timeline management system is fully operational. Start your server and begin testing!

### Quick Test Command

```bash
# Test if server is running with new endpoints
curl http://localhost:8000/clubs/events/all?status=approved
```

### Next Steps

1. Start your FastAPI server
2. Open http://localhost:8000/docs
3. Test the endpoints with sample data
4. Build frontend components to consume the API
5. Customize as needed for your use case

---

**Need Help?** Check the full documentation in `CLUB_EVENTS_DOCUMENTATION.md`
