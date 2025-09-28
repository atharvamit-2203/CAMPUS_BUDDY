from datetime import timedelta, datetime
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import schemas
import auth
from database import get_db, get_mysql_connection, test_connection, init_db
from config import settings

# Import advanced API router
try:
    from advanced_api import router as advanced_router
    ADVANCED_API_AVAILABLE = True
    print("✅ Advanced API module loaded")
except ImportError as e:
    ADVANCED_API_AVAILABLE = False
    print(f"⚠️  Advanced API module not available: {e}")

# Import AI API router
try:
    from ai_endpoints import ai_router
    AI_API_AVAILABLE = True
    print("✅ AI API module loaded")
except ImportError as e:
    AI_API_AVAILABLE = False
    print(f"⚠️  AI API module not available: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Campus Connect API",
    description="Backend API for Campus Connect - Inter-college platform with advanced features",
    version="2.0.0"
)

# Startup logging (remove the deprecated event handler)
print("🚀 Starting Campus Connect API...")
try:
    print(f"✅ FastAPI initialized")
    print(f"✅ Auth module loaded")
    print(f"✅ Database module loaded") 
    print(f"✅ Schemas module loaded")
    print(f"✅ Config loaded - CORS origins: {settings.ALLOWED_ORIGINS}")
    
    # Test database connection
    if test_connection():
        print("✅ MySQL database connection successful")
    else:
        print("⚠️  MySQL database connection failed")
    
    print("🎉 All systems ready!")
