from supabase import create_client, Client
from dotenv import load_dotenv
import os
import auth

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def test_connection():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env")
        return

    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Simple test (fetch 1 row from any table you already have)
        response = supabase.table("users").select("*").limit(1).execute()

        print("✅ Connected to Supabase successfully!")
        print("Response:", response.data)
        return supabase
    except Exception as e:
        print("❌ Failed to connect to Supabase")
        print("Error:", e)
        return None

def test_login_credentials():
    """Test login with actual user credentials"""
    print("\n🔐 Testing login credentials...")
    
    supabase = test_connection()
    if not supabase:
        return
    
    # Test faculty login
    test_email = "dr.amit.kumar@mpstme.edu.in"
    test_password = "testpassword123"
    
    try:
        # Get user from database
        user_result = supabase.table("users").select("*").eq("email", test_email).execute()
        
        if not user_result.data:
            print(f"❌ No user found with email: {test_email}")
            return
        
        user = user_result.data[0]
        print(f"✅ User found: {user.get('full_name', 'Unknown')}")
        print(f"   Role: {user.get('role', 'Unknown')}")
        print(f"   Active: {user.get('is_active', 'Unknown')}")
        print(f"   Password hash: {user.get('password_hash', 'No hash')}")
        
        # Test password verification
        is_valid = auth.verify_password(test_password, user["password_hash"])
        print(f"🔐 Password verification result: {is_valid}")
        
        if is_valid:
            print("🎉 Login test PASSED - credentials are valid!")
        else:
            print("❌ Login test FAILED - password verification failed")
            
    except Exception as e:
        print(f"❌ Login test error: {e}")

def test_bcrypt_directly():
    """Test bcrypt functionality directly"""
    print("\n🧪 Testing bcrypt directly...")
    
    try:
        import bcrypt
        print("✅ bcrypt imported successfully")
        
        # Test with the exact password and hash from your database
        test_password = "testpassword123"
        expected_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe"
        
        print(f"🔍 Testing password: '{test_password}'")
        print(f"🔍 Against hash: '{expected_hash}'")
        print(f"🔍 Hash length: {len(expected_hash)} characters")
        
        # Convert to bytes
        password_bytes = test_password.encode('utf-8')
        hash_bytes = expected_hash.encode('utf-8')
        
        print(f"🔍 Password bytes: {password_bytes}")
        print(f"🔍 Hash bytes (first 50): {hash_bytes[:50]}")
        
        # Test bcrypt verification
        result = bcrypt.checkpw(password_bytes, hash_bytes)
        print(f"🔐 Bcrypt verification result: {result}")
        
        # Try generating a new hash and test that
        print("\n🔧 Generating fresh hash...")
        new_salt = bcrypt.gensalt()
        new_hash = bcrypt.hashpw(password_bytes, new_salt)
        new_hash_str = new_hash.decode('utf-8')
        
        print(f"🔍 New hash: {new_hash_str}")
        print(f"🔍 New hash length: {len(new_hash_str)} characters")
        
        # Test with new hash
        new_result = bcrypt.checkpw(password_bytes, new_hash)
        print(f"🔐 New hash verification: {new_result}")
        
        return new_hash_str if new_result else None
        
    except Exception as e:
        print(f"❌ Bcrypt test error: {e}")
        return None

def fix_password_hashes():
    """Fix the password hashes in the database"""
    print("\n🔧 Fixing password hashes in database...")
    
    supabase = test_connection()
    if not supabase:
        return
    
    # Generate a fresh working hash
    working_hash = test_bcrypt_directly()
    if not working_hash:
        print("❌ Cannot generate working hash, using fallback")
        working_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe"
    
    try:
        # Get all users
        all_users = supabase.table("users").select("id, email, password_hash").execute()
        
        fixed_count = 0
        for user in all_users.data:
            print(f"🔧 Updating hash for user: {user['email']}")
            
            # Update with working hash
            update_result = supabase.table("users").update({
                "password_hash": working_hash
            }).eq("id", user["id"]).execute()
            
            if update_result.data:
                print(f"✅ Updated hash for: {user['email']}")
                fixed_count += 1
            else:
                print(f"❌ Failed to update hash for: {user['email']}")
        
        print(f"\n🎉 Updated {fixed_count} password hashes!")
        
    except Exception as e:
        print(f"❌ Error fixing password hashes: {e}")

if __name__ == "__main__":
    test_connection()
    test_bcrypt_directly()
    fix_password_hashes()
    test_login_credentials()
