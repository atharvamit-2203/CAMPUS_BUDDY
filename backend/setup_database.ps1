# Database Setup Script for Campus Connect
# PowerShell version for Windows
# Run this script to set up the complete database with all advanced features
# Usage: .\setup_database.ps1

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432", 
    [string]$DBName = "campus_connect",
    [string]$DBUser = "postgres",
    [string]$DBPassword = ""
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green" 
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

Write-Host "🚀 Setting up Campus Connect Database..." -ForegroundColor Blue
Write-Host ""

Write-Host "📊 Database Configuration:" -ForegroundColor Blue
Write-Host "  Host: $DBHost"
Write-Host "  Port: $DBPort" 
Write-Host "  Database: $DBName"
Write-Host "  User: $DBUser"
Write-Host ""

# Function to execute SQL file
function Execute-SQL {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    Write-Host "⏳ $Description..." -ForegroundColor Yellow
    
    if (Test-Path $FilePath) {
        try {
            if ($DBPassword) {
                $env:PGPASSWORD = $DBPassword
            }
            
            $result = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $FilePath 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $Description completed successfully" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ $Description failed" -ForegroundColor Red
                Write-Host "   Error: $result" -ForegroundColor Red
                return $false
            }
        }
        catch {
            Write-Host "❌ $Description failed" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
        finally {
            if ($DBPassword) {
                Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL client (psql) found" -ForegroundColor Green
}
catch {
    Write-Host "❌ PostgreSQL client (psql) is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL and ensure psql is in your PATH" -ForegroundColor Red
    exit 1
}

# Test database connection
Write-Host "🔗 Testing database connection..." -ForegroundColor Yellow

try {
    if ($DBPassword) {
        $env:PGPASSWORD = $DBPassword
    }
    
    $result = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot connect to database" -ForegroundColor Red
        Write-Host "   Please check your connection details and ensure PostgreSQL is running" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    if ($DBPassword) {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "🏗️  Starting database setup..." -ForegroundColor Blue
Write-Host ""

# Step 1: Create enhanced database schema
$success1 = Execute-SQL -FilePath "enhanced_database_schema.sql" -Description "Creating enhanced database schema"

# Step 2: Add advanced functions  
$success2 = Execute-SQL -FilePath "advanced_functions.sql" -Description "Adding advanced functions and procedures"

# Step 3: Insert additional sample data if file exists
$success3 = $true
if (Test-Path "sample_data.sql") {
    $success3 = Execute-SQL -FilePath "sample_data.sql" -Description "Inserting sample data"
}

Write-Host ""

if ($success1 -and $success2 -and $success3) {
    Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database setup completed with some errors" -ForegroundColor Yellow
}

Write-Host ""

# Display setup summary
Write-Host "📋 Setup Summary:" -ForegroundColor Blue
Write-Host "✅ Enhanced database schema with all tables" -ForegroundColor Green
Write-Host "✅ Advanced functions for QR codes, payments, and notifications" -ForegroundColor Green  
Write-Host "✅ Room booking and timetable management" -ForegroundColor Green
Write-Host "✅ Canteen ordering system with QR code support" -ForegroundColor Green
Write-Host "✅ Comprehensive notification system" -ForegroundColor Green
Write-Host "✅ Analytics and reporting functions" -ForegroundColor Green
Write-Host ""

# Display table count
Write-Host "📊 Database Statistics:" -ForegroundColor Yellow

try {
    if ($DBPassword) {
        $env:PGPASSWORD = $DBPassword
    }
    
    $tableCount = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $functionCount = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';" 2>$null
    
    Write-Host "  Tables created: $($tableCount.Trim())"
    Write-Host "  Functions created: $($functionCount.Trim())"
}
catch {
    Write-Host "  Could not retrieve statistics" -ForegroundColor Yellow
}
finally {
    if ($DBPassword) {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host ""

# Display some key tables
Write-Host "🔍 Key Tables Created:" -ForegroundColor Blue

try {
    if ($DBPassword) {
        $env:PGPASSWORD = $DBPassword
    }
    
    & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c @"
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
"@ 2>$null
}
catch {
    Write-Host "Could not display table information" -ForegroundColor Yellow
}
finally {
    if ($DBPassword) {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "🚀 Your Campus Connect database is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your backend .env file with the database connection details"
Write-Host "2. Start the FastAPI backend server: python main.py"
Write-Host "3. Start the Next.js frontend development server: npm run dev"
Write-Host "4. Test the QR code generation and scanning features"
Write-Host "5. Try booking rooms and managing timetables"
Write-Host ""
Write-Host "💡 Pro Tips:" -ForegroundColor Blue
Write-Host "• Use the analytics endpoints to monitor canteen sales and room utilization"
Write-Host "• Set up automated notifications for timetable changes"
Write-Host "• Test the complete canteen ordering flow with QR code scanning"
Write-Host "• Explore the room booking system for optimal space management"
Write-Host ""
Write-Host "Happy coding! 🎓" -ForegroundColor Green

# Pause to keep window open if run directly
if ($Host.Name -eq "ConsoleHost") {
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
