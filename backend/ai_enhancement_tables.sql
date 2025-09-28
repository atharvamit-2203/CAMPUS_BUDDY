-- AI Enhancement Tables for Campus Connect
-- These tables support AI-powered features like smart scheduling, predictive analytics, and intelligent recommendations

-- Add AI tables to existing schema
USE campus_connect;

-- ==========================================
-- AI ANALYTICS AND MACHINE LEARNING TABLES
-- ==========================================

-- AI Room Utilization Patterns
CREATE TABLE ai_room_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    hour_of_day INT NOT NULL,
    utilization_score DECIMAL(5,2) DEFAULT 0.00,
    booking_frequency INT DEFAULT 0,
    avg_duration_minutes INT DEFAULT 0,
    peak_capacity_used DECIMAL(5,2) DEFAULT 0.00,
    pattern_confidence DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_time (room_id, day_of_week, hour_of_day)
);

-- AI User Behavior Patterns
CREATE TABLE ai_user_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    behavior_type ENUM('canteen_orders', 'room_bookings', 'class_attendance', 'login_times') NOT NULL,
    pattern_data JSON,
    preference_score DECIMAL(5,2) DEFAULT 0.00,
    frequency_score DECIMAL(5,2) DEFAULT 0.00,
    prediction_accuracy DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_behavior (user_id, behavior_type)
);

-- AI Scheduling Optimization
CREATE TABLE ai_schedule_optimization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    optimization_type ENUM('room_assignment', 'time_slot', 'conflict_resolution', 'capacity_optimization') NOT NULL,
    target_date DATE NOT NULL,
    optimization_data JSON,
    efficiency_score DECIMAL(5,2) DEFAULT 0.00,
    conflict_score DECIMAL(5,2) DEFAULT 0.00,
    utilization_improvement DECIMAL(5,2) DEFAULT 0.00,
    implementation_status ENUM('pending', 'applied', 'rejected', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP NULL
);

-- AI Predictions and Recommendations
CREATE TABLE ai_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_type ENUM('room_demand', 'canteen_orders', 'peak_hours', 'maintenance_needed', 'user_preferences') NOT NULL,
    target_entity_type ENUM('room', 'user', 'menu_item', 'time_slot', 'general') NOT NULL,
    target_entity_id INT,
    prediction_data JSON,
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    prediction_date DATE NOT NULL,
    actual_outcome JSON,
    accuracy_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_prediction_date (prediction_date),
    INDEX idx_confidence (confidence_score)
);

-- AI Smart Suggestions
CREATE TABLE ai_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    suggestion_type ENUM('room_booking', 'menu_recommendation', 'schedule_optimization', 'study_group', 'event_timing') NOT NULL,
    suggestion_title VARCHAR(255) NOT NULL,
    suggestion_description TEXT,
    suggestion_data JSON,
    priority_score DECIMAL(5,2) DEFAULT 0.00,
    relevance_score DECIMAL(5,2) DEFAULT 0.00,
    is_shown BOOLEAN DEFAULT FALSE,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_suggestions (user_id, is_shown),
    INDEX idx_suggestion_type (suggestion_type),
    INDEX idx_priority (priority_score DESC)
);

-- AI Learning Data
CREATE TABLE ai_learning_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_type ENUM('room_usage', 'user_behavior', 'canteen_patterns', 'schedule_conflicts', 'feedback') NOT NULL,
    source_table VARCHAR(50),
    source_id INT,
    feature_vector JSON,
    label_data JSON,
    training_set BOOLEAN DEFAULT TRUE,
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_data_type (data_type),
    INDEX idx_training_set (training_set),
    INDEX idx_model_version (model_version)
);

-- AI Model Performance
CREATE TABLE ai_model_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_type ENUM('classification', 'regression', 'clustering', 'recommendation') NOT NULL,
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_data_size INT,
    last_trained TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    performance_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_active (model_name, is_active),
    INDEX idx_performance (accuracy_score DESC)
);

-- AI Conflict Detection
CREATE TABLE ai_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conflict_type ENUM('room_double_booking', 'schedule_overlap', 'capacity_exceeded', 'resource_unavailable') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    conflict_data JSON,
    affected_entities JSON,
    resolution_suggestions JSON,
    auto_resolved BOOLEAN DEFAULT FALSE,
    resolution_applied JSON,
    status ENUM('detected', 'notified', 'resolving', 'resolved', 'ignored') DEFAULT 'detected',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    INDEX idx_conflict_status (status),
    INDEX idx_severity (severity),
    INDEX idx_detected_date (detected_at)
);

