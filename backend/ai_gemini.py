from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional, List, Dict
import os, json, base64
import requests
import time
import mysql.connector

import auth
from database import get_mysql_connection

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_VERSION = os.getenv("GEMINI_API_VERSION", "v1alpha")

router = APIRouter()

import re

def is_lunch_or_break(subject: str) -> bool:
    """Check if the subject is a lunch break or recess"""
    if not subject:
        return False
    subject_lower = subject.lower().strip()
    break_keywords = ['lunch', 'break', 'recess', 'interval', 'free', 'gap', 'tiffin', 'meal']
    return any(keyword in subject_lower for keyword in break_keywords)

def is_lunch_time(start_time: str, end_time: str) -> bool:
    """Check if the time slot is during typical lunch hours (12:00-14:30)"""
    try:
        start_parts = start_time.split(':')
        end_parts = end_time.split(':')
        start_hour = int(start_parts[0])
        start_min = int(start_parts[1])
        end_hour = int(end_parts[0])
        end_min = int(end_parts[1])
        
        # Convert to minutes for easier comparison
        start_minutes = start_hour * 60 + start_min
        end_minutes = end_hour * 60 + end_min
        
        # Lunch time: 12:00 PM (720 min) to 2:30 PM (870 min)
        lunch_start = 12 * 60  # 12:00 PM
        lunch_end = 14 * 60 + 30  # 2:30 PM
        
        # Check if this time slot overlaps with lunch time
        return (start_minutes >= lunch_start and start_minutes < lunch_end) or \
               (end_minutes > lunch_start and end_minutes <= lunch_end) or \
               (start_minutes <= lunch_start and end_minutes >= lunch_end)
    except (ValueError, IndexError):
        return False

def normalize_time_24h(time_str: str) -> str:
    """Ensure time is in proper 24-hour format and fix common AM/PM misinterpretations"""
    if not time_str:
        return time_str
    
    # Clean up the input string
    time_str = time_str.strip().upper()
    
    # Handle explicit AM/PM cases first
    if 'AM' in time_str or 'PM' in time_str:
        return convert_ampm_to_24h(time_str)
    
    # Handle pure numeric format
    time_parts = time_str.split(':')
    if len(time_parts) < 2:
        # Handle single digit hour (e.g., "9" -> "09:00")
        try:
            single_hour = int(time_str)
            if single_hour >= 1 and single_hour <= 12:
                # Assume morning hours for single digits in academic context
                return f"{single_hour:02d}:00"
            elif single_hour >= 13 and single_hour <= 18:
                return f"{single_hour:02d}:00"
        except ValueError:
            pass
        return time_str
        
    try:
        hour = int(time_parts[0])
        minute = int(time_parts[1]) if len(time_parts) > 1 else 0
        
        # Fix common OCR/AI misinterpretations where evening times are used for morning lectures
        # In academic timetables, lectures typically happen 7 AM - 6 PM (07:00 - 18:00)
        
        # Direct fixes for common misinterpretations
        if hour == 21:  # 21:00 (9 PM) -> 09:00 (9 AM)
            hour = 9
        elif hour == 22:  # 22:00 (10 PM) -> 10:00 (10 AM)  
            hour = 10
        elif hour == 23:  # 23:00 (11 PM) -> 11:00 (11 AM)
            hour = 11
        elif hour == 20:  # 20:00 (8 PM) -> 08:00 (8 AM)
            hour = 8
        elif hour == 19:  # 19:00 (7 PM) -> 07:00 (7 AM) - less common but possible
            hour = 7
        elif hour > 18 and hour <= 23:  # Any other evening time that seems like morning
            # For academic schedules, evening times (19-23) are likely morning times (7-11)
            potential_morning = hour - 12
            if potential_morning >= 7 and potential_morning <= 11:
                hour = potential_morning
        
        # Handle edge cases for very early hours (might be afternoon in 12-hour format)
        if hour >= 1 and hour <= 6:
            # In academic context, 1-6 could be 1 PM - 6 PM (13-18 in 24h)
            # We'll assume afternoon if it's a typical lecture time
            if minute == 0 or minute == 30:  # Common academic time slots
                hour = hour + 12  # Convert to afternoon
        
        # Ensure hour is in valid range
        hour = max(0, min(23, hour))
        minute = max(0, min(59, minute))
        
        return f"{hour:02d}:{minute:02d}"
    except ValueError:
        return time_str

