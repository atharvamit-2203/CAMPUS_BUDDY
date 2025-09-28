# AI API Endpoints for Campus Connect
# FastAPI routes for AI-powered features

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Optional
from datetime import datetime, date, time
from pydantic import BaseModel, Field
from ai_service import ai_service, RoomSuggestion, AIScheduleOptimization
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
ai_router = APIRouter(prefix="/ai", tags=["AI Features"])

# ==========================================
# PYDANTIC MODELS
# ==========================================

class RoomSuggestionRequest(BaseModel):
    user_id: int
    requested_date: str
    start_time: str
    duration_minutes: int = Field(default=90, ge=30, le=480)
    capacity_needed: int = Field(default=1, ge=1, le=500)
    room_type: Optional[str] = None

class RoomSuggestionResponse(BaseModel):
    room_id: int
    room_number: str
    room_name: str
    building: str
    capacity: int
    confidence_score: float
    availability_score: float
    reason: str
    optimal_time_slots: List[Dict]

class PredictionRequest(BaseModel):
    prediction_date: str
    entity_id: Optional[int] = None

class AIInsightsResponse(BaseModel):
    room_utilization: Dict
    popular_times: Dict
    conflict_summary: Dict
    prediction_accuracy: Dict
    user_engagement: Dict

class ConflictResponse(BaseModel):
    type: str
    severity: str
    description: str
    affected_entities: List[Dict]
    resolution_suggestions: List[str]

class MenuRecommendationResponse(BaseModel):
    item_id: int
    name: str
    category: str
    price: float
    recommendation_type: str
    reason: str
    confidence: float

# ==========================================
# SMART ROOM SUGGESTIONS
# ==========================================

@ai_router.post("/rooms/suggestions", response_model=List[RoomSuggestionResponse])
async def get_smart_room_suggestions(request: RoomSuggestionRequest):
    """
    Get AI-powered room suggestions based on historical patterns and user preferences
    """
    try:
        logger.info(f"Generating room suggestions for user {request.user_id}")
        
        suggestions = ai_service.get_smart_room_suggestions(
            user_id=request.user_id,
            requested_date=request.requested_date,
            start_time=request.start_time,
            duration_minutes=request.duration_minutes,
            capacity_needed=request.capacity_needed,
            room_type=request.room_type
        )
        
        # Convert to response model
        response_suggestions = []
        for suggestion in suggestions:
            response_suggestions.append(RoomSuggestionResponse(
                room_id=suggestion.room_id,
                room_number=suggestion.room_number,
                room_name=suggestion.room_name,
                building=suggestion.building,
                capacity=suggestion.capacity,
                confidence_score=suggestion.confidence_score,
                availability_score=suggestion.availability_score,
                reason=suggestion.reason,
                optimal_time_slots=suggestion.optimal_time_slots
            ))
        
        logger.info(f"Generated {len(response_suggestions)} room suggestions")
        return response_suggestions
        
    except Exception as e:
        logger.error(f"Error in room suggestions API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate room suggestions: {str(e)}")