except Exception as e:
    print(f"❌ Startup warning: {e}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include advanced API routes if available
if ADVANCED_API_AVAILABLE:
    app.include_router(advanced_router, prefix="/api/v2", tags=["Advanced Features"])
    print("✅ Advanced API routes included at /api/v2")

# Include AI API routes if available
if AI_API_AVAILABLE:
    app.include_router(ai_router, prefix="/api", tags=["AI Features"])
    print("✅ AI API routes included at /api/ai")

@app.get("/")
async def root():
    return {
        "message": "Campus Connect API is running!", 
        "version": "2.0.0", 
        "status": "healthy",
        "features": {
            "basic_api": True,
            "advanced_api": ADVANCED_API_AVAILABLE,
            "qr_codes": ADVANCED_API_AVAILABLE,
            "room_booking": ADVANCED_API_AVAILABLE,
            "canteen_orders": ADVANCED_API_AVAILABLE,
            "timetable_management": ADVANCED_API_AVAILABLE,
            "notifications": ADVANCED_API_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    try:
        # Test basic functionality
        test_hash = auth.get_password_hash("test")
        test_verify = auth.verify_password("test", test_hash)
        
        return {
            "status": "healthy", 
            "message": "Backend is running successfully",
            "auth_working": test_verify,
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        return {
            "status": "warning",
            "message": f"Backend running with issues: {str(e)}",
            "timestamp": str(datetime.now())
        }

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!", "timestamp": "2025-12-09"}

@app.post("/auth/test-user")
async def create_test_user(db = Depends(get_db)):
    """Create a test user for login testing (MySQL version)"""
    try:
        # This is a placeholder - implement MySQL user creation here
        test_password_hash = auth.get_password_hash("testpassword123")
        
        return {
            "message": "Test user creation endpoint (MySQL)",
            "status": "success",
            "note": "Implement MySQL user creation logic here",
            "password_hash_generated": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/auth/test-password")
async def test_password_hashing(password: str = "testpassword123"):
    """Test password hashing and verification"""
    try:
        # Generate hash
        generated_hash = auth.get_password_hash(password)
        
        # Verify the generated hash
        is_valid = auth.verify_password(password, generated_hash)
        
        # Test with existing bcrypt hash (if any)
        existing_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe"
        is_valid_existing = auth.verify_password(password, existing_hash)
        
        return {
            "password": password,
            "generated_hash": generated_hash,
            "verification_new": is_valid,
            "existing_hash": existing_hash,
            "verification_existing": is_valid_existing,
            "bcrypt_working": True,
            "auth_module_loaded": True
        }
    except Exception as e:
        return {
            "error": str(e),
            "bcrypt_working": False,
            "auth_module_loaded": False
        }

@app.get("/auth/get-sample-users")
async def get_sample_users(db = Depends(get_db)):
    """Get sample users for testing (faculty and students)"""
    try:
        # TODO: Replace with MySQL query
        # users_result = supabase.table("users").select("id, username, email, full_name, role, college_id").limit(10).execute()
        
        # Placeholder response for MySQL implementation
        return {
            "message": "MySQL implementation needed",
            "users": [],
            "status": "placeholder"
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to fetch users"
        }

@app.post("/auth/register", response_model=schemas.Token)
async def register_user(user: schemas.UserRegister, db = Depends(get_db)):
    """Register a new user (MySQL placeholder)"""
    try:
        # TODO: Implement MySQL user registration
        return {
            "message": "User registration endpoint - MySQL implementation needed",
            "status": "placeholder",
            "note": "Replace with MySQL user registration logic"
        }
    
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Hash password
    hashed_password = auth.get_password_hash(user.password)
    
    # Create user data
    user_data = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_password,
        "full_name": user.full_name,
        "role": user.role,
        "college_id": user.college_id,
        "student_id": user.student_id,
        "course": user.course,
        "branch": user.branch,
        "semester": user.semester,
        "academic_year": user.academic_year,
        "batch": user.batch,
        "employee_id": user.employee_id,
        "designation": user.designation,
        "specialization": user.specialization,
        "organization_type": user.organization_type,
        "department": user.department,
        "bio": user.bio,
        "phone_number": user.phone_number,
        "is_active": True,
        "is_verified": False
    }
    
    # Insert user into Supabase
    result = supabase.table("users").insert(user_data).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    db_user = result.data[0]
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user["username"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/auth/login", response_model=schemas.Token)
async def login_user(user_credentials: schemas.UserLogin, db = Depends(get_db)):
    """Login user"""
    try:
        print(f"🔍 Login attempt for email: {user_credentials.email}")
        
        # Get user by email
        user_result = supabase.table("users").select("*").eq("email", user_credentials.email).execute()
        
        print(f"📊 Database query result: {len(user_result.data) if user_result.data else 0} users found")
        
        if not user_result.data:
            print("❌ No user found with this email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_result.data[0]
        print(f"✅ User found: {user.get('full_name', 'Unknown')} ({user.get('role', 'Unknown role')})")
        
        # Verify password
        password_verified = auth.verify_password(user_credentials.password, user["password_hash"])
        print(f"🔐 Password verification: {password_verified}")
        
        if not password_verified:
            print("❌ Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.get("is_active", True):
            print("❌ User account is deactivated")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        print("✅ Login successful, creating token...")
        
        # Update last login
        try:
            supabase.table("users").update({"last_login": "now()"}).eq("id", user["id"]).execute()
        except Exception as e:
            print(f"⚠️ Warning: Could not update last login: {e}")
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        
        print("🎉 Token created successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Unexpected login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@app.get("/auth/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user = Depends(auth.get_current_user)):
    """Get current user information"""
    return current_user

@app.get("/colleges", response_model=list[schemas.CollegeResponse])
async def get_colleges(db = Depends(get_db)):
    """Get all colleges"""
    result = supabase.table("colleges").select("*").eq("is_active", True).execute()
    return result.data

@app.get("/clubs")
async def get_clubs(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get clubs for the current user's college"""
    college_id = current_user.get("college_id")
    
    # Get clubs from the same college
    result = supabase.table("clubs").select("*").eq("college_id", college_id).eq("is_active", True).execute()
    
    # Add member count for each club
    clubs_with_count = []
    for club in result.data:
        # Get member count
        member_result = supabase.table("club_memberships").select("id", count="exact").eq("club_id", club["id"]).eq("status", "approved").execute()
        club["member_count"] = member_result.count or 0
        clubs_with_count.append(club)
    
    return clubs_with_count

@app.get("/events")
async def get_events(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get upcoming events for the current user's college"""
    college_id = current_user.get("college_id")
    
    # Get upcoming events from the same college
    result = supabase.table("events").select("*, organizer:organizer_id(full_name)").eq("college_id", college_id).gte("start_time", "now()").order("start_time").execute()
    
    return result.data

@app.get("/networking/recommendations")
async def get_networking_recommendations(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get networking recommendations for the current user"""
    college_id = current_user.get("college_id")
    user_id = current_user.get("id")
    
    # Get students from the same college (excluding current user)
    result = supabase.table("users").select("id, full_name, username, course, department, bio").eq("college_id", college_id).eq("role", "student").neq("id", user_id).limit(10).execute()
    
    return result.data

@app.get("/user/activity")
async def get_user_activity(current_user = Depends(auth.get_current_user), db = Depends(get_db)):
    """Get recent activity for the current user"""
    user_id = current_user.get("id")
    
    activities = []
    
    # Get recent club joins
    club_joins = supabase.table("club_memberships").select("*, club:club_id(name)").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
    
    for membership in club_joins.data:
        activities.append({
            "type": "club_join",
            "action": f"Joined {membership['club']['name']}",
            "time": membership["created_at"],
            "color": "bg-blue-500"
        })
    
    # Get recent event RSVPs
    event_rsvps = supabase.table("event_rsvps").select("*, event:event_id(title)").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
    
    for rsvp in event_rsvps.data:
        activities.append({
            "type": "event_rsvp",
            "action": f"RSVP'd to {rsvp['event']['title']}",
            "time": rsvp["created_at"],
            "color": "bg-green-500"
        })
    
    # Sort by time
    activities.sort(key=lambda x: x["time"], reverse=True)
    
    return activities[:10]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Campus Connect API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)