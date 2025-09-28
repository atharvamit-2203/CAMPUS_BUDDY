#!/usr/bin/env python3
"""
Test script for Campus Connect Backend API
Run this to test login and registration endpoints
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API is running!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure the server is running on port 8000")
        return False

def test_get_colleges():
    """Test getting colleges list"""
    try:
        response = requests.get(f"{BASE_URL}/colleges")
        if response.status_code == 200:
            colleges = response.json()
            print(f"✅ Found {len(colleges)} colleges")
            for college in colleges[:3]:  # Show first 3
                print(f"  - {college['name']} ({college['code']})")
            return True
        else:
            print(f"❌ Failed to get colleges: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting colleges: {e}")
        return False

def test_register_user():
    """Test user registration"""
    test_user = {
        "username": "test_student_2025",
        "email": "test.student@mpstme.edu.in",
        "password": "testpassword123",
        "full_name": "Test Student",
        "role": "student",
        "college_id": 1,
        "student_id": "TEST2025001",
        "course": "Computer Science Engineering",
        "branch": "Computer Science",
        "semester": "Sixth",
        "academic_year": "2024-25",
        "batch": "Class of 2025",
        "department": "Computer Science",
        "bio": "Test student for API testing",
        "phone_number": "+91-9999999999"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        if response.status_code == 200:
            result = response.json()
            print("✅ User registration successful!")
            print(f"  User ID: {result['user']['id']}")
            print(f"  Username: {result['user']['username']}")
            print(f"  Token: {result['access_token'][:20]}...")
            return result['access_token']
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print(f"❌ Registration failed: {error_detail}")
            return None
    except Exception as e:
        print(f"❌ Error during registration: {e}")
        return None

def test_login_user():
    """Test user login"""
    login_data = {
        "email": "test.student@mpstme.edu.in",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ User login successful!")
            print(f"  User: {result['user']['full_name']}")
            print(f"  Role: {result['user']['role']}")
            print(f"  Token: {result['access_token'][:20]}...")
            return result['access_token']
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print(f"❌ Login failed: {error_detail}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def test_get_user_info(token):
    """Test getting current user info"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print("✅ User info retrieved successfully!")
            print(f"  Name: {user['full_name']}")
            print(f"  Email: {user['email']}")
            print(f"  Role: {user['role']}")
            print(f"  Department: {user.get('department', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to get user info: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting user info: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Campus Connect Backend API")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing API Health Check...")
    if not test_health_check():
        print("❌ API is not running. Please start the server first.")
        print("   Run: uvicorn main:app --reload")
        return
    
    # Test 2: Get colleges
    print("\n2. Testing Get Colleges...")
    test_get_colleges()
    
    # Test 3: Register user
    print("\n3. Testing User Registration...")
    token = test_register_user()
    
    # Test 4: Login user
    print("\n4. Testing User Login...")
    if not token:  # If registration failed, try login
        token = test_login_user()
    
    # Test 5: Get user info
    if token:
        print("\n5. Testing Get User Info...")
        test_get_user_info(token)
    
    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")

if __name__ == "__main__":
    main()
