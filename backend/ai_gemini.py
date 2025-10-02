from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional, List
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
    """Universal chatbot for students, faculty, organization, admins."""
    message = (payload or {}).get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    role = current_user.get("role", "user")
    name = current_user.get("full_name", "User")
    prompt = f"Role: {role}\nName: {name}\nQuestion: {message}\nProvide a helpful answer based on campus systems like events, rooms, canteen, recruitment, organizations."
    answer = _gemini_generate(prompt)
    return {"role": role, "answer": answer}

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
    """Upload a timetable image/PDF and save parsed entries for the current student.
    Clears previous custom entries for that user and inserts new ones."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    img = await file.read()
    instruction = (
        "Extract timetable as JSON array. Each entry: {day_of_week (e.g., Monday), start_time (HH:MM), end_time (HH:MM), subject, room (optional), faculty (optional)}."
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
        # clear previous
        cur.execute("DELETE FROM user_timetable_entries WHERE user_id = %s", (current_user["id"],))
        inserted = 0
        def as_time(s: str) -> str:
            s = (s or "").strip()
            if len(s) == 5 and s.count(":") == 1:
                return s + ":00"
            return s
        for r in rows:
            try:
                dow = (r.get("day_of_week") or r.get("day") or "").strip().capitalize()
                st = as_time(str(r.get("start_time") or ""))
                et = as_time(str(r.get("end_time") or ""))
                subject = (r.get("subject") or r.get("course") or "").strip()
                room = (r.get("room") or r.get("venue") or None)
                faculty = (r.get("faculty") or r.get("teacher") or None)
                if not (dow and st and et and subject):
                    continue
                cur.execute(
                    """
                    INSERT INTO user_timetable_entries (user_id, day_of_week, start_time, end_time, subject, room, faculty)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (current_user["id"], dow, st, et, subject, room, faculty)
                )
                inserted += 1
            except Exception:
                continue
        conn.commit()
        return {"inserted": inserted}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cur' in locals():
            try: cur.close()
            except Exception: pass
        if 'conn' in locals():
            try: conn.close()
            except Exception: pass

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