-- AI Feedback and Learning
CREATE TABLE ai_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feedback_type ENUM('suggestion_rating', 'prediction_accuracy', 'recommendation_quality', 'general_feedback') NOT NULL,
    target_type ENUM('suggestion', 'prediction', 'recommendation', 'optimization') NOT NULL,
    target_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    improvement_areas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_rating (rating),
    INDEX idx_target (target_type, target_id)
);

-- ==========================================
-- AI VIEWS FOR QUICK ACCESS
-- ==========================================

-- Room Availability with AI Predictions
CREATE VIEW ai_room_availability AS
SELECT 
    r.id,
    r.room_number,
    r.room_name,
    r.building,
    r.capacity,
    r.room_type,
    arp.utilization_score,
    arp.booking_frequency,
    CASE 
        WHEN rb.id IS NOT NULL THEN 'Currently Booked'
        WHEN cs.id IS NOT NULL THEN 'Class in Progress'
        WHEN arp.utilization_score > 80 THEN 'High Demand'
        WHEN arp.utilization_score > 50 THEN 'Moderate Demand'
        ELSE 'Low Demand'
    END as ai_status,
    CASE
        WHEN arp.utilization_score < 30 THEN 'Highly Recommended'
        WHEN arp.utilization_score < 60 THEN 'Recommended'
        WHEN arp.utilization_score < 80 THEN 'Available'
        ELSE 'Not Recommended'
    END as ai_recommendation
FROM rooms r
LEFT JOIN ai_room_patterns arp ON r.id = arp.room_id 
    AND arp.day_of_week = LOWER(DAYNAME(CURDATE()))
    AND arp.hour_of_day = HOUR(CURTIME())
LEFT JOIN room_bookings rb ON r.id = rb.room_id 
    AND rb.booking_date = CURDATE() 
    AND CURTIME() BETWEEN rb.start_time AND rb.end_time
    AND rb.status = 'confirmed'
LEFT JOIN class_schedule cs ON r.id = cs.room_id 
    AND LOWER(DAYNAME(CURDATE())) = cs.day_of_week
    AND CURTIME() BETWEEN cs.start_time AND cs.end_time
    AND cs.is_active = TRUE
WHERE r.is_available = TRUE;

-- User Smart Suggestions
CREATE VIEW user_smart_suggestions AS
SELECT 
    s.id,
    s.user_id,
    u.first_name,
    u.last_name,
    s.suggestion_type,
    s.suggestion_title,
    s.suggestion_description,
    s.priority_score,
    s.relevance_score,
    s.expires_at,
    s.created_at
FROM ai_suggestions s
JOIN users u ON s.user_id = u.id
WHERE s.is_shown = FALSE 
    AND s.is_dismissed = FALSE
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
ORDER BY s.priority_score DESC, s.relevance_score DESC;

-- AI Performance Dashboard
CREATE VIEW ai_performance_dashboard AS
SELECT 
    model_name,
    model_version,
    model_type,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    last_trained,
    is_active,
    DATEDIFF(NOW(), last_trained) as days_since_training
FROM ai_model_performance
WHERE is_active = TRUE
ORDER BY accuracy_score DESC;

-- ==========================================
-- STORED PROCEDURES FOR AI OPERATIONS
-- ==========================================

DELIMITER //

-- Procedure to update room utilization patterns
CREATE PROCEDURE UpdateRoomPatterns()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE room_id_var INT;
    DECLARE day_var VARCHAR(10);
    DECLARE hour_var INT;
    DECLARE utilization_var DECIMAL(5,2);
    
    DECLARE room_cursor CURSOR FOR 
        SELECT 
            rb.room_id,
            LOWER(DAYNAME(rb.booking_date)) as day_of_week,
            HOUR(rb.start_time) as hour_of_day,
            AVG(TIMESTAMPDIFF(MINUTE, rb.start_time, rb.end_time)) as avg_duration,
            COUNT(*) as booking_count
        FROM room_bookings rb
        WHERE rb.booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND rb.status = 'completed'
        GROUP BY rb.room_id, DAYNAME(rb.booking_date), HOUR(rb.start_time);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN room_cursor;
    
    read_loop: LOOP
        FETCH room_cursor INTO room_id_var, day_var, hour_var, utilization_var;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO ai_room_patterns (room_id, day_of_week, hour_of_day, utilization_score, booking_frequency, avg_duration_minutes, pattern_confidence)
        VALUES (room_id_var, day_var, hour_var, utilization_var, utilization_var, utilization_var, 0.85)
        ON DUPLICATE KEY UPDATE
            utilization_score = VALUES(utilization_score),
            booking_frequency = VALUES(booking_frequency),
            avg_duration_minutes = VALUES(avg_duration_minutes),
            pattern_confidence = 0.90,
            last_updated = CURRENT_TIMESTAMP;
    END LOOP;
    
    CLOSE room_cursor;