def convert_ampm_to_24h(time_str: str) -> str:
    """Convert AM/PM time to 24-hour format"""
    time_str = time_str.strip().upper()
    is_pm = 'PM' in time_str
    is_am = 'AM' in time_str
    
    # Remove AM/PM and clean
    clean_time = time_str.replace('AM', '').replace('PM', '').strip()
    
    try:
        if ':' in clean_time:
            hour, minute = map(int, clean_time.split(':'))
        else:
            hour = int(clean_time)
            minute = 0
        
        # Convert to 24-hour format
        if is_pm and hour != 12:
            hour += 12
        elif is_am and hour == 12:
            hour = 0
        
        return f"{hour:02d}:{minute:02d}"
    except ValueError:
        return time_str

def process_consecutive_lectures(rows: List[dict]) -> List[dict]:
    """Process the timetable data to ensure consecutive lectures of the same subject are preserved"""
    if not rows:
        return rows
    
    # First, clean and normalize the data
    processed_rows = []
    
    for row in rows:
        # Clean up the row data
        clean_row = {}
        clean_row["day_of_week"] = (row.get("day_of_week", "") or row.get("day", "")).strip().capitalize()
        clean_row["start_time"] = normalize_time_24h((row.get("start_time", "") or "").strip())
        clean_row["end_time"] = normalize_time_24h((row.get("end_time", "") or "").strip())
        clean_row["subject"] = (row.get("subject", "") or row.get("course", "")).strip()
        clean_row["room"] = row.get("room") or row.get("venue")
        clean_row["faculty"] = row.get("faculty") or row.get("teacher")
        
        # Skip empty or invalid entries
        if not all([clean_row["day_of_week"], clean_row["start_time"], 
                   clean_row["end_time"], clean_row["subject"]]):
            continue
            
        # Skip lunch breaks and recess periods
        if is_lunch_or_break(clean_row["subject"]):
            continue
            
        # Skip if it's during lunch time and subject suggests it's a break
        if is_lunch_time(clean_row["start_time"], clean_row["end_time"]) and len(clean_row["subject"].strip()) < 3:
            continue
            
        processed_rows.append(clean_row)
    
    # Sort by day and time to ensure proper ordering
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    processed_rows.sort(key=lambda x: (
        day_order.index(x["day_of_week"]) if x["day_of_week"] in day_order else 7,
        x["start_time"]
    ))
    
    return processed_rows

def _extract_json_from_text(text: str) -> str | None:
    if not text:
        return None
    # Try to find a JSON array first
    try:
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1 and end > start:
            candidate = text[start:end+1].strip()
            return candidate
    except Exception:
        pass
    # Try object
    try:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            candidate = text[start:end+1].strip()
            return candidate
    except Exception:
        pass
    return None

def _gemini_generate(prompt: str, json_mode: bool = False, max_retries: int = 4) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    headers = {"Content-Type": "application/json"}
    system = "You are CampusConnect AI, a helpful assistant for a college portal. Be concise, factual, and role-aware."
    model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    ver = os.getenv("GEMINI_API_VERSION", GEMINI_API_VERSION)
    url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent?key={GEMINI_API_KEY}"

    attempt = 0
    backoff = 1.0
    while True:
        attempt += 1
        final_prompt = prompt
        if json_mode:
            final_prompt = prompt + "\nReturn ONLY valid JSON (no commentary), strictly parseable."
        if str(ver).startswith("v1alpha"):
            # v1alpha requires role and snake_case
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": system},
                            {"text": final_prompt}
                        ]
                    }
                ]
            }
        else:
            # v1beta style, camelCase, no role required
            payload = {
                "contents": [
                    {"parts": [{"text": system}]},
                    {"parts": [{"text": final_prompt}]}
                ]
            }
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                return json.dumps(data)
        if resp.status_code in (429, 500, 503) or 'UNAVAILABLE' in resp.text or 'overloaded' in resp.text.lower():
            if attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
                continue
        raise HTTPException(status_code=500, detail=f"Gemini error: {resp.text[:500]}")

