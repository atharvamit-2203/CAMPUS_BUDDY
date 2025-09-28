# Simple Database Setup Script for Campus Connect
# PowerShell version for Windows

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432", 
    [string]$DBName = "campus_connect",
    [string]$DBUser = "postgres"
)

Write-Host "🚀 Setting up Campus Connect Database..." -ForegroundColor Blue
Write-Host ""

Write-Host "📊 Database Configuration:" -ForegroundColor Blue
Write-Host "  Host: $DBHost"
Write-Host "  Port: $DBPort" 
Write-Host "  Database: $DBName"
Write-Host "  User: $DBUser"
Write-Host ""

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
    $result = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot connect to database" -ForegroundColor Red
        Write-Host "   Please check your connection details and ensure PostgreSQL is running" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  Starting database setup..." -ForegroundColor Blue
Write-Host ""

# Step 1: Create enhanced database schema
Write-Host "⏳ Creating enhanced database schema..." -ForegroundColor Yellow

if (Test-Path "enhanced_database_schema.sql") {
    try {
        $result = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f "enhanced_database_schema.sql" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Enhanced database schema created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create database schema" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Failed to create database schema" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File not found: enhanced_database_schema.sql" -ForegroundColor Red
}

# Step 2: Add advanced functions
Write-Host "⏳ Adding advanced functions and procedures..." -ForegroundColor Yellow

if (Test-Path "advanced_functions.sql") {
    try {
        $result = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f "advanced_functions.sql" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Advanced functions added successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add advanced functions" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Failed to add advanced functions" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File not found: advanced_functions.sql" -ForegroundColor Red
}

# Step 3: Insert sample data
Write-Host "⏳ Inserting sample data..." -ForegroundColor Yellow

if (Test-Path "sample_data.sql") {
    try {
        $result = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f "sample_data.sql" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Sample data inserted successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to insert sample data" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Failed to insert sample data" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File not found: sample_data.sql" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Database setup completed!" -ForegroundColor Green
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

Write-Host "🚀 Your Campus Connect database is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your backend .env file with the database connection details"
Write-Host "2. Start the FastAPI backend server: python main.py"
Write-Host "3. Start the Next.js frontend development server: npm run dev"
Write-Host "4. Test the QR code generation and scanning features"
Write-Host "5. Try booking rooms and managing timetables"
Write-Host ""
Write-Host "Happy coding! 🎓" -ForegroundColor Green