END //

-- Procedure to generate smart room suggestions
CREATE PROCEDURE GenerateRoomSuggestions(IN user_id_param INT, IN requested_date DATE, IN requested_start_time TIME, IN duration_minutes INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE room_id_var INT;
    DECLARE room_score DECIMAL(5,2);
    
    DECLARE room_cursor CURSOR FOR 
        SELECT 
            r.id,
            COALESCE(100 - arp.utilization_score, 100) as availability_score
        FROM rooms r
        LEFT JOIN ai_room_patterns arp ON r.id = arp.room_id 
            AND arp.day_of_week = LOWER(DAYNAME(requested_date))
            AND arp.hour_of_day = HOUR(requested_start_time)
        WHERE r.is_available = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM room_bookings rb 
            WHERE rb.room_id = r.id 
            AND rb.booking_date = requested_date
            AND rb.status IN ('confirmed', 'pending')
            AND (
                (requested_start_time BETWEEN rb.start_time AND rb.end_time) OR
                (ADDTIME(requested_start_time, SEC_TO_TIME(duration_minutes * 60)) BETWEEN rb.start_time AND rb.end_time) OR
                (rb.start_time BETWEEN requested_start_time AND ADDTIME(requested_start_time, SEC_TO_TIME(duration_minutes * 60)))
            )
        )
        ORDER BY availability_score DESC
        LIMIT 5;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Clear existing suggestions for this user
    DELETE FROM ai_suggestions 
    WHERE user_id = user_id_param 
    AND suggestion_type = 'room_booking' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    OPEN room_cursor;
    
    suggestion_loop: LOOP
        FETCH room_cursor INTO room_id_var, room_score;
        IF done THEN
            LEAVE suggestion_loop;
        END IF;
        
        INSERT INTO ai_suggestions (
            user_id, 
            suggestion_type, 
            suggestion_title, 
            suggestion_description, 
            suggestion_data, 
            priority_score, 
            relevance_score,
            expires_at
        ) VALUES (
            user_id_param,
            'room_booking',
            CONCAT('Smart Room Suggestion: ', (SELECT CONCAT(room_number, ' - ', room_name) FROM rooms WHERE id = room_id_var)),
            CONCAT('Based on usage patterns, this room has a ', room_score, '% availability score for your requested time.'),
            JSON_OBJECT('room_id', room_id_var, 'date', requested_date, 'start_time', requested_start_time, 'duration', duration_minutes),
            room_score,
            room_score,
            DATE_ADD(NOW(), INTERVAL 24 HOUR)
        );
    END LOOP;
    
    CLOSE room_cursor;
END //

-- Procedure to detect scheduling conflicts
CREATE PROCEDURE DetectSchedulingConflicts()
BEGIN
    -- Check for room double bookings
    INSERT INTO ai_conflicts (conflict_type, severity, conflict_data, affected_entities, resolution_suggestions)
    SELECT 
        'room_double_booking',
        'high',
        JSON_OBJECT(
            'room_id', rb1.room_id,
            'date', rb1.booking_date,
            'bookings', JSON_ARRAY(
                JSON_OBJECT('booking_id', rb1.id, 'user_id', rb1.user_id, 'start_time', rb1.start_time, 'end_time', rb1.end_time),
                JSON_OBJECT('booking_id', rb2.id, 'user_id', rb2.user_id, 'start_time', rb2.start_time, 'end_time', rb2.end_time)
            )
        ),
        JSON_ARRAY(rb1.id, rb2.id),
        JSON_ARRAY(
            'Suggest alternative rooms for one booking',
            'Propose time slot adjustment',
            'Contact users for manual resolution'
        )
    FROM room_bookings rb1
    JOIN room_bookings rb2 ON rb1.room_id = rb2.room_id 
        AND rb1.booking_date = rb2.booking_date
        AND rb1.id < rb2.id
        AND rb1.status IN ('confirmed', 'pending')
        AND rb2.status IN ('confirmed', 'pending')
        AND (
            (rb1.start_time BETWEEN rb2.start_time AND rb2.end_time) OR
            (rb1.end_time BETWEEN rb2.start_time AND rb2.end_time) OR
            (rb2.start_time BETWEEN rb1.start_time AND rb1.end_time)
        )
    WHERE NOT EXISTS (
        SELECT 1 FROM ai_conflicts ac 
        WHERE ac.conflict_type = 'room_double_booking'
        AND JSON_EXTRACT(ac.conflict_data, '$.room_id') = rb1.room_id
        AND JSON_EXTRACT(ac.conflict_data, '$.date') = rb1.booking_date
        AND ac.status IN ('detected', 'notified', 'resolving')
    );