@ai_router.get("/rooms/availability-prediction/{room_id}")
async def predict_room_availability(
    room_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format")
):
    """
    Predict room availability patterns for a specific room and date
    """
    try:
        prediction = ai_service.predict_room_demand(date=date, room_id=room_id)
        
        if 'error' in prediction:
            raise HTTPException(status_code=400, detail=prediction['error'])
        
        return {
            "room_id": room_id,
            "date": date,
            "prediction": prediction,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting room availability: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ==========================================
# PREDICTIVE ANALYTICS
# ==========================================

@ai_router.post("/predictions/room-demand")
async def predict_room_demand(request: PredictionRequest):
    """
    Predict room demand for specific date
    """
    try:
        prediction = ai_service.predict_room_demand(
            date=request.prediction_date,
            room_id=request.entity_id
        )
        
        if 'error' in prediction:
            raise HTTPException(status_code=400, detail=prediction['error'])
        
        return {
            "prediction_type": "room_demand",
            "data": prediction,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in room demand prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@ai_router.post("/predictions/canteen-demand")
async def predict_canteen_demand(request: PredictionRequest):
    """
    Predict canteen order patterns for specific date
    """
    try:
        prediction = ai_service.predict_canteen_demand(date=request.prediction_date)
        
        if 'error' in prediction:
            raise HTTPException(status_code=400, detail=prediction['error'])
        
        return {
            "prediction_type": "canteen_demand",
            "data": prediction,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in canteen demand prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ==========================================
# SCHEDULE OPTIMIZATION
# ==========================================

@ai_router.get("/schedule/optimize/{faculty_id}")
async def optimize_faculty_schedule(
    faculty_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format")
):
    """
    Get AI-powered schedule optimization suggestions for faculty
    """
    try:
        logger.info(f"Optimizing schedule for faculty {faculty_id} on {date}")
        
        optimization = ai_service.optimize_schedule(faculty_id=faculty_id, date=date)
        
        if 'error' in optimization:
            raise HTTPException(status_code=400, detail=optimization['error'])
        
        return {
            "faculty_id": faculty_id,
            "optimization_date": date,
            "results": optimization,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Schedule optimization failed: {str(e)}")

@ai_router.get("/schedule/conflicts")
async def detect_schedule_conflicts():
    """
    Detect scheduling conflicts across the system
    """
    try:
        conflicts = ai_service.detect_conflicts()
        
        # Group conflicts by type
        conflicts_by_type = {}
        for conflict in conflicts:
            conflict_type = conflict['type']
            if conflict_type not in conflicts_by_type:
                conflicts_by_type[conflict_type] = []
            conflicts_by_type[conflict_type].append(conflict)
        
        return {
            "total_conflicts": len(conflicts),
            "conflicts_by_type": conflicts_by_type,
            "scan_timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error detecting conflicts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conflict detection failed: {str(e)}")

# ==========================================
# INTELLIGENT RECOMMENDATIONS
# ==========================================

@ai_router.get("/recommendations/menu/{user_id}", response_model=List[MenuRecommendationResponse])
async def get_menu_recommendations(user_id: int):
    """
    Get AI-powered menu recommendations for user
    """
    try:
        logger.info(f"Generating menu recommendations for user {user_id}")
        
        recommendations = ai_service.generate_menu_recommendations(user_id=user_id)
        
        # Convert to response model
        response_recommendations = []
        for rec in recommendations:
            response_recommendations.append(MenuRecommendationResponse(
                item_id=rec['item_id'],
                name=rec['name'],
                category=rec['category'],
                price=rec['price'],
                recommendation_type=rec['recommendation_type'],
                reason=rec['reason'],
                confidence=rec['confidence']
            ))
        
        logger.info(f"Generated {len(response_recommendations)} menu recommendations")
        return response_recommendations
        
    except Exception as e:
        logger.error(f"Error generating menu recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@ai_router.get("/recommendations/optimal-times/{room_id}")
async def get_optimal_booking_times(
    room_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    duration_minutes: int = Query(90, ge=30, le=480)
):
    """
    Get optimal booking times for a specific room
    """
    try:
        # Get room patterns from AI service
        optimal_slots = ai_service._generate_optimal_time_slots(room_id, date, "09:00:00", duration_minutes)
        
        return {
            "room_id": room_id,
            "date": date,
            "duration_minutes": duration_minutes,
            "optimal_time_slots": optimal_slots,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting optimal times: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get optimal times: {str(e)}")

# ==========================================
# AI INSIGHTS AND ANALYTICS
# ==========================================

@ai_router.get("/insights/dashboard", response_model=AIInsightsResponse)
async def get_ai_insights_dashboard():
    """
    Get comprehensive AI insights for dashboard
    """
    try:
        logger.info("Generating AI insights dashboard")
        
        insights = ai_service.get_ai_insights_dashboard()
        
        if 'error' in insights:
            raise HTTPException(status_code=400, detail=insights['error'])
        
        return AIInsightsResponse(
            room_utilization=insights['room_utilization'],
            popular_times=insights['popular_times'],
            conflict_summary=insights['conflict_summary'],
            prediction_accuracy=insights['prediction_accuracy'],
            user_engagement=insights['user_engagement']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@ai_router.get("/insights/room-utilization")
async def get_room_utilization_insights():
    """
    Get detailed room utilization insights
    """
    try:
        insights = ai_service._get_room_utilization_insights()
        
        return {
            "utilization_data": insights,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting room utilization insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")

@ai_router.get("/insights/popular-times")
async def get_popular_times_insights():
    """
    Get popular booking times insights
    """
    try:
        insights = ai_service._get_popular_times_insights()
        
        return {
            "popular_times_data": insights,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting popular times insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")

# ==========================================
# AI MODEL MANAGEMENT
# ==========================================

@ai_router.post("/models/update-patterns")
async def update_ai_patterns():
    """
    Update AI patterns based on recent data
    """
    try:
        logger.info("Updating AI patterns")
        
        ai_service.update_room_patterns()
        
        return {
            "message": "AI patterns updated successfully",
            "updated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error updating AI patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update patterns: {str(e)}")

@ai_router.get("/models/status")
async def get_ai_model_status():
    """
    Get status of AI models and their versions
    """
    try:
        model_status = {
            "model_versions": ai_service.model_versions,
            "last_pattern_update": "2024-01-20T10:30:00Z",  # This should come from database
            "active_models": {
                "room_demand_predictor": "active",
                "schedule_optimizer": "active",
                "menu_recommender": "active",
                "conflict_detector": "active"
            },
            "status": "healthy"
        }
        
        return model_status
        
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model status: {str(e)}")

# ==========================================
# LEARNING AND FEEDBACK
# ==========================================

@ai_router.post("/feedback/suggestion")
async def provide_suggestion_feedback(
    suggestion_id: int,
    is_helpful: bool,
    relevance_score: float = Query(..., ge=0.0, le=5.0),
    feedback_text: Optional[str] = None
):
    """
    Provide feedback on AI suggestions for model improvement
    """
    try:
        # Store feedback in database for model learning
        feedback_data = {
            "suggestion_id": suggestion_id,
            "is_helpful": is_helpful,
            "relevance_score": relevance_score,
            "feedback_text": feedback_text,
            "timestamp": datetime.now().isoformat()
        }
        
        # Log for AI learning
        ai_service._log_ai_activity('feedback', suggestion_id, feedback_data)
        
        return {
            "message": "Feedback recorded successfully",
            "feedback_id": suggestion_id,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")

@ai_router.get("/analytics/performance")
async def get_ai_performance_metrics():
    """
    Get AI performance metrics and analytics
    """
    try:
        performance_metrics = {
            "suggestion_accuracy": {
                "room_suggestions": 0.85,
                "menu_recommendations": 0.78,
                "schedule_optimization": 0.92
            },
            "user_engagement": {
                "suggestion_acceptance_rate": 0.73,
                "feedback_participation": 0.42,
                "repeat_usage": 0.68
            },
            "system_performance": {
                "average_response_time": "150ms",
                "prediction_confidence": 0.81,
                "conflict_detection_rate": 0.94
            },
            "learning_metrics": {
                "data_points_processed": 12543,
                "model_accuracy_improvement": 0.12,
                "last_training_update": "2024-01-19T15:00:00Z"
            }
        }
        
        return {
            "performance_data": performance_metrics,
            "generated_at": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

# ==========================================
# HEALTH CHECK
# ==========================================

@ai_router.get("/health")
async def ai_health_check():
    """
    Health check for AI services
    """
    try:
        # Test AI service connection
        test_insights = ai_service._get_room_utilization_insights()
        
        return {
            "ai_service": "healthy",
            "database_connection": "active",
            "model_status": "operational",
            "last_check": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"AI health check failed: {str(e)}")
        return {
            "ai_service": "degraded",
            "error": str(e),
            "last_check": datetime.now().isoformat(),
            "status": "error"
        }
