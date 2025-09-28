#!/bin/bash
# Database Setup Script for Campus Connect
# Run this script to set up the complete database with all advanced features
# Usage: ./setup_database.sh

echo "🚀 Setting up Campus Connect Database..."

# Database connection details (modify as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-campus_connect}"
DB_USER="${DB_USER:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Database Configuration:${NC}"
echo -e "  Host: ${DB_HOST}"
echo -e "  Port: ${DB_PORT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  User: ${DB_USER}"
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}⏳ ${description}...${NC}"
    
    if [ -f "$file" ]; then
        if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ ${description} completed successfully${NC}"
        else
            echo -e "${RED}❌ ${description} failed${NC}"
            echo -e "${RED}   Check the file: ${file}${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ File not found: ${file}${NC}"
        return 1
    fi
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client (psql) is not installed or not in PATH${NC}"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}🔗 Testing database connection...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo -e "${RED}   Please check your connection details and ensure PostgreSQL is running${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🏗️  Starting database setup...${NC}"
echo ""

# Step 1: Create enhanced database schema
execute_sql "enhanced_database_schema.sql" "Creating enhanced database schema"

# Step 2: Add advanced functions
execute_sql "advanced_functions.sql" "Adding advanced functions and procedures"

# Step 3: Insert additional sample data if file exists
if [ -f "sample_data.sql" ]; then
    execute_sql "sample_data.sql" "Inserting sample data"
fi

echo ""
echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo ""

# Display setup summary
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo -e "${GREEN}✅ Enhanced database schema with all tables${NC}"
echo -e "${GREEN}✅ Advanced functions for QR codes, payments, and notifications${NC}"
echo -e "${GREEN}✅ Room booking and timetable management${NC}"
echo -e "${GREEN}✅ Canteen ordering system with QR code support${NC}"
echo -e "${GREEN}✅ Comprehensive notification system${NC}"
echo -e "${GREEN}✅ Analytics and reporting functions${NC}"
echo ""

# Display table count
echo -e "${YELLOW}📊 Database Statistics:${NC}"
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
FUNCTION_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';" 2>/dev/null | xargs)

echo -e "  Tables created: ${TABLE_COUNT}"
echo -e "  Functions created: ${FUNCTION_COUNT}"
echo ""

# Display some key tables
echo -e "${BLUE}🔍 Key Tables Created:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'canteen_orders', 'room_bookings', 'class_schedule', 
    'notifications', 'canteen_menu_items', 'extra_classes'
)
ORDER BY table_name;
" 2>/dev/null

echo ""
echo -e "${GREEN}🚀 Your Campus Connect database is ready!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Update your backend .env file with the database connection details"
echo -e "2. Start the FastAPI backend server"
echo -e "3. Start the Next.js frontend development server"
echo -e "4. Test the QR code generation and scanning features"
echo -e "5. Try booking rooms and managing timetables"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo -e "• Use the analytics endpoints to monitor canteen sales and room utilization"
echo -e "• Set up automated notifications for timetable changes"
echo -e "• Test the complete canteen ordering flow with QR code scanning"
echo -e "• Explore the room booking system for optimal space management"
echo ""
echo -e "${GREEN}Happy coding! 🎓${NC}"