END //

DELIMITER ;

-- ==========================================
-- SAMPLE AI DATA FOR TESTING
-- ==========================================

-- Insert sample room patterns
INSERT INTO ai_room_patterns (room_id, day_of_week, hour_of_day, utilization_score, booking_frequency, avg_duration_minutes, pattern_confidence) VALUES
(1, 'monday', 9, 85.5, 12, 90, 0.92),
(1, 'monday', 14, 45.2, 6, 120, 0.88),
(2, 'tuesday', 10, 92.1, 15, 75, 0.95),
(3, 'wednesday', 15, 25.8, 3, 180, 0.78),
(4, 'thursday', 11, 78.9, 10, 105, 0.90),
(5, 'friday', 16, 15.4, 2, 240, 0.65);

-- Insert sample AI suggestions
INSERT INTO ai_suggestions (user_id, suggestion_type, suggestion_title, suggestion_description, suggestion_data, priority_score, relevance_score, expires_at) VALUES
(1, 'room_booking', 'Perfect Room Available', 'Room A201 has low utilization during your preferred time slot', '{"room_id": 3, "confidence": 0.89}', 85.5, 92.3, DATE_ADD(NOW(), INTERVAL 2 DAY)),
(2, 'menu_recommendation', 'Try Something New!', 'Based on your order history, you might like Paneer Makhani', '{"item_id": 2, "confidence": 0.76}', 75.2, 88.1, DATE_ADD(NOW(), INTERVAL 1 DAY)),
(4, 'schedule_optimization', 'Optimize Your Schedule', 'We can reduce conflicts by moving your 2 PM class to 3 PM', '{"schedule_id": 1, "confidence": 0.94}', 94.7, 89.5, DATE_ADD(NOW(), INTERVAL 3 DAY));

-- Insert sample predictions
INSERT INTO ai_predictions (prediction_type, target_entity_type, target_entity_id, prediction_data, confidence_score, prediction_date) VALUES
('room_demand', 'room', 1, '{"predicted_bookings": 8, "peak_hours": [9, 14, 16]}', 0.87, CURDATE() + INTERVAL 1 DAY),
('canteen_orders', 'menu_item', 1, '{"predicted_orders": 25, "peak_time": "12:30"}', 0.82, CURDATE() + INTERVAL 1 DAY),
('peak_hours', 'general', NULL, '{"library": [14, 15, 16], "canteen": [12, 13], "labs": [10, 11, 15]}', 0.91, CURDATE() + INTERVAL 1 DAY);

-- Insert sample model performance data
INSERT INTO ai_model_performance (model_name, model_version, model_type, accuracy_score, precision_score, recall_score, f1_score, training_data_size, last_trained, is_active) VALUES
('RoomDemandPredictor', 'v2.1', 'regression', 0.8734, 0.8456, 0.8912, 0.8679, 15420, NOW() - INTERVAL 2 DAY, TRUE),
('ScheduleOptimizer', 'v1.8', 'classification', 0.9156, 0.9023, 0.9287, 0.9153, 8765, NOW() - INTERVAL 1 DAY, TRUE),
('MenuRecommender', 'v3.2', 'recommendation', 0.8891, 0.8734, 0.9045, 0.8887, 23456, NOW() - INTERVAL 3 DAY, TRUE);

-- ==========================================
-- AI INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_ai_room_patterns_lookup ON ai_room_patterns(room_id, day_of_week, hour_of_day);
CREATE INDEX idx_ai_suggestions_user_active ON ai_suggestions(user_id, is_shown, is_dismissed);
CREATE INDEX idx_ai_predictions_date ON ai_predictions(prediction_date, prediction_type);
CREATE INDEX idx_ai_conflicts_status ON ai_conflicts(status, severity);
CREATE INDEX idx_ai_feedback_rating ON ai_feedback(rating, feedback_type);

-- Success message
SELECT 'AI Enhancement Tables Created Successfully!' as status,
       'Smart room suggestions, predictive analytics, and AI optimization features are now available!' as message;
