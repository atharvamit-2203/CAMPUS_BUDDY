"""
API endpoints for AI-powered club recommendations and chatbot
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ai_recommender import club_recommender, club_chatbot, UserProfile
from auth import get_current_user
from database import get_mysql_connection
import logging

router = APIRouter(prefix="/ai", tags=["AI Services"])

# Request/Response models
class RecommendationRequest(BaseModel):
    interests: List[str]
    skills: List[str]
    year_of_study: int
    department: str
    preferred_activities: List[str]
    time_commitment: str  # "low", "medium", "high"
    leadership_interest: bool

class ChatMessage(BaseModel):
    message: str
    user_context: Optional[Dict] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None

@router.post("/recommend-clubs")
async def get_club_recommendations(
    request: RecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered club recommendations based on user profile"""
    try:
        # Create user profile
        user_profile = UserProfile(
            interests=request.interests,
            skills=request.skills,
            year_of_study=request.year_of_study,
            department=request.department,
            preferred_activities=request.preferred_activities,
            time_commitment=request.time_commitment,
            leadership_interest=request.leadership_interest
        )
        
        # Get recommendations
        recommendations = club_recommender.recommend_clubs(user_profile, top_k=5)
        
        return {
            "success": True,
            "recommendations": recommendations,
            "user_profile": user_profile.dict(),
            "total_clubs": len(recommendations)
        }
        
    except Exception as e:
        logging.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    chat_message: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Chat with AI bot about clubs and committees"""
    try:
        # Add user context if available
        user_context = chat_message.user_context or {}
        if current_user:
            user_context.update({
                "user_id": current_user.get("id"),
                "username": current_user.get("username"),
                "role": current_user.get("role")
            })
        
        # Get response from chatbot
        response = await club_chatbot.get_response(
            chat_message.message, 
            user_context
        )
        
        return ChatResponse(
            response=response,
            suggestions=None  # Could add dynamic suggestions based on context
        )
        
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")

@router.get("/club-suggestions")
async def get_club_suggestions_by_interests(
    interests: str,  # Comma-separated interests
    current_user: dict = Depends(get_current_user)
):
    """Get quick club suggestions based on interests"""
    try:
        interests_list = [interest.strip() for interest in interests.split(",")]
        suggestions = club_chatbot.get_club_suggestions(interests_list)
        
        return {
            "success": True,
            "suggestions": suggestions,
            "interests": interests_list
        }
        
    except Exception as e:
        logging.error(f"Error getting club suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get club suggestions")

@router.get("/clubs-data")
async def get_all_clubs_data():
    """Get comprehensive data about all clubs"""
    try:
        clubs_data = club_recommender.clubs_data
        return {
            "success": True,
            "clubs": [club.dict() for club in clubs_data],
            "total_clubs": len(clubs_data)
        }
        
    except Exception as e:
        logging.error(f"Error getting clubs data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get clubs data")

@router.get("/recommend-from-profile")
async def recommend_from_profile(current_user: dict = Depends(get_current_user)):
    """Build a user profile from stored preferences and return recommendations"""
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT semester, department, interests_json, skills_json FROM users WHERE id = %s", (current_user["id"],))
        u = cursor.fetchone() or {}
        import json as _json
        interests = []
        skills = []
        try:
            interests = _json.loads(u.get("interests_json") or "[]")
        except Exception:
            interests = []
        try:
            skills = _json.loads(u.get("skills_json") or "[]")
        except Exception:
            skills = []
        # Map semester to year of study (approx)
        sem = int(u.get("semester") or 1)
        year = max(1, ((sem - 1) // 2) + 1)
        user_profile = UserProfile(
            interests=interests,
            skills=skills,
            year_of_study=year,
            department=u.get("department") or "",
            preferred_activities=[],
            time_commitment="medium",
            leadership_interest=False
        )
        recommendations = club_recommender.recommend_clubs(user_profile, top_k=5)
        return {"success": True, "recommendations": recommendations, "user_profile": user_profile.dict()}
    except Exception as e:
        logging.error(f"Error in recommend-from-profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations from profile")

@router.post("/update-user-preferences")
async def update_user_preferences(
    preferences: RecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences for better recommendations"""
    try:
        # In a real implementation, you would save these preferences to the database
        # For now, we'll just return the updated preferences
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "preferences": preferences.dict(),
            "user_id": current_user.get("id")
        }
        
    except Exception as e:
        logging.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")