def _gemini_ocr_image_to_json(image_bytes: bytes, prompt: str, mime_type: str = "image/png", max_retries: int = 4) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    headers = {"Content-Type": "application/json"}
    system = "You are CampusConnect AI, a helpful assistant for a college portal. Extract structured data as valid JSON."
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    ver = os.getenv("GEMINI_API_VERSION", GEMINI_API_VERSION)
    url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent?key={GEMINI_API_KEY}"

    attempt = 0
    backoff = 1.0
    while True:
        attempt += 1
        instruction = (
            prompt + "\nReturn ONLY valid JSON (object or array). Do not include any text outside JSON."
        )
        if str(ver).startswith("v1alpha"):
            # v1alpha: role required, snake_case inline_data
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": system},
                            {"inline_data": {"mime_type": mime_type or "image/png", "data": b64}},
                            {"text": instruction}
                        ]
                    }
                ]
            }
        else:
            # v1beta: camelCase inlineData, no role required
            payload = {
                "contents": [
                    {"parts": [{"text": system}]},
                    {"parts": [
                        {"inlineData": {"mimeType": mime_type or "image/png", "data": b64}},
                        {"text": instruction}
                    ]}
                ]
            }
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                return json.dumps(data)
        if resp.status_code in (429, 500, 503) or 'UNAVAILABLE' in resp.text or 'overloaded' in resp.text.lower():
            if attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
                continue
        raise HTTPException(status_code=503, detail=f"Gemini OCR error: {resp.text[:500]}")

@router.post("/ai/chat")
async def ai_chat(payload: dict, current_user = Depends(auth.get_current_user)):
    """Enhanced chatbot that can answer questions about campus, events, clubs, canteen, and more."""
    message = (payload or {}).get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    
    role = current_user.get("role", "user")
    name = current_user.get("full_name", "User")
    user_id = current_user.get("id")
    
    # Gather relevant context from the database
    context_data = {}
    
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get clubs/organizations info
        try:
            cursor.execute("""
                SELECT id, name, description, category, member_count 
                FROM clubs WHERE is_active = TRUE 
                LIMIT 20
            """)
            context_data["clubs"] = cursor.fetchall() or []
        except:
            context_data["clubs"] = []
        
        # Get upcoming events
        try:
            cursor.execute("""
                SELECT ce.id, ce.title, ce.description, ce.event_date, ce.start_time, 
                       ce.venue, ce.event_type, c.name as club_name
                FROM club_events ce
                LEFT JOIN clubs c ON ce.club_id = c.id
                WHERE ce.status = 'approved' AND ce.event_date >= CURDATE()
                ORDER BY ce.event_date ASC
                LIMIT 10
            """)
            context_data["events"] = cursor.fetchall() or []
        except:
            context_data["events"] = []
        
        # Get canteen menu if available
        try:
            cursor.execute("""
                SELECT id, name, description, price, category, is_available
                FROM canteen_menu
                WHERE is_available = TRUE
                LIMIT 15
            """)
            context_data["canteen_menu"] = cursor.fetchall() or []
        except:
            context_data["canteen_menu"] = []
        
        # Get user's interests if student
        if role == "student":
            try:
                cursor.execute("""
                    SELECT category FROM user_interest_categories 
                    WHERE user_id = %s
                """, (user_id,))
                context_data["user_interests"] = [r["category"] for r in cursor.fetchall() or []]
            except:
                context_data["user_interests"] = []
        
        # Get user's club memberships
        try:
            cursor.execute("""
                SELECT c.name, cm.role, cm.status
                FROM club_memberships cm
                JOIN clubs c ON cm.club_id = c.id
                WHERE cm.user_id = %s AND cm.status = 'approved'
            """, (user_id,))
            context_data["user_clubs"] = cursor.fetchall() or []
        except:
            context_data["user_clubs"] = []
        
        # Get available facilities/rooms
        try:
            cursor.execute("""
                SELECT room_name, capacity, facilities
                FROM rooms
                WHERE is_available = TRUE
                LIMIT 10
            """)
            context_data["rooms"] = cursor.fetchall() or []
        except:
            context_data["rooms"] = []
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Error gathering context: {e}")
        context_data = {}
    
    # Build a comprehensive prompt with context
    context_str = f"""
You are CampusConnect AI Assistant, a helpful and knowledgeable assistant for a college campus portal.

USER INFORMATION:
- Name: {name}
- Role: {role}
- User ID: {user_id}

AVAILABLE CAMPUS DATA:
"""
    
    if context_data.get("clubs"):
        context_str += f"\nAVAILABLE CLUBS/ORGANIZATIONS ({len(context_data['clubs'])}):\n"
        for club in context_data["clubs"][:10]:
            context_str += f"- {club.get('name')}: {club.get('description', 'No description')[:100]} (Category: {club.get('category', 'N/A')})\n"
    
    if context_data.get("events"):
        context_str += f"\nUPCOMING EVENTS ({len(context_data['events'])}):\n"
        for event in context_data["events"][:8]:
            context_str += f"- {event.get('title')} on {event.get('event_date')} at {event.get('venue')} (by {event.get('club_name', 'Campus')})\n"
    
    if context_data.get("canteen_menu"):
        context_str += f"\nCANTEEN MENU ITEMS ({len(context_data['canteen_menu'])}):\n"
        for item in context_data["canteen_menu"][:10]:
            context_str += f"- {item.get('name')}: ₹{item.get('price')} ({item.get('category', 'Food')})\n"
    
    if context_data.get("user_clubs"):
        context_str += f"\nUSER'S CLUB MEMBERSHIPS:\n"
        for club in context_data["user_clubs"]:
            context_str += f"- {club.get('name')} (Role: {club.get('role', 'Member')})\n"
    
    if context_data.get("user_interests"):
        context_str += f"\nUSER'S INTERESTS: {', '.join(context_data['user_interests'])}\n"
    
    if context_data.get("rooms"):
        context_str += f"\nAVAILABLE ROOMS/FACILITIES:\n"
        for room in context_data["rooms"][:5]:
            context_str += f"- {room.get('room_name')} (Capacity: {room.get('capacity', 'N/A')})\n"
    
    context_str += f"""

CAPABILITIES YOU HAVE:
1. Answer questions about clubs, organizations, and how to join them
2. Provide information about upcoming events and activities
3. Help with canteen menu and food options
4. Guide users on booking rooms and facilities
5. Assist with student networking and skill development
6. Provide information about campus resources and services
7. Help with timetables, schedules, and planning
8. Answer general campus-related questions

USER'S QUESTION: {message}

INSTRUCTIONS:
- Be helpful, friendly, and concise
- Use the context data provided above to give accurate, specific answers
- If the question is about events, clubs, canteen, or rooms, reference the actual data
- If asked about joining clubs, explain the membership process
- If asked about events, mention specific upcoming events from the data
- If you don't have specific information, provide general helpful guidance
- Keep responses under 200 words unless more detail is specifically requested
- Format your response in a clear, readable way

YOUR RESPONSE:"""
    
    try:
        answer = _gemini_generate(context_str, json_mode=False)
        return {
            "role": role,
            "answer": answer,
            "context_provided": bool(context_data),
            "data_sources": list(context_data.keys())
        }
    except Exception as e:
        # Fallback response if AI fails
        return {
            "role": role,
            "answer": "I'm here to help! I can answer questions about campus clubs, events, the canteen menu, room bookings, and more. What would you like to know?",
            "error": str(e)
        }

