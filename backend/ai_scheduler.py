"""
AI-Powered Scheduling and Conflict Resolution System
Handles intelligent timetable management, resource booking, and event scheduling
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Optional, Tuple
import mysql.connector
from database import get_mysql_connection
import auth

class AIScheduler:
    def __init__(self):
        self.time_slots = [
            ("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00"),
            ("12:00", "13:00"), ("13:00", "14:00"), ("14:00", "15:00"),
            ("15:00", "16:00"), ("16:00", "17:00")
        ]
        self.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    def suggest_reschedule_slot(self, cancelled_class_id: int, faculty_id: int) -> Dict:
        """
        AI-based rescheduling suggestion for cancelled classes
        Finds optimal free slots considering both faculty and student availability
        """
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Get details of cancelled class
            cursor.execute("""
                SELECT cs.*, s.name as subject_name, s.code as subject_code,
                       sem.name as semester_name
                FROM class_schedule cs
                JOIN subjects s ON cs.subject_id = s.id
                JOIN semesters sem ON cs.semester_id = sem.id
                WHERE cs.id = %s
            """, (cancelled_class_id,))
            
            cancelled_class = cursor.fetchone()
            if not cancelled_class:
                return {"error": "Class not found"}
            
            # Find faculty's free slots
            cursor.execute("""
                SELECT day_of_week, start_time, end_time 
                FROM class_schedule 
                WHERE faculty_id = %s AND is_active = TRUE
            """, (faculty_id,))
            faculty_busy_slots = cursor.fetchall()
            
            # Find student group's busy slots (based on semester)
            cursor.execute("""
                SELECT day_of_week, start_time, end_time 
                FROM class_schedule 
                WHERE semester_id = %s AND is_active = TRUE
            """, (cancelled_class['semester_id'],))
            student_busy_slots = cursor.fetchall()
            
            # Find available rooms for the same duration
            class_duration = self._calculate_duration(
                cancelled_class['start_time'], 
                cancelled_class['end_time']
            )
            
            suggestions = []
            
            for day in self.days:
                for start_time, end_time in self.time_slots:
                    # Check if this slot fits the class duration
                    slot_duration = self._calculate_duration(start_time, end_time)
                    if slot_duration < class_duration:
                        continue
                    
                    # Check faculty availability
                    if self._is_slot_occupied(day, start_time, end_time, faculty_busy_slots):
                        continue
                    
                    # Check student group availability
                    if self._is_slot_occupied(day, start_time, end_time, student_busy_slots):
                        continue
                    
                    # Find available rooms
                    available_rooms = self._get_available_rooms(day, start_time, end_time)
                    
                    if available_rooms:
                        # Calculate preference score
                        score = self._calculate_preference_score(
                            day, start_time, cancelled_class['day_of_week'], 
                            cancelled_class['start_time']
                        )
                        
                        suggestions.append({
                            "day": day,
                            "start_time": start_time,
                            "end_time": end_time,
                            "available_rooms": available_rooms,
                            "preference_score": score,
                            "reason": self._get_suggestion_reason(day, start_time, score)
                        })
            
            # Sort by preference score (higher is better)
            suggestions.sort(key=lambda x: x['preference_score'], reverse=True)
            
            return {
                "cancelled_class": cancelled_class,
                "suggestions": suggestions[:5],  # Top 5 suggestions
                "total_alternatives": len(suggestions)
            }
            
        except mysql.connector.Error as e:
            return {"error": f"Database error: {str(e)}"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    def emergency_cancel_class(self, class_id: int, faculty_id: int, reason: str = "") -> Dict:
        """
        One-click emergency cancellation with automatic notifications
        """
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Get class details
            cursor.execute("""
                SELECT cs.*, s.name as subject_name, s.code as subject_code,
                       r.room_number, r.room_name, sem.name as semester_name,
                       CONCAT(f.first_name, ' ', f.last_name) as faculty_name
                FROM class_schedule cs
                JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN rooms r ON cs.room_id = r.id
                JOIN semesters sem ON cs.semester_id = sem.id
                JOIN users f ON cs.faculty_id = f.id
                WHERE cs.id = %s AND cs.faculty_id = %s
            """, (class_id, faculty_id))
            
            class_details = cursor.fetchone()
            if not class_details:
                return {"error": "Class not found or unauthorized"}
            
            # Mark class as cancelled (add to cancellations table)
            cursor.execute("""
                INSERT INTO class_cancellations 
                (class_schedule_id, cancelled_by, cancellation_reason, cancelled_at, notification_sent)
                VALUES (%s, %s, %s, NOW(), FALSE)
            """, (class_id, faculty_id, reason))
            
            cancellation_id = cursor.lastrowid
            
            # Mark room as free for this slot
            if class_details['room_id']:
                cursor.execute("""
                    UPDATE class_schedule 
                    SET room_id = NULL, is_active = FALSE 
                    WHERE id = %s
                """, (class_id,))
            
            # Get affected students
            cursor.execute("""
                SELECT u.id, u.email, u.first_name, u.last_name, u.fcm_token
                FROM users u
                WHERE u.role = 'student' 
                AND u.department_id = (SELECT department_id FROM subjects WHERE id = %s)
            """, (class_details['subject_id'],))
            
            affected_students = cursor.fetchall()
            
            # Create notifications for students
            notification_message = f"""
            🚨 Class Cancelled: {class_details['subject_name']} ({class_details['subject_code']})
            📅 {class_details['day_of_week'].title()} {class_details['start_time']} - {class_details['end_time']}
            🏫 Room: {class_details['room_number'] or 'TBD'}
            👨‍🏫 Faculty: {class_details['faculty_name']}
            📝 Reason: {reason or 'Not specified'}
            """
            
            for student in affected_students:
                cursor.execute("""
                    INSERT INTO notifications 
                    (user_id, title, message, type, is_read, action_url, created_at)
                    VALUES (%s, %s, %s, 'class_cancelled', FALSE, '/timetable', NOW())
                """, (
                    student['id'], 
                    f"Class Cancelled - {class_details['subject_name']}", 
                    notification_message
                ))
            
            # Mark room as available for booking
            if class_details['room_id']:
                cursor.execute("""
                    INSERT INTO available_rooms_log 
                    (room_id, available_from, available_until, reason, created_at)
                    VALUES (%s, %s, %s, 'class_cancelled', NOW())
                """, (
                    class_details['room_id'],
                    f"{class_details['day_of_week']} {class_details['start_time']}",
                    f"{class_details['day_of_week']} {class_details['end_time']}",
                ))
            
            connection.commit()
            
            return {
                "success": True,
                "cancellation_id": cancellation_id,
                "class_details": class_details,
                "affected_students": len(affected_students),
                "room_freed": class_details['room_id'] is not None,
                "notifications_sent": len(affected_students)
            }
            
        except mysql.connector.Error as e:
            connection.rollback()
            return {"error": f"Database error: {str(e)}"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    def find_free_classrooms(self, day: str = None, time_slot: str = None) -> List[Dict]:
        """
        Find currently free classrooms for student use
        """
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            current_day = day or datetime.now().strftime('%A').lower()
            current_time = time_slot or datetime.now().strftime('%H:%M')
            
            # Get all rooms
            cursor.execute("""
                SELECT r.*, rt.type_name, rt.capacity, rt.facilities
                FROM rooms r
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.is_active = TRUE
            """)
            all_rooms = cursor.fetchall()
            
            free_rooms = []
            
            for room in all_rooms:
                # Check if room is occupied in current time slot
                cursor.execute("""
                    SELECT COUNT(*) as occupied
                    FROM class_schedule cs
                    WHERE cs.room_id = %s 
                    AND cs.day_of_week = %s
                    AND cs.start_time <= %s 
                    AND cs.end_time > %s
                    AND cs.is_active = TRUE
                """, (room['id'], current_day, current_time, current_time))
                
                result = cursor.fetchone()
                
                if result['occupied'] == 0:
                    # Check for room bookings
                    cursor.execute("""
                        SELECT COUNT(*) as booked
                        FROM room_bookings rb
                        WHERE rb.room_id = %s 
                        AND rb.booking_date = CURDATE()
                        AND rb.start_time <= %s 
                        AND rb.end_time > %s
                        AND rb.status = 'confirmed'
                    """, (room['id'], current_time, current_time))
                    
                    booking_result = cursor.fetchone()
                    
                    if booking_result['booked'] == 0:
                        # Get next scheduled class
                        cursor.execute("""
                            SELECT MIN(start_time) as next_class
                            FROM class_schedule
                            WHERE room_id = %s 
                            AND day_of_week = %s
                            AND start_time > %s
                            AND is_active = TRUE
                        """, (room['id'], current_day, current_time))
                        
                        next_class = cursor.fetchone()
                        
                        free_rooms.append({
                            "room_id": room['id'],
                            "room_number": room['room_number'],
                            "room_name": room['room_name'],
                            "location": room['location'],
                            "capacity": room['capacity'],
                            "type": room['type_name'],
                            "facilities": room['facilities'],
                            "free_until": next_class['next_class'] or "End of day",
                            "available_duration": self._calculate_free_duration(
                                current_time, next_class['next_class']
                            )
                        })
            
            return {
                "current_time": current_time,
                "current_day": current_day,
                "free_rooms": free_rooms,
                "total_free": len(free_rooms)
            }
            
        except mysql.connector.Error as e:
            return {"error": f"Database error: {str(e)}"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    def book_resource(self, user_id: int, resource_type: str, resource_id: int, 
                     date: str, start_time: str, end_time: str, purpose: str) -> Dict:
        """
        Smart resource booking with conflict resolution
        """
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Check for conflicts
            conflicts = self._check_resource_conflicts(
                resource_type, resource_id, date, start_time, end_time
            )
            
            if conflicts:
                # Suggest alternative times/resources
                alternatives = self._suggest_alternatives(
                    resource_type, resource_id, date, start_time, end_time
                )
                
                return {
                    "success": False,
                    "conflicts": conflicts,
                    "alternatives": alternatives
                }
            
            # Proceed with booking
            table_name = self._get_booking_table(resource_type)
            column_name = self._get_resource_column(resource_type)
            
            cursor.execute(f"""
                INSERT INTO {table_name} 
                (user_id, {column_name}, booking_date, start_time, end_time, purpose, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'confirmed', NOW())
            """, (user_id, resource_id, date, start_time, end_time, purpose))
            
            booking_id = cursor.lastrowid
            
            # Send confirmation notification
            cursor.execute("""
                INSERT INTO notifications 
                (user_id, title, message, type, is_read, created_at)
                VALUES (%s, %s, %s, 'booking_confirmed', FALSE, NOW())
            """, (
                user_id,
                f"{resource_type.title()} Booking Confirmed",
                f"Your {resource_type} booking for {date} {start_time}-{end_time} has been confirmed."
            ))
            
            connection.commit()
            
            return {
                "success": True,
                "booking_id": booking_id,
                "message": "Resource booked successfully"
            }
            
        except mysql.connector.Error as e:
            connection.rollback()
            return {"error": f"Database error: {str(e)}"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    def detect_event_conflicts(self, event_date: str, start_time: str, end_time: str, 
                              venue_id: int = None) -> Dict:
        """
        Detect scheduling conflicts for events and suggest alternatives
        """
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            conflicts = []
            
            # Check for existing events
            cursor.execute("""
                SELECT e.*, c.name as club_name, u.first_name, u.last_name
                FROM events e
                LEFT JOIN clubs c ON e.club_id = c.id
                LEFT JOIN users u ON e.organized_by = u.id
                WHERE e.event_date = %s 
                AND ((e.start_time <= %s AND e.end_time > %s) 
                     OR (e.start_time < %s AND e.end_time >= %s)
                     OR (e.start_time >= %s AND e.end_time <= %s))
                AND e.is_active = TRUE
            """, (event_date, start_time, start_time, end_time, end_time, start_time, end_time))
            
            existing_events = cursor.fetchall()
            
            for event in existing_events:
                conflicts.append({
                    "type": "event_conflict",
                    "event_title": event['title'],
                    "club_name": event['club_name'],
                    "organizer": f"{event['first_name']} {event['last_name']}",
                    "time": f"{event['start_time']} - {event['end_time']}",
                    "location": event['location']
                })
            
            # Check venue conflicts if venue specified
            if venue_id:
                cursor.execute("""
                    SELECT COUNT(*) as venue_conflicts
                    FROM room_bookings rb
                    WHERE rb.room_id = %s 
                    AND rb.booking_date = %s
                    AND ((rb.start_time <= %s AND rb.end_time > %s) 
                         OR (rb.start_time < %s AND rb.end_time >= %s)
                         OR (rb.start_time >= %s AND rb.end_time <= %s))
                    AND rb.status = 'confirmed'
                """, (venue_id, event_date, start_time, start_time, end_time, end_time, start_time, end_time))
                
                venue_conflict = cursor.fetchone()
                if venue_conflict['venue_conflicts'] > 0:
                    conflicts.append({
                        "type": "venue_conflict",
                        "message": "Venue is already booked for this time"
                    })
            
            # Suggest alternative dates if conflicts exist
            alternatives = []
            if conflicts:
                alternatives = self._suggest_alternative_dates(event_date, start_time, end_time)
            
            return {
                "has_conflicts": len(conflicts) > 0,
                "conflicts": conflicts,
                "alternatives": alternatives
            }
            
        except mysql.connector.Error as e:
            return {"error": f"Database error: {str(e)}"}
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    # Helper methods
    def _calculate_duration(self, start_time: str, end_time: str) -> int:
        """Calculate duration in minutes"""
        start = datetime.strptime(start_time, '%H:%M')
        end = datetime.strptime(end_time, '%H:%M')
        return int((end - start).total_seconds() / 60)
    
    def _is_slot_occupied(self, day: str, start_time: str, end_time: str, busy_slots: List) -> bool:
        """Check if a time slot is occupied"""
        for slot in busy_slots:
            if (slot['day_of_week'] == day and 
                ((slot['start_time'] <= start_time and slot['end_time'] > start_time) or
                 (slot['start_time'] < end_time and slot['end_time'] >= end_time) or
                 (slot['start_time'] >= start_time and slot['end_time'] <= end_time))):
                return True
        return False
    
    def _get_available_rooms(self, day: str, start_time: str, end_time: str) -> List[Dict]:
        """Get list of available rooms for given time slot"""
        try:
            connection = get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT r.id, r.room_number, r.room_name, r.capacity
                FROM rooms r
                WHERE r.id NOT IN (
                    SELECT DISTINCT cs.room_id 
                    FROM class_schedule cs 
                    WHERE cs.day_of_week = %s 
                    AND cs.start_time < %s 
                    AND cs.end_time > %s
                    AND cs.room_id IS NOT NULL
                    AND cs.is_active = TRUE
                )
                AND r.is_active = TRUE
            """, (day, end_time, start_time))
            
            return cursor.fetchall()
            
        except mysql.connector.Error:
            return []
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    def _calculate_preference_score(self, suggested_day: str, suggested_time: str, 
                                   original_day: str, original_time: str) -> int:
        """Calculate preference score for suggested slot"""
        score = 100
        
        # Same day preference
        if suggested_day == original_day:
            score += 50
        
        # Time proximity preference
        orig_hour = int(original_time.split(':')[0])
        sugg_hour = int(suggested_time.split(':')[0])
        time_diff = abs(orig_hour - sugg_hour)
        score -= time_diff * 5
        
        # Avoid early morning and late afternoon
        if sugg_hour < 9 or sugg_hour > 16:
            score -= 20
        
        # Prefer morning slots
        if 9 <= sugg_hour <= 12:
            score += 10
        
        return max(0, score)
    
    def _get_suggestion_reason(self, day: str, time: str, score: int) -> str:
        """Generate human-readable reason for suggestion"""
        reasons = []
        
        hour = int(time.split(':')[0])
        
        if score > 130:
            reasons.append("Excellent match - same day")
        elif score > 100:
            reasons.append("Good alternative")
        else:
            reasons.append("Available option")
        
        if 9 <= hour <= 12:
            reasons.append("morning slot (preferred)")
        elif 13 <= hour <= 16:
            reasons.append("afternoon slot")
        else:
            reasons.append("off-peak hours")
        
        return f"{reasons[0]} - {reasons[1]}"
    
    def _calculate_free_duration(self, current_time: str, next_class_time: str) -> str:
        """Calculate how long a room is free"""
        if not next_class_time:
            return "Until end of day"
        
        current = datetime.strptime(current_time, '%H:%M')
        next_class = datetime.strptime(str(next_class_time), '%H:%M:%S')
        
        duration = next_class - current
        hours = duration.seconds // 3600
        minutes = (duration.seconds % 3600) // 60
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    
    def _check_resource_conflicts(self, resource_type: str, resource_id: int,
                                 date: str, start_time: str, end_time: str) -> List[Dict]:
        """Check for resource booking conflicts"""
        # Implementation would check specific resource availability
        return []
    
    def _suggest_alternatives(self, resource_type: str, resource_id: int,
                            date: str, start_time: str, end_time: str) -> List[Dict]:
        """Suggest alternative slots/resources"""
        # Implementation would suggest alternatives
        return []
    
    def _get_booking_table(self, resource_type: str) -> str:
        """Get appropriate booking table name"""
        mapping = {
            "room": "room_bookings",
            "lab": "lab_bookings", 
            "equipment": "equipment_bookings"
        }
        return mapping.get(resource_type, "room_bookings")
    
    def _get_resource_column(self, resource_type: str) -> str:
        """Get appropriate resource column name"""
        mapping = {
            "room": "room_id",
            "lab": "lab_id",
            "equipment": "equipment_id"
        }
        return mapping.get(resource_type, "room_id")
    
    def _suggest_alternative_dates(self, original_date: str, start_time: str, end_time: str) -> List[Dict]:
        """Suggest alternative dates for events"""
        alternatives = []
        original = datetime.strptime(original_date, '%Y-%m-%d')
        
        # Suggest next 7 days
        for i in range(1, 8):
            alt_date = original + timedelta(days=i)
            if alt_date.weekday() < 5:  # Weekdays only
                alternatives.append({
                    "date": alt_date.strftime('%Y-%m-%d'),
                    "day": alt_date.strftime('%A'),
                    "time": f"{start_time} - {end_time}",
                    "reason": f"Next available {alt_date.strftime('%A')}"
                })
        
        return alternatives

# Global instance
ai_scheduler = AIScheduler()
