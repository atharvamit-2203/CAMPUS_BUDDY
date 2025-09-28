"""
Utility script to generate bcrypt hashes for testing
"""
import bcrypt

def generate_bcrypt_hash(password: str) -> str:
    """Generate a bcrypt hash for a given password."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_bcrypt_hash(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

if __name__ == "__main__":
    # Test password
    test_password = "testpassword123"
    
    # Generate hash
    generated_hash = generate_bcrypt_hash(test_password)
    print(f"Password: {test_password}")
    print(f"Generated Hash: {generated_hash}")
    
    # Verify the hash
    is_valid = verify_bcrypt_hash(test_password, generated_hash)
    print(f"Verification: {is_valid}")
    
    # Test with existing hash
    existing_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeblmIYZAC.sZxdhe"
    is_valid_existing = verify_bcrypt_hash(test_password, existing_hash)
    print(f"Existing hash verification: {is_valid_existing}")
