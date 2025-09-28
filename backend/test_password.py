#!/usr/bin/env python3
"""
Quick test to verify bcrypt password hashing is working correctly
"""

from passlib.context import CryptContext

# Create the same context as in auth.py
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12
)

def test_password_verification():
    """Test if password verification works"""
    
    # The hash from the database
    stored_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe"
    
    # Test passwords
    test_passwords = [
        "testpassword123",
        "password123", 
        "123456",
        "admin",
        "student",
        "password"
    ]
    
    print("Testing password verification:")
    print(f"Stored hash: {stored_hash}")
    print("-" * 50)
    
    for password in test_passwords:
        try:
            is_valid = pwd_context.verify(password, stored_hash)
            print(f"Password '{password}': {'✅ VALID' if is_valid else '❌ INVALID'}")
            if is_valid:
                print(f"🎉 FOUND CORRECT PASSWORD: '{password}'")
                return password
        except Exception as e:
            print(f"Password '{password}': ❌ ERROR - {e}")
    
    print("\n❌ None of the test passwords worked")
    return None

def test_create_new_hash():
    """Create a new hash for 'testpassword123' to compare"""
    password = "testpassword123"
    try:
        new_hash = pwd_context.hash(password)
        print(f"\nNew hash for '{password}':")
        print(f"{new_hash}")
        
        # Verify the new hash works
        is_valid = pwd_context.verify(password, new_hash)
        print(f"New hash verification: {'✅ VALID' if is_valid else '❌ INVALID'}")
        
        return new_hash
    except Exception as e:
        print(f"❌ Error creating new hash: {e}")
        return None

if __name__ == "__main__":
    print("🔐 Password Verification Test")
    print("=" * 50)
    
    # Test existing hash
    correct_password = test_password_verification()
    
    # Create new hash for comparison
    test_create_new_hash()
    
    if correct_password:
        print(f"\n✅ Use password: '{correct_password}' for login")
    else:
        print("\n❌ Could not find the correct password")