@router.post("/ai/ocr")
async def generic_ocr(type: Optional[str] = None, file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    """Generic OCR endpoint using Gemini. Returns structured JSON, no DB writes.
    type can be: 'menu', 'timetable', 'events', 'planner'."""
    img = await file.read()
    instruction = (
        "Extract structured data as a JSON object. If type is 'menu', return an array of items with fields: name (string), price (number), category (string, e.g., snacks/main/beverages), is_vegetarian (boolean, best-effort)."
        " For 'timetable', return an array of entries with subject, date, day_of_week, start_time, end_time, room, faculty."
        " For 'events', return an array with title, date, start_time, end_time, venue."
        " For 'planner', return an object with months as keys and important_dates: [ {date, title} ]."
    )
    if type:
        instruction = f"You are parsing a {type} image. " + instruction
    text = _gemini_ocr_image_to_json(img, instruction, getattr(file, 'content_type', 'image/png'))
    try:
        return json.loads(text)
    except Exception:
        return {"raw": text}

@router.post("/ai/club-recommendations")
async def ai_club_recommendations(payload: dict = {}, current_user = Depends(auth.get_current_user)):
    """Return club/org recommendations. Falls back to DB-only scoring if GEMINI_API_KEY is missing."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        # Gather user's interests
        interests = []
        try:
            cursor.execute(
                "SELECT category FROM user_interest_categories WHERE user_id = %s",
                (current_user["id"],)
            )
            interests = [r["category"] for r in cursor.fetchall() or []]
        except Exception:
            interests = []
        # Get clubs or organizations list for the user's college
        def table_exists(t):
            cursor.execute("SHOW TABLES LIKE %s", (t,))
            return cursor.fetchone() is not None
        items = []
        if table_exists("clubs"):
            cursor.execute("SELECT id, name, description, category FROM clubs WHERE is_active = TRUE")
            items = cursor.fetchall() or []
        else:
            cursor.execute("SHOW COLUMNS FROM organization_details")
            cols = {c["Field"] for c in cursor.fetchall()}
            name_col = "organization_name" if "organization_name" in cols else ("name" if "name" in cols else "id")
            cat_col = "organization_type" if "organization_type" in cols else "category" if "category" in cols else None
            cursor.execute(f"SELECT id, {name_col} AS name, {cat_col} AS category FROM organization_details")
            items = cursor.fetchall() or []

        # Helper: simple fallback recommender
        def fallback_recommendations():
            lower_interests = [i.lower() for i in interests]
            scored = []
            for it in items:
                cat = (it.get('category') or '').lower()
                name = (it.get('name') or '').lower()
                desc = (it.get('description') or '')[:50] + ('...' if len(it.get('description') or '') > 50 else '')
                
                match = any(i in cat or i in name for i in lower_interests) if lower_interests else False
                score = 85 if match else 60
                
                # Create meaningful reason text using actual club data
                club_name = it.get('name') or f"Club #{it.get('id')}"
                if match:
                    matching_interest = next((i for i in lower_interests if i in cat or i in name), '')
                    reason = f"{club_name} - Matches your interest in {matching_interest}"
                else:
                    if desc:
                        reason = f"{club_name} - {desc}"
                    elif cat:
                        reason = f"{club_name} - {cat.title()} club with high activity"
                    else:
                        reason = f"{club_name} - Popular club on campus"
                
                scored.append({
                    'id': it.get('id'),
                    'name': club_name,
                    'score': score,
                    'reason': reason
                })
            scored.sort(key=lambda x: x['score'], reverse=True)
            return scored[:6]

        recommendations = []
        use_gemini = bool(GEMINI_API_KEY)
        if use_gemini:
            interests_str = ", ".join(interests) if interests else "(none)"
            clubs_summary = "\n".join([
                f"- id:{i['id']} name:{i.get('name')} category:{i.get('category','')}" for i in items
            ])
            prompt = (
                "You are recommending campus clubs to a student.\n"
                f"Student interests: {interests_str}\n"
                "Here are available clubs/organizations (id, name, category):\n"
                f"{clubs_summary}\n\n"
                "Return a JSON array of up to 6 recommendations, each with id, score (0-100), and reason."
            )
            try:
                result = _gemini_generate(prompt, json_mode=True)
                parsed = json.loads(result)
                if isinstance(parsed, list):
                    recommendations = parsed
                else:
                    recommendations = fallback_recommendations()
            except Exception:
                # Any error from Gemini -> fallback
                recommendations = fallback_recommendations()
        else:
            recommendations = fallback_recommendations()

        return {"interests": interests, "recommendations": recommendations}
    finally:
        if 'cursor' in locals():
            try: cursor.close()
            except Exception: pass
        if 'connection' in locals():
            try: connection.close()
            except Exception: pass

@router.post("/timetable/upload")
async def upload_timetable(file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    """Upload a timetable image/PDF and save parsed entries for the current student or faculty.
    Clears previous custom entries for that user and inserts new ones.
    Generates notifications for each lecture in the timetable."""
    if current_user.get("role") not in ["student", "faculty"]:
        raise HTTPException(status_code=403, detail="Only students and faculty can upload timetables")
    img = await file.read()
    instruction = (
        "Extract timetable as JSON array. Each entry: {day_of_week (e.g., Monday), start_time (HH:MM in 24-hour format), end_time (HH:MM in 24-hour format), subject, room (optional), faculty (optional)}."
        " CRITICAL TIME FORMAT INSTRUCTIONS:"
        " 1. Academic timetables use MORNING and AFTERNOON times, NOT evening times"
        " 2. Morning lectures (8 AM - 12 PM) = 08:00 - 12:00 in 24-hour format"
        " 3. Afternoon lectures (1 PM - 6 PM) = 13:00 - 18:00 in 24-hour format"
        " 4. NEVER use 19:00-23:00 (7 PM-11 PM) for academic lectures - these should be converted to morning times"
        " 5. Examples: '9 AM' = 09:00, '10 AM' = 10:00, '2 PM' = 14:00, '3 PM' = 15:00"
        " 6. If you see times like 21:00, 22:00, 23:00 - these are WRONG and should be 09:00, 10:00, 11:00"
        " 7. Skip entries that are clearly lunch breaks, recess, or break times"
        " 8. If the same subject appears in consecutive time slots, include it in BOTH slots"
        " 9. Only include actual lecture/class subjects, not 'LUNCH', 'BREAK', 'RECESS'"
        " Ensure day_of_week is a valid weekday string. Return ONLY a JSON array (no commentary)."
    )
    try:
        raw_text = _gemini_ocr_image_to_json(img, instruction, getattr(file, 'content_type', 'image/png'))
        # Try direct parse
        try:
            rows = json.loads(raw_text)
        except Exception:
            candidate = _extract_json_from_text(raw_text)
            if not candidate:
                raise ValueError("model did not return JSON")
            rows = json.loads(candidate)
        if not isinstance(rows, list):
            raise ValueError("OCR did not return a JSON array")
            
        # Process consecutive lectures and improve data quality
        rows = process_consecutive_lectures(rows)
    except HTTPException:
        # bubble up Gemini error as-is
        raise
    except Exception as e:
        # Include a small preview of model text for debugging
        preview = (raw_text[:150] + '...') if isinstance(raw_text, str) else ''
        raise HTTPException(status_code=400, detail=f"Failed to parse OCR JSON: {e}. Preview: {preview}")

    # Persist to DB
    try:
        conn = get_mysql_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_timetable_entries (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              day_of_week VARCHAR(16) NOT NULL,
              start_time TIME NOT NULL,
              end_time TIME NOT NULL,
              subject VARCHAR(255) NOT NULL,
              room VARCHAR(100) NULL,
              faculty VARCHAR(100) NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_user_day (user_id, day_of_week, start_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        
        # Ensure notifications table exists
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              title VARCHAR(200) NOT NULL,
              message TEXT NOT NULL,
              type VARCHAR(50) NOT NULL DEFAULT 'lecture',
              is_read BOOLEAN NOT NULL DEFAULT FALSE,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              scheduled_for DATETIME NULL,
              INDEX idx_user_id (user_id),
              INDEX idx_scheduled_for (scheduled_for)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        
        # clear previous
        cur.execute("DELETE FROM user_timetable_entries WHERE user_id = %s", (current_user["id"],))
        inserted = 0
        notifications_created = 0
        

        
        def as_time(s: str) -> str:
            s = (s or "").strip()
            # Log original time for debugging
            print(f"DEBUG: Original time input: '{s}'")
            normalized = normalize_time_24h(s)
            print(f"DEBUG: Normalized time: '{normalized}'")
            if len(normalized) == 5 and normalized.count(":") == 1:
                result = normalized + ":00"
                print(f"DEBUG: Final time result: '{result}'")
                return result
            print(f"DEBUG: Final time result (no seconds): '{normalized}'")
            return normalized
            

            

            
        for r in rows:
            try:
                dow = (r.get("day_of_week") or r.get("day") or "").strip().capitalize()
                st = as_time(str(r.get("start_time") or ""))
                et = as_time(str(r.get("end_time") or ""))
                subject = (r.get("subject") or r.get("course") or "").strip()
                room = (r.get("room") or r.get("venue") or None)
                faculty = (r.get("faculty") or r.get("teacher") or None)
                
                # Skip if essential fields are missing
                if not (dow and st and et and subject):
                    continue
                    
                # Skip lunch breaks and recess periods
                if is_lunch_or_break(subject):
                    continue
                    
                # Skip if it's during lunch time and subject suggests it's a break
                if is_lunch_time(st, et) and (not subject or len(subject.strip()) < 3):
                    continue
                cur.execute(
                    """
                    INSERT INTO user_timetable_entries (user_id, day_of_week, start_time, end_time, subject, room, faculty)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (current_user["id"], dow, st, et, subject, room, faculty)
                )
                inserted += 1
                
                # Create notification for each lecture
                # Calculate next occurrence of this day of week
                cur.execute(
                    """
                    SELECT DATE_ADD(CURDATE(), 
                        INTERVAL MOD(WEEKDAY(%s) - WEEKDAY(CURDATE()) + 7, 7) DAY
                    ) as next_date
                    """, 
                    (dow,)
                )
                next_date_result = cur.fetchone()
                next_date = next_date_result['next_date'] if next_date_result else None
                
                if next_date:
                    # Format notification
                    location_info = f"Room: {room}" if room else "Room: TBD"
                    faculty_info = f"Faculty: {faculty}" if faculty else ""
                    
                    notification_title = f"Upcoming Lecture: {subject}"
                    notification_message = f"""
                    📚 {subject}
                    🕒 {st} - {et}
                    📅 {dow}
                    🏫 {location_info}
                    👨‍🏫 {faculty_info}
                    """
                    
                    # Calculate scheduled_for time (30 minutes before lecture)
                    cur.execute(
                        """
                        SELECT TIMESTAMP(
                            %s, 
                            SUBTIME(%s, '00:30:00')
                        ) as notification_time
                        """,
                        (next_date, st)
                    )
                    notification_time_result = cur.fetchone()
                    notification_time = notification_time_result['notification_time'] if notification_time_result else None
                    
                    if notification_time:
                        cur.execute(
                            """
                            INSERT INTO notifications 
                            (user_id, title, message, type, scheduled_for)
                            VALUES (%s, %s, %s, 'lecture', %s)
                            """,
                            (current_user["id"], notification_title, notification_message, notification_time)
                        )
                        notifications_created += 1
            except Exception as e:
                print(f"Error processing entry: {e}")
                continue
                
        conn.commit()
        return {"inserted": inserted, "notifications_created": notifications_created}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cur' in locals():
            try: cur.close()
            except Exception: pass
        if 'conn' in locals():
            try: conn.close()
            except Exception: pass

