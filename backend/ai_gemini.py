from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import os, json
import requests
import mysql.connector

import auth
from database import get_mysql_connection

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

router = APIRouter()

def _gemini_generate(prompt: str, json_mode: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    headers = {"Content-Type": "application/json"}
    system = "You are CampusConnect AI, a helpful assistant for a college portal. Be concise, factual, and role-aware."
    # Google generative language expects contents
    payload = {
        "contents": [
            {"parts": [{"text": system}]},
            {"parts": [{"text": prompt}]}
        ]
    }
    if json_mode:
        payload["generationConfig"] = {"responseMimeType": "application/json"}
    resp = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=45)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Gemini error: {resp.text[:500]}")
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return json.dumps(data)

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

@router.post("/ai/club-recommendations")
async def ai_club_recommendations(payload: dict = {}, current_user = Depends(auth.get_current_user)):
    """Return club/org recommendations using Gemini based on user's interests and available clubs."""
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
        # Compose prompt
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
        result = _gemini_generate(prompt, json_mode=True)
        # Attempt to parse JSON
        recommendations = []
        try:
            parsed = json.loads(result)
            if isinstance(parsed, list):
                recommendations = parsed
        except Exception:
            # fallback: wrap plain text
            recommendations = [{"id": None, "score": 0, "reason": result}]
        return {"interests": interests, "recommendations": recommendations}
    finally:
        if 'cursor' in locals():
            try: cursor.close()
            except Exception: pass
        if 'connection' in locals():
            try: connection.close()
            except Exception: pass