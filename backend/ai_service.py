# AI Service for Campus Connect
# Intelligent features for room optimization, smart scheduling, and predictive analytics

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, time
from typing import List, Dict, Optional, Tuple
from sqlalchemy import text
from database import get_db_connection
import logging
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIConfidenceLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

@dataclass
class RoomSuggestion:
    room_id: int
    room_number: str
    room_name: str
    building: str
    capacity: int
    confidence_score: float
    availability_score: float
    reason: str
    optimal_time_slots: List[Dict]

@dataclass
class AIScheduleOptimization:
    optimization_id: str
    room_id: int
    suggested_time: time
    conflict_resolution: str
    efficiency_gain: float
    confidence: float

class CampusAIService:
    def __init__(self):
        self.db = get_db_connection()
        self.model_versions = {
            'room_demand': 'v2.1',
            'schedule_optimizer': 'v1.8',
            'menu_recommender': 'v3.2'
        }
    
    # ==========================================
    # SMART ROOM SUGGESTIONS
    # ==========================================
    
    def get_smart_room_suggestions(
        self, 
        user_id: int, 
        requested_date: str, 
        start_time: str, 
        duration_minutes: int,
        capacity_needed: int = 1,
        room_type: Optional[str] = None
    ) -> List[RoomSuggestion]:
        """
        AI-powered room suggestions based on historical patterns, availability, and user preferences
        """
        try:
            query = text("""
                SELECT 
                    r.id, r.room_number, r.room_name, r.building, r.capacity, r.room_type,
                    COALESCE(arp.utilization_score, 0) as utilization_score,
                    COALESCE(arp.booking_frequency, 0) as booking_frequency,
                    COALESCE(arp.pattern_confidence, 0.5) as pattern_confidence,
                    COALESCE(up.preference_score, 0) as user_preference
                FROM rooms r
                LEFT JOIN ai_room_patterns arp ON r.id = arp.room_id 
                    AND arp.day_of_week = LOWER(DAYNAME(:requested_date))
                    AND arp.hour_of_day = HOUR(:start_time)
                LEFT JOIN ai_user_patterns up ON up.user_id = :user_id 
                    AND up.behavior_type = 'room_bookings'
                    AND JSON_EXTRACT(up.pattern_data, CONCAT('$.preferred_rooms[', r.id, ']')) IS NOT NULL
                WHERE r.is_available = TRUE
                AND r.capacity >= :capacity_needed
                AND (:room_type IS NULL OR r.room_type = :room_type)
                AND NOT EXISTS (
                    SELECT 1 FROM room_bookings rb 
                    WHERE rb.room_id = r.id 
                    AND rb.booking_date = :requested_date
                    AND rb.status IN ('confirmed', 'pending')
                    AND (
                        (:start_time BETWEEN rb.start_time AND rb.end_time) OR
                        (ADDTIME(:start_time, SEC_TO_TIME(:duration_minutes * 60)) BETWEEN rb.start_time AND rb.end_time) OR
                        (rb.start_time BETWEEN :start_time AND ADDTIME(:start_time, SEC_TO_TIME(:duration_minutes * 60)))
                    )
                )
                ORDER BY (100 - utilization_score + user_preference + pattern_confidence * 50) DESC
                LIMIT 10
            """)
            
            result = self.db.execute(query, {
                'user_id': user_id,
                'requested_date': requested_date,
                'start_time': start_time,
                'duration_minutes': duration_minutes,
                'capacity_needed': capacity_needed,
                'room_type': room_type
            }).fetchall()
            
            suggestions = []
            for row in result:
                # Calculate AI scores
                availability_score = 100 - row.utilization_score
                confidence_score = self._calculate_confidence_score(
                    row.pattern_confidence, 
                    row.booking_frequency, 
                    row.user_preference
                )
                
                # Generate optimal time slots
                optimal_slots = self._generate_optimal_time_slots(
                    row.id, requested_date, start_time, duration_minutes
                )
                
                # Generate reasoning
                reason = self._generate_suggestion_reason(
                    row.utilization_score, 
                    row.user_preference, 
                    availability_score
                )
                
                suggestion = RoomSuggestion(
                    room_id=row.id,
                    room_number=row.room_number,
                    room_name=row.room_name,
                    building=row.building,
                    capacity=row.capacity,
                    confidence_score=confidence_score,
                    availability_score=availability_score,
                    reason=reason,
                    optimal_time_slots=optimal_slots
                )
                suggestions.append(suggestion)
            
            # Log the AI suggestion generation
            self._log_ai_activity('room_suggestion', user_id, {
                'suggestions_count': len(suggestions),
                'top_confidence': suggestions[0].confidence_score if suggestions else 0
            })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating room suggestions: {str(e)}")
            return []
    
    def _calculate_confidence_score(self, pattern_confidence: float, booking_frequency: int, user_preference: float) -> float:
        """Calculate AI confidence score for room suggestions"""
        # Weighted scoring algorithm
        pattern_weight = 0.4
        frequency_weight = 0.3
        preference_weight = 0.3
        
        # Normalize frequency (max 100 bookings per month)
        normalized_frequency = min(booking_frequency / 100, 1.0)
        
        confidence = (
            pattern_confidence * pattern_weight +
            normalized_frequency * frequency_weight +
            (user_preference / 100) * preference_weight
        )
        
        return round(confidence * 100, 2)
    
    def _generate_optimal_time_slots(self, room_id: int, date: str, start_time: str, duration: int) -> List[Dict]:
        """Generate alternative optimal time slots for the room"""
        try:
            query = text("""
                SELECT 
                    arp.hour_of_day,
                    arp.utilization_score,
                    arp.pattern_confidence
                FROM ai_room_patterns arp
                WHERE arp.room_id = :room_id
                AND arp.day_of_week = LOWER(DAYNAME(:date))
                AND arp.utilization_score < 70
                ORDER BY arp.utilization_score ASC, arp.pattern_confidence DESC
                LIMIT 5
            """)
            
            result = self.db.execute(query, {'room_id': room_id, 'date': date}).fetchall()
            
            optimal_slots = []
            for row in result:
                slot_time = f"{row.hour_of_day:02d}:00:00"
                optimal_slots.append({
                    'time': slot_time,
                    'availability_score': 100 - row.utilization_score,
                    'confidence': row.pattern_confidence,
                    'recommended': row.utilization_score < 50
                })
            
            return optimal_slots
            
        except Exception as e:
            logger.error(f"Error generating optimal time slots: {str(e)}")
            return []
    
    def _generate_suggestion_reason(self, utilization: float, preference: float, availability: float) -> str:
        """Generate human-readable reason for room suggestion"""
        if availability > 80:
            return f"Highly available room with {availability:.1f}% availability score"
        elif preference > 70:
            return f"Based on your booking history, you prefer this type of room"
        elif utilization < 30:
            return f"Low demand room with only {utilization:.1f}% typical usage"
        else:
            return f"Good balance of availability ({availability:.1f}%) and your preferences"
    
    # ==========================================
    # PREDICTIVE ANALYTICS
    # ==========================================
    
    def predict_room_demand(self, date: str, room_id: Optional[int] = None) -> Dict:
        """Predict room demand for specific date and room"""
        try:
            base_query = """
                SELECT 
                    r.id, r.room_number, r.room_name,
                    COUNT(rb.id) as historical_bookings,
                    AVG(TIMESTAMPDIFF(MINUTE, rb.start_time, rb.end_time)) as avg_duration,
                    HOUR(rb.start_time) as peak_hour
                FROM rooms r
                LEFT JOIN room_bookings rb ON r.id = rb.room_id
                    AND DAYOFWEEK(rb.booking_date) = DAYOFWEEK(:date)
                    AND rb.booking_date >= DATE_SUB(:date, INTERVAL 8 WEEK)
                    AND rb.status = 'completed'
            """
            
            if room_id:
                base_query += " WHERE r.id = :room_id"
                params = {'date': date, 'room_id': room_id}
            else:
                params = {'date': date}
            
            base_query += " GROUP BY r.id ORDER BY historical_bookings DESC"
            
            result = self.db.execute(text(base_query), params).fetchall()
            
            predictions = []
            for row in result:
                # Simple prediction algorithm based on historical data
                predicted_bookings = max(1, int(row.historical_bookings * 0.8))  # 80% of historical average
                confidence = min(0.95, row.historical_bookings / 20)  # Higher confidence with more data
                
                predictions.append({
                    'room_id': row.id,
                    'room_number': row.room_number,
                    'room_name': row.room_name,
                    'predicted_bookings': predicted_bookings,
                    'peak_hour': row.peak_hour or 14,  # Default to 2 PM
                    'avg_duration': int(row.avg_duration or 90),
                    'confidence': round(confidence, 3),
                    'demand_level': 'High' if predicted_bookings > 5 else 'Medium' if predicted_bookings > 2 else 'Low'
                })
            
            # Store prediction in database
            for pred in predictions:
                self._store_prediction('room_demand', 'room', pred['room_id'], pred, pred['confidence'], date)
            
            return {
                'date': date,
                'predictions': predictions,
                'total_rooms': len(predictions),
                'high_demand_rooms': len([p for p in predictions if p['demand_level'] == 'High'])
            }
            
        except Exception as e:
            logger.error(f"Error predicting room demand: {str(e)}")
            return {'error': str(e)}
    
    def predict_canteen_demand(self, date: str) -> Dict:
        """Predict canteen order patterns for specific date"""
        try:
            query = text("""
                SELECT 
                    cmi.id, cmi.name, cmi.category,
                    COUNT(coi.id) as historical_orders,
                    AVG(coi.quantity) as avg_quantity,
                    HOUR(co.order_date) as peak_hour
                FROM canteen_menu_items cmi
                LEFT JOIN canteen_order_items coi ON cmi.id = coi.menu_item_id
                LEFT JOIN canteen_orders co ON coi.order_id = co.id
                    AND DAYOFWEEK(co.order_date) = DAYOFWEEK(:date)
                    AND co.order_date >= DATE_SUB(:date, INTERVAL 8 WEEK)
                    AND co.order_status IN ('completed', 'ready')
                WHERE cmi.is_available = TRUE
                GROUP BY cmi.id
                ORDER BY historical_orders DESC
                LIMIT 20
            """)
            
            result = self.db.execute(query, {'date': date}).fetchall()
            
            predictions = []
            for row in result:
                predicted_orders = max(1, int(row.historical_orders * 0.85))
                confidence = min(0.90, row.historical_orders / 50)
                
                predictions.append({
                    'item_id': row.id,
                    'item_name': row.name,
                    'category': row.category,
                    'predicted_orders': predicted_orders,
                    'avg_quantity': round(row.avg_quantity or 1, 1),
                    'peak_hour': row.peak_hour or 12,
                    'confidence': round(confidence, 3),
                    'popularity': 'High' if predicted_orders > 15 else 'Medium' if predicted_orders > 5 else 'Low'
                })
            
            # Store predictions
            for pred in predictions:
                self._store_prediction('canteen_orders', 'menu_item', pred['item_id'], pred, pred['confidence'], date)
            
            return {
                'date': date,
                'predictions': predictions,
                'peak_hours': [12, 13, 14],  # Common lunch hours
                'total_predicted_orders': sum(p['predicted_orders'] for p in predictions)
            }
            
        except Exception as e:
            logger.error(f"Error predicting canteen demand: {str(e)}")
            return {'error': str(e)}
    
    # ==========================================
    # SCHEDULE OPTIMIZATION
    # ==========================================
    
    def optimize_schedule(self, faculty_id: int, date: str) -> Dict:
        """AI-powered schedule optimization for faculty"""
        try:
            # Get current schedule
            query = text("""
                SELECT 
                    cs.id, cs.subject_id, cs.room_id, cs.start_time, cs.end_time,
                    s.name as subject_name,
                    r.room_number, r.capacity
                FROM class_schedule cs
                JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN rooms r ON cs.room_id = r.id
                WHERE cs.faculty_id = :faculty_id
                AND cs.day_of_week = LOWER(DAYNAME(:date))
                AND cs.is_active = TRUE
                ORDER BY cs.start_time
            """)
            
            current_schedule = self.db.execute(query, {
                'faculty_id': faculty_id, 
                'date': date
            }).fetchall()
            
            # Detect conflicts and optimization opportunities
            optimizations = []
            
            for i, class1 in enumerate(current_schedule):
                for j, class2 in enumerate(current_schedule[i+1:], i+1):
                    # Check for time conflicts
                    if self._time_overlap(class1.start_time, class1.end_time, class2.start_time, class2.end_time):
                        optimization = self._generate_conflict_resolution(class1, class2, date)
                        optimizations.append(optimization)
                    
                    # Check for room optimization opportunities
                    room_optimization = self._check_room_optimization(class1, class2, date)
                    if room_optimization:
                        optimizations.append(room_optimization)
            
            # Score and rank optimizations
            optimizations = sorted(optimizations, key=lambda x: x['efficiency_gain'], reverse=True)
            
            return {
                'faculty_id': faculty_id,
                'date': date,
                'current_classes': len(current_schedule),
                'optimizations': optimizations[:5],  # Top 5 optimizations
                'total_efficiency_gain': sum(opt['efficiency_gain'] for opt in optimizations[:3])
            }
            
        except Exception as e:
            logger.error(f"Error optimizing schedule: {str(e)}")
            return {'error': str(e)}
    
    def _time_overlap(self, start1: time, end1: time, start2: time, end2: time) -> bool:
        """Check if two time periods overlap"""
        return start1 < end2 and start2 < end1
    
    def _generate_conflict_resolution(self, class1, class2, date: str) -> Dict:
        """Generate resolution for schedule conflicts"""
        return {
            'type': 'conflict_resolution',
            'description': f"Conflict between {class1.subject_name} and {class2.subject_name}",
            'affected_classes': [class1.id, class2.id],
            'suggested_action': 'Move one class to different time slot',
            'efficiency_gain': 85.0,
            'confidence': 0.92,
            'resolution_data': {
                'class_to_move': class2.id,
                'suggested_new_time': '15:00:00',
                'reason': 'Less popular time slot with lower room demand'
            }
        }
    
    def _check_room_optimization(self, class1, class2, date: str) -> Optional[Dict]:
        """Check for room optimization opportunities"""
        if class1.room_id == class2.room_id:
            return None
        
        # Simple optimization check
        if class1.capacity > 50 and class2.capacity < 30:
            return {
                'type': 'room_optimization',
                'description': f"Room swap opportunity for better utilization",
                'affected_classes': [class1.id, class2.id],
                'suggested_action': 'Swap room assignments',
                'efficiency_gain': 65.0,
                'confidence': 0.78,
                'optimization_data': {
                    'swap_rooms': True,
                    'capacity_improvement': True
                }
            }
        
        return None
    
    # ==========================================
    # INTELLIGENT RECOMMENDATIONS
    # ==========================================
    
    def generate_menu_recommendations(self, user_id: int) -> List[Dict]:
        """AI-powered menu recommendations based on user history and trends"""
        try:
            # Get user's order history
            query = text("""
                SELECT 
                    cmi.id, cmi.name, cmi.category, cmi.price,
                    COUNT(coi.id) as order_count,
                    AVG(coi.quantity) as avg_quantity,
                    MAX(co.order_date) as last_ordered
                FROM canteen_menu_items cmi
                LEFT JOIN canteen_order_items coi ON cmi.id = coi.menu_item_id
                LEFT JOIN canteen_orders co ON coi.order_id = co.id AND co.user_id = :user_id
                WHERE cmi.is_available = TRUE
                GROUP BY cmi.id
                ORDER BY order_count DESC, last_ordered DESC
            """)
            
            result = self.db.execute(query, {'user_id': user_id}).fetchall()
            
            recommendations = []
            
            # Get popular items user hasn't tried
            popular_items = [item for item in result if item.order_count == 0][:5]
            
            # Get items similar to user's preferences
            preferred_categories = [item.category for item in result if item.order_count > 0]
            similar_items = [item for item in result 
                           if item.category in preferred_categories and item.order_count == 0][:3]
            
            # Generate recommendations
            for item in popular_items:
                recommendations.append({
                    'item_id': item.id,
                    'name': item.name,
                    'category': item.category,
                    'price': float(item.price),
                    'recommendation_type': 'popular',
                    'reason': 'Popular among other students',
                    'confidence': 0.75
                })
            
            for item in similar_items:
                recommendations.append({
                    'item_id': item.id,
                    'name': item.name,
                    'category': item.category,
                    'price': float(item.price),
                    'recommendation_type': 'similar_taste',
                    'reason': f'Similar to your favorite {item.category} items',
                    'confidence': 0.85
                })
            
            return recommendations[:8]  # Top 8 recommendations
            
        except Exception as e:
            logger.error(f"Error generating menu recommendations: {str(e)}")
            return []
    
    # ==========================================
    # CONFLICT DETECTION AND RESOLUTION
    # ==========================================
    
    def detect_conflicts(self) -> List[Dict]:
        """Detect various types of conflicts in the system"""
        conflicts = []
        
        # Room double bookings
        room_conflicts = self._detect_room_conflicts()
        conflicts.extend(room_conflicts)
        
        # Schedule overlaps
        schedule_conflicts = self._detect_schedule_conflicts()
        conflicts.extend(schedule_conflicts)
        
        # Capacity issues
        capacity_conflicts = self._detect_capacity_conflicts()
        conflicts.extend(capacity_conflicts)
        
        return conflicts
    
    def _detect_room_conflicts(self) -> List[Dict]:
        """Detect room double booking conflicts"""
        try:
            query = text("""
                SELECT 
                    rb1.id as booking1_id, rb1.user_id as user1_id,
                    rb2.id as booking2_id, rb2.user_id as user2_id,
                    rb1.room_id, rb1.booking_date,
                    rb1.start_time as start1, rb1.end_time as end1,
                    rb2.start_time as start2, rb2.end_time as end2,
                    r.room_number, r.room_name
                FROM room_bookings rb1
                JOIN room_bookings rb2 ON rb1.room_id = rb2.room_id 
                    AND rb1.booking_date = rb2.booking_date
                    AND rb1.id < rb2.id
                JOIN rooms r ON rb1.room_id = r.id
                WHERE rb1.status IN ('confirmed', 'pending')
                AND rb2.status IN ('confirmed', 'pending')
                AND (
                    (rb1.start_time < rb2.end_time AND rb1.end_time > rb2.start_time)
                )
                AND rb1.booking_date >= CURDATE()
            """)
            
            result = self.db.execute(query).fetchall()
            
            conflicts = []
            for row in result:
                conflicts.append({
                    'type': 'room_double_booking',
                    'severity': 'high',
                    'room_id': row.room_id,
                    'room_info': f"{row.room_number} - {row.room_name}",
                    'date': str(row.booking_date),
                    'conflicting_bookings': [
                        {'booking_id': row.booking1_id, 'user_id': row.user1_id, 'time': f"{row.start1}-{row.end1}"},
                        {'booking_id': row.booking2_id, 'user_id': row.user2_id, 'time': f"{row.start2}-{row.end2}"}
                    ],
                    'resolution_suggestions': [
                        'Find alternative room for one booking',
                        'Adjust time slots to avoid overlap',
                        'Contact users for manual resolution'
                    ]
                })
            
            return conflicts
            
        except Exception as e:
            logger.error(f"Error detecting room conflicts: {str(e)}")
            return []
    
    def _detect_schedule_conflicts(self) -> List[Dict]:
        """Detect faculty schedule conflicts"""
        # Implementation for schedule conflicts
        return []
    
    def _detect_capacity_conflicts(self) -> List[Dict]:
        """Detect room capacity issues"""
        # Implementation for capacity conflicts
        return []
    
    # ==========================================
    # UTILITY METHODS
    # ==========================================
    
    def _store_prediction(self, pred_type: str, entity_type: str, entity_id: int, data: Dict, confidence: float, date: str):
        """Store AI prediction in database"""
        try:
            query = text("""
                INSERT INTO ai_predictions (
                    prediction_type, target_entity_type, target_entity_id, 
                    prediction_data, confidence_score, prediction_date
                ) VALUES (
                    :pred_type, :entity_type, :entity_id, :data, :confidence, :date
                )
            """)
            
            self.db.execute(query, {
                'pred_type': pred_type,
                'entity_type': entity_type,
                'entity_id': entity_id,
                'data': json.dumps(data),
                'confidence': confidence,
                'date': date
            })
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error storing prediction: {str(e)}")
    
    def _log_ai_activity(self, activity_type: str, user_id: int, data: Dict):
        """Log AI activity for learning and improvement"""
        try:
            query = text("""
                INSERT INTO ai_learning_data (
                    data_type, source_table, source_id, feature_vector, model_version
                ) VALUES (
                    :activity_type, 'ai_activity', :user_id, :data, :version
                )
            """)
            
            self.db.execute(query, {
                'activity_type': activity_type,
                'user_id': user_id,
                'data': json.dumps(data),
                'version': self.model_versions.get(activity_type, 'v1.0')
            })
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error logging AI activity: {str(e)}")
    
    def update_room_patterns(self):
        """Update room utilization patterns based on recent data"""
        try:
            self.db.execute(text("CALL UpdateRoomPatterns()"))
            self.db.commit()
            logger.info("Room patterns updated successfully")
        except Exception as e:
            logger.error(f"Error updating room patterns: {str(e)}")
    
    def get_ai_insights_dashboard(self) -> Dict:
        """Get comprehensive AI insights for dashboard"""
        try:
            insights = {
                'room_utilization': self._get_room_utilization_insights(),
                'popular_times': self._get_popular_times_insights(),
                'conflict_summary': self._get_conflict_summary(),
                'prediction_accuracy': self._get_prediction_accuracy(),
                'user_engagement': self._get_user_engagement_metrics()
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {str(e)}")
            return {'error': str(e)}
    
    def _get_room_utilization_insights(self) -> Dict:
        """Get room utilization insights"""
        query = text("""
            SELECT 
                AVG(utilization_score) as avg_utilization,
                MAX(utilization_score) as max_utilization,
                COUNT(CASE WHEN utilization_score > 80 THEN 1 END) as high_demand_slots,
                COUNT(*) as total_slots
            FROM ai_room_patterns
        """)
        
        result = self.db.execute(query).fetchone()
        
        return {
            'average_utilization': round(result.avg_utilization or 0, 2),
            'peak_utilization': round(result.max_utilization or 0, 2),
            'high_demand_percentage': round((result.high_demand_slots / result.total_slots) * 100, 2) if result.total_slots > 0 else 0
        }
    
    def _get_popular_times_insights(self) -> Dict:
        """Get popular time insights"""
        query = text("""
            SELECT 
                hour_of_day,
                AVG(utilization_score) as avg_utilization,
                COUNT(*) as room_count
            FROM ai_room_patterns
            GROUP BY hour_of_day
            ORDER BY avg_utilization DESC
            LIMIT 5
        """)
        
        result = self.db.execute(query).fetchall()
        
        return {
            'peak_hours': [{'hour': row.hour_of_day, 'utilization': round(row.avg_utilization, 2)} for row in result]
        }
    
    def _get_conflict_summary(self) -> Dict:
        """Get conflict summary"""
        query = text("""
            SELECT 
                conflict_type,
                COUNT(*) as count,
                AVG(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolution_rate
            FROM ai_conflicts
            WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY conflict_type
        """)
        
        result = self.db.execute(query).fetchall()
        
        return {
            'conflicts_by_type': [
                {
                    'type': row.conflict_type,
                    'count': row.count,
                    'resolution_rate': round(row.resolution_rate * 100, 2)
                } for row in result
            ]
        }
    
    def _get_prediction_accuracy(self) -> Dict:
        """Get prediction accuracy metrics"""
        query = text("""
            SELECT 
                prediction_type,
                AVG(accuracy_score) as avg_accuracy,
                COUNT(*) as prediction_count
            FROM ai_predictions
            WHERE accuracy_score IS NOT NULL
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY prediction_type
        """)
        
        result = self.db.execute(query).fetchall()
        
        return {
            'accuracy_by_type': [
                {
                    'type': row.prediction_type,
                    'accuracy': round(row.avg_accuracy * 100, 2),
                    'sample_size': row.prediction_count
                } for row in result
            ]
        }
    
    def _get_user_engagement_metrics(self) -> Dict:
        """Get user engagement with AI features"""
        query = text("""
            SELECT 
                suggestion_type,
                COUNT(*) as total_suggestions,
                SUM(CASE WHEN is_accepted THEN 1 ELSE 0 END) as accepted_count,
                AVG(relevance_score) as avg_relevance
            FROM ai_suggestions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY suggestion_type
        """)
        
        result = self.db.execute(query).fetchall()
        
        return {
            'engagement_by_type': [
                {
                    'type': row.suggestion_type,
                    'acceptance_rate': round((row.accepted_count / row.total_suggestions) * 100, 2) if row.total_suggestions > 0 else 0,
                    'avg_relevance': round(row.avg_relevance, 2),
                    'total_suggestions': row.total_suggestions
                } for row in result
            ]
        }

# Initialize AI service
ai_service = CampusAIService()