@router.post("/timetable/test-time-parsing")
async def test_time_parsing(time_data: dict, current_user = Depends(auth.get_current_user)):
    """Test endpoint to debug time parsing issues"""
    test_times = time_data.get("times", [])
    results = []
    
    for time_str in test_times:
        try:
            normalized = normalize_time_24h(str(time_str))
            results.append({
                "input": time_str,
                "output": normalized,
                "status": "success"
            })
        except Exception as e:
            results.append({
                "input": time_str,
                "output": None,
                "status": "error",
                "error": str(e)
            })
    
    return {"results": results}

@router.post("/ai/canteen/menu-ocr")
async def canteen_menu_ocr(file: UploadFile = File(...), replace: bool = True, current_user = Depends(auth.get_current_user)):
    """OCR a canteen menu image/PDF and upsert items into canteen_menu_items.
    Only admin/faculty can update the menu."""
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Only admin/faculty can update menu")
    
    # Validate file type
    allowed_types = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp',
        'application/pdf'
    ]
    content_type = getattr(file, 'content_type', 'image/png')
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {content_type}. Supported: images (JPG, PNG, etc.) and PDF"
        )
    
    file_content = await file.read()
    
    # Enhanced instruction for better menu extraction
    instruction = (
        "Extract all canteen/restaurant menu items from this image/document as a JSON array. "
        "For each food item, provide: "
        "name (string, the dish name), "
        "price (number, extract price in rupees/INR, convert if needed), "
        "category (string, classify as 'main', 'snacks', 'beverages', or 'desserts' based on the item), "
        "is_vegetarian (boolean, true if vegetarian/veg, false if non-veg/chicken/fish/meat). "
        "Only include actual food items with names and prices. "
        "Respond ONLY with JSON array, no other text."
    )
    
    text = _gemini_ocr_image_to_json(file_content, instruction, content_type)
    try:
        items = json.loads(text)
        if not isinstance(items, list):
            raise ValueError("Expected a list of items")
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse OCR output as JSON")

    # Persist to DB
    try:
        conn = get_mysql_connection()
        cur = conn.cursor(dictionary=True)
        # Ensure table exists
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS canteen_menu_items (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description VARCHAR(500) NULL,
              price DECIMAL(10,2) NOT NULL,
              category VARCHAR(50) NOT NULL,
              is_vegetarian TINYINT(1) NOT NULL DEFAULT 0,
              is_available TINYINT(1) NOT NULL DEFAULT 1,
              image_url VARCHAR(500) NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_category (category),
              INDEX idx_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        if replace:
            cur.execute("DELETE FROM canteen_menu_items")
        inserted = 0
        processed_items = []
        for it in items:
            name = str(it.get("name") or "").strip()
            if not name:
                continue
            price_val = it.get("price")
            try:
                price = float(price_val)
            except Exception:
                price = 0.0
            category = (it.get("category") or "snacks").lower()
            if category not in ["main","snacks","beverages","desserts","breakfast","dinner"]:
                category = "snacks"
            veg = 1 if str(it.get("is_vegetarian")).lower() in ["1","true","yes","veg","vegetarian"] else 0
            
            cur.execute(
                """
                INSERT INTO canteen_menu_items (name, description, price, category, is_vegetarian, is_available)
                VALUES (%s, %s, %s, %s, %s, 1)
                """,
                (name, it.get("description") or "", price, category, veg)
            )
            inserted += 1
            
            # Add to preview
            processed_items.append({
                "name": name,
                "price": price,
                "category": category,
                "is_vegetarian": bool(veg),
                "description": it.get("description") or ""
            })
            
        conn.commit()
        return {
            "items_inserted": inserted,
            "message": f"Successfully processed {inserted} menu items",
            "preview": processed_items[:10]  # Return first 10 items as preview
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cur' in locals():
            try: cur.close()
            except Exception: pass
        if 'conn' in locals():
            try: conn.close()
            except Exception: pass


@router.post("/ai/extract-calendar")
async def extract_calendar_from_file(
    file: UploadFile = File(...),
    current_user = Depends(auth.get_current_user)
):
    """
    Extract event calendar data from uploaded files (PDF, CSV, Excel, Images).
    Uses OCR for images/PDFs and parsing for structured data.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file extension
    filename = file.filename.lower()
    file_ext = os.path.splitext(filename)[1]
    
    allowed_extensions = ['.pdf', '.csv', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.txt']
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Handle different file types
        if file_ext == '.csv':
            # Parse CSV directly
            import csv
            import io
            csv_text = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_text))
            events = []
            
            for row in csv_reader:
                event = {
                    "title": row.get('title') or row.get('event_name') or row.get('name', ''),
                    "description": row.get('description') or row.get('details', ''),
                    "event_date": row.get('event_date') or row.get('date', ''),
                    "start_time": row.get('start_time') or row.get('time', ''),
                    "end_time": row.get('end_time', ''),
                    "venue": row.get('venue') or row.get('location') or row.get('place', ''),
                    "event_type": row.get('event_type') or row.get('type', 'other')
                }
                if event['title']:  # Only add if title exists
                    events.append(event)
            
            return {"events": events, "source": "csv_parse", "count": len(events)}
        
        elif file_ext in ['.xlsx', '.xls']:
            # Parse Excel file
            try:
                import pandas as pd
                import io
                df = pd.read_excel(io.BytesIO(content))
                events = []
                
                # Try to map common column names
                column_mapping = {
                    'title': ['title', 'event_name', 'name', 'event'],
                    'description': ['description', 'details', 'desc', 'about'],
                    'event_date': ['event_date', 'date', 'day'],
                    'start_time': ['start_time', 'time', 'start'],
                    'end_time': ['end_time', 'end'],
                    'venue': ['venue', 'location', 'place', 'room'],
                    'event_type': ['event_type', 'type', 'category']
                }
                
                # Find matching columns
                col_map = {}
                for key, possible_names in column_mapping.items():
                    for col in df.columns:
                        if col.lower() in possible_names:
                            col_map[key] = col
                            break
                
                # Extract events
                for _, row in df.iterrows():
                    event = {}
                    for key, col_name in col_map.items():
                        event[key] = str(row[col_name]) if pd.notna(row[col_name]) else ''
                    
                    if event.get('title'):
                        events.append(event)
                
                return {"events": events, "source": "excel_parse", "count": len(events)}
            except Exception as e:
                # If pandas fails, fall back to AI extraction
                print(f"Excel parsing failed: {e}, falling back to AI")
                pass
        
        # For PDFs, images, or if structured parsing failed, use AI extraction
        if file_ext in ['.pdf', '.jpg', '.jpeg', '.png'] or file_ext in ['.xlsx', '.xls', '.txt']:
            # Convert to base64 for Gemini API
            base64_content = base64.b64encode(content).decode('utf-8')
            
            # Determine MIME type
            mime_types = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.txt': 'text/plain'
            }
            mime_type = mime_types.get(file_ext, 'application/octet-stream')
            
            # Prompt for AI to extract events
            prompt = """
Extract all events from this calendar/timetable document. For each event, extract:
- title (event name)
- description (event details)
- event_date (in YYYY-MM-DD format)
- start_time (in HH:MM format, 24-hour)
- end_time (in HH:MM format, 24-hour)
- venue (location/room)
- event_type (workshop, seminar, cultural, sports, technical, other)

Return ONLY a valid JSON array of events in this exact format:
[
  {
    "title": "Event Name",
    "description": "Event description",
    "event_date": "2025-11-15",
    "start_time": "10:00",
    "end_time": "12:00",
    "venue": "Room 301",
    "event_type": "workshop"
  }
]

If you see dates in other formats, convert to YYYY-MM-DD. If times are in 12-hour format, convert to 24-hour.
Extract ALL events you can find. If information is missing, use empty string "".
"""
            
            try:
                # Call Gemini API with vision
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
                
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": base64_content
                                }
                            }
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 4096
                    }
                }
                
                response = requests.post(url, json=payload, timeout=60)
                response.raise_for_status()
                
                result = response.json()
                ai_text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                
                # Extract JSON from response
                import re
                json_match = re.search(r'\[.*\]', ai_text, re.DOTALL)
                if json_match:
                    events_json = json_match.group(0)
                    events = json.loads(events_json)
                    return {"events": events, "source": "ai_extraction", "count": len(events)}
                else:
                    raise ValueError("No valid JSON found in AI response")
                
            except Exception as e:
                print(f"AI extraction error: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to extract events from file: {str(e)}"
                )
        
        raise HTTPException(status_code=400, detail="Unsupported file processing")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Calendar extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
