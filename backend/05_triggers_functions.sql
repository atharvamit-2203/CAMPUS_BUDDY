-- Part 5: Triggers and Functions
-- Run this after Part 4

-- Function to update member count when someone joins/leaves a club
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for club membership count
CREATE TRIGGER trigger_update_club_member_count
    AFTER INSERT OR DELETE ON club_memberships
    FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- Function to auto-create club membership when join request is approved
CREATE OR REPLACE FUNCTION auto_create_membership_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Insert into club_memberships
        INSERT INTO club_memberships (club_id, user_id, role, joined_at)
        VALUES (NEW.club_id, NEW.user_id, 'member', NOW())
        ON CONFLICT (club_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating membership on approval
CREATE TRIGGER trigger_auto_create_membership
    AFTER UPDATE ON club_join_requests
    FOR EACH ROW EXECUTE FUNCTION auto_create_membership_on_approval();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on relevant tables
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_club_requests_updated_at BEFORE UPDATE ON club_join_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_announcements_updated_at BEFORE UPDATE ON faculty_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
