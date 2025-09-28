-- Advanced Feature Functions for Campus Connect
-- QR Code Management, Payment Processing, Notification System
-- Created: September 12, 2025

-- =============================================================================
-- QR CODE MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to generate QR code data for orders
CREATE OR REPLACE FUNCTION generate_qr_code_data(order_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    order_info RECORD;
    qr_data TEXT;
BEGIN
    -- Get order information
    SELECT 
        co.order_number,
        co.user_id,
        co.final_amount,
        co.created_at,
        u.full_name,
        u.student_id
    INTO order_info
    FROM canteen_orders co
    JOIN users u ON co.user_id = u.id
    WHERE co.id = order_id;
    
    -- Generate QR code data as JSON string
    qr_data := json_build_object(
        'type', 'canteen_order',
        'order_id', order_id,
        'order_number', order_info.order_number,
        'user_id', order_info.user_id,
        'student_id', order_info.student_id,
        'customer_name', order_info.full_name,
        'amount', order_info.final_amount,
        'timestamp', EXTRACT(EPOCH FROM order_info.created_at),
        'verification_hash', MD5(order_id::text || order_info.order_number || order_info.user_id::text)
    )::text;
    
    RETURN qr_data;
END;
$$ LANGUAGE plpgsql;

-- Function to verify QR code data
CREATE OR REPLACE FUNCTION verify_qr_code(qr_data_input TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    order_id INTEGER,
    order_status TEXT,
    message TEXT
) AS $$
DECLARE
    qr_json JSONB;
    stored_order RECORD;
    calculated_hash TEXT;
BEGIN
    -- Parse JSON
    BEGIN
        qr_json := qr_data_input::JSONB;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT false, NULL::INTEGER, NULL::TEXT, 'Invalid QR code format';
            RETURN;
    END;
    
    -- Get order information
    SELECT co.id, co.order_number, co.user_id, co.order_status, co.payment_status
    INTO stored_order
    FROM canteen_orders co
    WHERE co.id = (qr_json->>'order_id')::INTEGER;
    
    -- Check if order exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::INTEGER, NULL::TEXT, 'Order not found';
        RETURN;
    END IF;
    
    -- Verify hash
    calculated_hash := MD5(stored_order.id::text || stored_order.order_number || stored_order.user_id::text);
    
    IF calculated_hash != (qr_json->>'verification_hash') THEN
        RETURN QUERY SELECT false, stored_order.id, stored_order.order_status, 'Invalid QR code - verification failed';
        RETURN;
    END IF;
    
    -- Check if already scanned
    IF EXISTS (SELECT 1 FROM canteen_receipts WHERE order_id = stored_order.id AND is_scanned = true) THEN
        RETURN QUERY SELECT false, stored_order.id, stored_order.order_status, 'QR code already used';
        RETURN;
    END IF;
    
    -- Check order status
    IF stored_order.order_status != 'ready' THEN
        RETURN QUERY SELECT false, stored_order.id, stored_order.order_status, 'Order not ready for pickup';
        RETURN;
    END IF;
    
    -- Check payment status
    IF stored_order.payment_status = 'pending' THEN
        RETURN QUERY SELECT false, stored_order.id, stored_order.order_status, 'Payment pending - please pay first';
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, stored_order.id, stored_order.order_status, 'Valid QR code - order ready for pickup';
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to process QR code scan
CREATE OR REPLACE FUNCTION process_qr_scan(
    qr_data_input TEXT,
    scanned_by_user_id INTEGER,
    scan_location TEXT DEFAULT 'canteen'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    order_details JSONB
) AS $$
DECLARE
    verification_result RECORD;
    order_info RECORD;
    receipt_id INTEGER;
BEGIN
    -- Verify QR code first
    SELECT * INTO verification_result
    FROM verify_qr_code(qr_data_input)
    LIMIT 1;
    
    IF NOT verification_result.is_valid THEN
        -- Log failed scan
        INSERT INTO qr_code_scans (order_id, scanned_by, scan_location, scan_result, scanned_at)
        VALUES (verification_result.order_id, scanned_by_user_id, scan_location, 'failed', CURRENT_TIMESTAMP);
        
        RETURN QUERY SELECT false, verification_result.message, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Get order details
    SELECT 
        co.id, co.order_number, co.final_amount, co.user_id,
        u.full_name as customer_name,
        array_agg(
            json_build_object(
                'item_name', cmi.item_name,
                'quantity', coi.quantity,
                'price', coi.total_price
            )
        ) as items
    INTO order_info
    FROM canteen_orders co
    JOIN users u ON co.user_id = u.id
    JOIN canteen_order_items coi ON co.id = coi.order_id
    JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
    WHERE co.id = verification_result.order_id
    GROUP BY co.id, co.order_number, co.final_amount, co.user_id, u.full_name;
    
    -- Create or update receipt
    INSERT INTO canteen_receipts (order_id, qr_code_data, is_scanned, scanned_at, scanned_by)
    VALUES (verification_result.order_id, qr_data_input, true, CURRENT_TIMESTAMP, scanned_by_user_id)
    ON CONFLICT (order_id) DO UPDATE SET
        is_scanned = true,
        scanned_at = CURRENT_TIMESTAMP,
        scanned_by = scanned_by_user_id
    RETURNING id INTO receipt_id;
    
    -- Log successful scan
    INSERT INTO qr_code_scans (receipt_id, order_id, scanned_by, scan_location, scan_result, scanned_at)
    VALUES (receipt_id, verification_result.order_id, scanned_by_user_id, scan_location, 'success', CURRENT_TIMESTAMP);
    
    -- Update order status to completed
    UPDATE canteen_orders 
    SET order_status = 'completed', pickup_time = CURRENT_TIMESTAMP
    WHERE id = verification_result.order_id;
    
    -- Send notification to customer
    INSERT INTO notifications (user_id, title, message, notification_type, related_entity_id, related_entity_type)
    VALUES (
        order_info.user_id,
        'Order Completed',
        'Your order #' || order_info.order_number || ' has been successfully picked up. Thank you!',
        'order_ready',
        verification_result.order_id,
        'canteen_order'
    );
    
    -- Return success with order details
    RETURN QUERY SELECT 
        true,
        'Order successfully scanned and completed',
        json_build_object(
            'order_id', order_info.id,
            'order_number', order_info.order_number,
            'customer_name', order_info.customer_name,
            'total_amount', order_info.final_amount,
            'items', order_info.items
        )::JSONB;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PAYMENT PROCESSING FUNCTIONS
-- =============================================================================

-- Function to process canteen payment
CREATE OR REPLACE FUNCTION process_canteen_payment(
    order_id INTEGER,
    payment_method_input payment_method,
    amount_paid DECIMAL(10,2)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    receipt_data JSONB
) AS $$
DECLARE
    order_info RECORD;
    new_balance DECIMAL(10,2);
BEGIN
    -- Get order information
    SELECT co.*, u.wallet_balance, u.full_name
    INTO order_info
    FROM canteen_orders co
    JOIN users u ON co.user_id = u.id
    WHERE co.id = order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Order not found', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if already paid
    IF order_info.payment_status = 'paid' THEN
        RETURN QUERY SELECT false, 'Order already paid', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Validate payment amount
    IF amount_paid < order_info.final_amount THEN
        RETURN QUERY SELECT false, 'Insufficient payment amount', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Process based on payment method
    IF payment_method_input = 'wallet' THEN
        -- Check wallet balance
        IF order_info.wallet_balance < order_info.final_amount THEN
            RETURN QUERY SELECT false, 'Insufficient wallet balance', NULL::JSONB;
            RETURN;
        END IF;
        
        -- Deduct from wallet
        new_balance := order_info.wallet_balance - order_info.final_amount;
        UPDATE users SET wallet_balance = new_balance WHERE id = order_info.user_id;
        
    ELSIF payment_method_input = 'pay_later' THEN
        -- For pay later, we'll process the payment when they scan at canteen
        NULL;
    END IF;
    
    -- Update order payment status
    UPDATE canteen_orders 
    SET 
        payment_status = CASE 
            WHEN payment_method_input = 'pay_later' THEN 'pending'
            ELSE 'paid'
        END,
        payment_method = payment_method_input,
        order_status = CASE 
            WHEN order_status = 'pending' THEN 'confirmed'
            ELSE order_status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = order_id;
    
    -- Generate QR code if payment successful
    IF payment_method_input != 'pay_later' THEN
        UPDATE canteen_orders 
        SET 
            qr_code_data = generate_qr_code_data(order_id),
            qr_code_url = '/api/qr/' || order_id || '.png'
        WHERE id = order_id;
    END IF;
    
    -- Send notification
    INSERT INTO notifications (user_id, title, message, notification_type, related_entity_id, related_entity_type)
    VALUES (
        order_info.user_id,
        CASE 
            WHEN payment_method_input = 'pay_later' THEN 'Order Confirmed - Pay at Canteen'
            ELSE 'Payment Successful'
        END,
        CASE 
            WHEN payment_method_input = 'pay_later' THEN 'Your order #' || order_info.order_number || ' is confirmed. Please pay at the canteen when picking up.'
            ELSE 'Payment of ₹' || order_info.final_amount || ' received. Your order #' || order_info.order_number || ' is being prepared.'
        END,
        'order_ready',
        order_id,
        'canteen_order'
    );
    
    -- Return success
    RETURN QUERY SELECT 
        true,
        CASE 
            WHEN payment_method_input = 'pay_later' THEN 'Order confirmed for pay later'
            ELSE 'Payment processed successfully'
        END,
        json_build_object(
            'order_number', order_info.order_number,
            'amount_paid', amount_paid,
            'payment_method', payment_method_input,
            'remaining_balance', CASE WHEN payment_method_input = 'wallet' THEN new_balance ELSE NULL END
        )::JSONB;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROOM BOOKING FUNCTIONS
-- =============================================================================

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
    room_id_input INTEGER,
    booking_date_input DATE,
    start_time_input TIME,
    end_time_input TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicts INTEGER;
BEGIN
    -- Check for existing bookings
    SELECT COUNT(*) INTO conflicts
    FROM room_bookings rb
    WHERE rb.room_id = room_id_input
    AND rb.booking_date = booking_date_input
    AND rb.booking_status IN ('approved', 'pending')
    AND (
        (start_time_input >= rb.start_time AND start_time_input < rb.end_time) OR
        (end_time_input > rb.start_time AND end_time_input <= rb.end_time) OR
        (start_time_input <= rb.start_time AND end_time_input >= rb.end_time)
    );
    
    -- Check for regular class schedule conflicts
    SELECT COUNT(*) + conflicts INTO conflicts
    FROM class_schedule cs
    WHERE cs.room_id = room_id_input
    AND cs.day_of_week = EXTRACT(DOW FROM booking_date_input) + 1
    AND cs.is_active = true
    AND (
        (start_time_input >= cs.start_time AND start_time_input < cs.end_time) OR
        (end_time_input > cs.start_time AND end_time_input <= cs.end_time) OR
        (start_time_input <= cs.start_time AND end_time_input >= cs.end_time)
    );
    
    -- Check for extra class conflicts
    SELECT COUNT(*) + conflicts INTO conflicts
    FROM extra_classes ec
    WHERE ec.room_id = room_id_input
    AND ec.class_date = booking_date_input
    AND ec.booking_status = 'approved'
    AND (
        (start_time_input >= ec.start_time AND start_time_input < ec.end_time) OR
        (end_time_input > ec.start_time AND end_time_input <= ec.end_time) OR
        (start_time_input <= ec.start_time AND end_time_input >= ec.end_time)
    );
    
    RETURN conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to book a room
CREATE OR REPLACE FUNCTION book_room(
    room_id_input INTEGER,
    user_id_input INTEGER,
    booking_date_input DATE,
    start_time_input TIME,
    end_time_input TIME,
    purpose_input TEXT,
    expected_attendees_input INTEGER DEFAULT NULL,
    special_requirements_input TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    booking_id INTEGER,
    reference_number TEXT
) AS $$
DECLARE
    new_booking_id INTEGER;
    is_available BOOLEAN;
    room_info RECORD;
BEGIN
    -- Check if room exists and is available
    SELECT r.*, r.is_available INTO room_info
    FROM rooms r
    WHERE r.id = room_id_input;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Room not found', NULL::INTEGER, NULL::TEXT;
        RETURN;
    END IF;
    
    IF NOT room_info.is_available THEN
        RETURN QUERY SELECT false, 'Room is not available for booking', NULL::INTEGER, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check availability for the time slot
    SELECT check_room_availability(room_id_input, booking_date_input, start_time_input, end_time_input)
    INTO is_available;
    
    IF NOT is_available THEN
        RETURN QUERY SELECT false, 'Room is not available for the requested time slot', NULL::INTEGER, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Create booking
    INSERT INTO room_bookings (
        room_id, booked_by, booking_date, start_time, end_time,
        purpose, expected_attendees, special_requirements
    ) VALUES (
        room_id_input, user_id_input, booking_date_input, start_time_input, end_time_input,
        purpose_input, expected_attendees_input, special_requirements_input
    ) RETURNING id INTO new_booking_id;
    
    -- Get the generated reference number
    SELECT booking_reference INTO reference_number
    FROM room_bookings WHERE id = new_booking_id;
    
    -- Send notification to user
    INSERT INTO notifications (user_id, title, message, notification_type, related_entity_id, related_entity_type)
    VALUES (
        user_id_input,
        'Room Booking Request Submitted',
        'Your request to book ' || room_info.room_number || ' on ' || booking_date_input || ' has been submitted for approval. Reference: ' || reference_number,
        'booking_update',
        new_booking_id,
        'room_booking'
    );
    
    RETURN QUERY SELECT true, 'Room booking request submitted successfully', new_booking_id, reference_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TIMETABLE MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to update class schedule
CREATE OR REPLACE FUNCTION update_class_schedule(
    schedule_id_input INTEGER,
    faculty_id_input INTEGER,
    new_room_id INTEGER DEFAULT NULL,
    new_start_time TIME DEFAULT NULL,
    new_end_time TIME DEFAULT NULL,
    new_date DATE DEFAULT NULL, -- For one-time changes
    change_reason TEXT DEFAULT NULL,
    is_permanent_change BOOLEAN DEFAULT false
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    affected_students INTEGER
) AS $$
DECLARE
    old_schedule RECORD;
    new_values JSONB;
    old_values JSONB;
    student_count INTEGER;
BEGIN
    -- Get current schedule
    SELECT * INTO old_schedule
    FROM class_schedule
    WHERE id = schedule_id_input;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Schedule not found', 0;
        RETURN;
    END IF;
    
    -- Count affected students
    SELECT COUNT(*) INTO student_count
    FROM users
    WHERE role = 'student'
    AND course = old_schedule.course
    AND semester = old_schedule.semester;
    
    -- Prepare old and new values for logging
    old_values := json_build_object(
        'room_id', old_schedule.room_id,
        'start_time', old_schedule.start_time,
        'end_time', old_schedule.end_time
    );
    
    new_values := json_build_object(
        'room_id', COALESCE(new_room_id, old_schedule.room_id),
        'start_time', COALESCE(new_start_time, old_schedule.start_time),
        'end_time', COALESCE(new_end_time, old_schedule.end_time)
    );
    
    -- If it's a permanent change, update the schedule
    IF is_permanent_change THEN
        UPDATE class_schedule
        SET 
            room_id = COALESCE(new_room_id, room_id),
            start_time = COALESCE(new_start_time, start_time),
            end_time = COALESCE(new_end_time, end_time),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = schedule_id_input;
    END IF;
    
    -- Log the change
    INSERT INTO timetable_changes (
        schedule_id, changed_by, change_type, old_values, new_values,
        reason, affected_date, is_permanent
    ) VALUES (
        schedule_id_input, faculty_id_input, 
        CASE 
            WHEN new_room_id IS NOT NULL THEN 'room_change'
            WHEN new_start_time IS NOT NULL OR new_end_time IS NOT NULL THEN 'reschedule'
            ELSE 'modification'
        END,
        old_values, new_values, change_reason, new_date, is_permanent_change
    );
    
    RETURN QUERY SELECT true, 'Schedule updated successfully', student_count;
END;
$$ LANGUAGE plpgsql;

-- Function to request extra class
CREATE OR REPLACE FUNCTION request_extra_class(
    subject_id_input INTEGER,
    requested_by_input INTEGER,
    faculty_id_input INTEGER,
    class_date_input DATE,
    start_time_input TIME,
    end_time_input TIME,
    topic_input TEXT DEFAULT NULL,
    reason_input TEXT DEFAULT NULL,
    max_students_input INTEGER DEFAULT 50
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    class_id INTEGER
) AS $$
DECLARE
    new_class_id INTEGER;
    subject_info RECORD;
    requester_info RECORD;
BEGIN
    -- Get subject and requester information
    SELECT s.*, c.course_name INTO subject_info
    FROM subjects s
    JOIN courses c ON s.course_id = c.id
    WHERE s.id = subject_id_input;
    
    SELECT * INTO requester_info
    FROM users
    WHERE id = requested_by_input;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Subject or requester not found', NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Create extra class request
    INSERT INTO extra_classes (
        subject_id, requested_by, faculty_id, class_date, start_time, end_time,
        topic, reason, max_students
    ) VALUES (
        subject_id_input, requested_by_input, faculty_id_input, class_date_input,
        start_time_input, end_time_input, topic_input, reason_input, max_students_input
    ) RETURNING id INTO new_class_id;
    
    -- Send notification to faculty
    INSERT INTO notifications (user_id, title, message, notification_type, related_entity_id, related_entity_type)
    VALUES (
        faculty_id_input,
        'Extra Class Request',
        requester_info.full_name || ' has requested an extra class for ' || subject_info.subject_name || ' on ' || class_date_input,
        'booking_update',
        new_class_id,
        'extra_class'
    );
    
    RETURN QUERY SELECT true, 'Extra class request submitted successfully', new_class_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTIFICATION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to send bulk notifications
CREATE OR REPLACE FUNCTION send_bulk_notification(
    title_input TEXT,
    message_input TEXT,
    notification_type_input notification_type,
    target_role user_role DEFAULT NULL,
    target_course TEXT DEFAULT NULL,
    target_semester INTEGER DEFAULT NULL,
    is_urgent_input BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    target_users CURSOR FOR 
        SELECT id FROM users 
        WHERE (target_role IS NULL OR role = target_role)
        AND (target_course IS NULL OR course = target_course)
        AND (target_semester IS NULL OR semester = target_semester)
        AND is_active = true;
    user_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Insert notifications for all matching users
    FOR user_record IN target_users LOOP
        INSERT INTO notifications (
            user_id, title, message, notification_type, is_urgent
        ) VALUES (
            user_record.id, title_input, message_input, notification_type_input, is_urgent_input
        );
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    user_id_input INTEGER,
    notification_ids INTEGER[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF notification_ids IS NULL THEN
        -- Mark all unread notifications as read
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE user_id = user_id_input AND is_read = false;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE user_id = user_id_input AND id = ANY(notification_ids) AND is_read = false;
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- =============================================================================

-- Function to get canteen sales report
CREATE OR REPLACE FUNCTION get_canteen_sales_report(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    total_orders INTEGER,
    total_revenue DECIMAL(12,2),
    avg_order_value DECIMAL(8,2),
    top_item TEXT,
    top_item_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            co.created_at::DATE as order_date,
            COUNT(*) as order_count,
            SUM(co.final_amount) as revenue,
            AVG(co.final_amount) as avg_value
        FROM canteen_orders co
        WHERE co.created_at::DATE BETWEEN start_date AND end_date
        AND co.order_status = 'completed'
        GROUP BY co.created_at::DATE
    ),
    top_items AS (
        SELECT 
            co.created_at::DATE as order_date,
            cmi.item_name,
            SUM(coi.quantity) as total_quantity,
            ROW_NUMBER() OVER (PARTITION BY co.created_at::DATE ORDER BY SUM(coi.quantity) DESC) as rn
        FROM canteen_orders co
        JOIN canteen_order_items coi ON co.id = coi.order_id
        JOIN canteen_menu_items cmi ON coi.menu_item_id = cmi.id
        WHERE co.created_at::DATE BETWEEN start_date AND end_date
        AND co.order_status = 'completed'
        GROUP BY co.created_at::DATE, cmi.item_name
    )
    SELECT 
        ds.order_date,
        ds.order_count,
        ds.revenue,
        ds.avg_value,
        ti.item_name,
        ti.total_quantity::INTEGER
    FROM daily_stats ds
    LEFT JOIN top_items ti ON ds.order_date = ti.order_date AND ti.rn = 1
    ORDER BY ds.order_date;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Advanced Feature Functions Created Successfully!' as status;
