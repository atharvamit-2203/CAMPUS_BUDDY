import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_faculty_endpoints():
    """Test faculty dashboard endpoints"""
    print("Testing Faculty Dashboard Endpoints...")
    print("=" * 50)
    
    # Test data for login (you may need to adjust this based on your actual data)
    login_data = {
        "email": "faculty@example.com",
        "password": "password123"
    }
    
    try:
        # Test login endpoint first
        print("1. Testing Login...")
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            print("✅ Login successful")
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print("❌ Login failed, using mock headers for testing")
            headers = {"Authorization": "Bearer mock_token"}
        
        # Test faculty endpoints
        endpoints = [
            "/faculty/courses",
            "/faculty/students", 
            "/faculty/research",
            "/faculty/events",
            "/faculty/assignments",
            "/faculty/analytics"
        ]
        
        print("\n2. Testing Faculty Endpoints...")
        for endpoint in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
                if response.status_code == 200:
                    print(f"✅ {endpoint} - Status: {response.status_code}")
                    data = response.json()
                    if 'data' in data:
                        print(f"   Data items: {len(data['data'])}")
                else:
                    print(f"❌ {endpoint} - Status: {response.status_code}")
                    print(f"   Error: {response.text}")
            except Exception as e:
                print(f"❌ {endpoint} - Error: {str(e)}")
        
        print("\n3. Testing POST Endpoints...")
        
        # Test course creation
        course_data = {
            "name": "Test Course",
            "code": "TC101",
            "description": "Test course description",
            "credits": 3,
            "semester": "Fall 2025",
            "schedule": "Mon, Wed, Fri - 10:00 AM"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/faculty/courses", json=course_data, headers=headers)
            if response.status_code in [200, 201]:
                print(f"✅ Course creation - Status: {response.status_code}")
            else:
                print(f"❌ Course creation - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Course creation - Error: {str(e)}")
        
        # Test assignment creation
        assignment_data = {
            "title": "Test Assignment",
            "description": "Test assignment description",
            "course_id": 1,
            "due_date": "2025-09-30T23:59:59Z",
            "max_marks": 100
        }
        
        try:
            response = requests.post(f"{BASE_URL}/faculty/assignments", json=assignment_data, headers=headers)
            if response.status_code in [200, 201]:
                print(f"✅ Assignment creation - Status: {response.status_code}")
            else:
                print(f"❌ Assignment creation - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Assignment creation - Error: {str(e)}")
            
    except Exception as e:
        print(f"❌ General error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Faculty endpoint testing completed!")

def test_api_health():
    """Test basic API health"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API Health Check - Server is running")
            return True
        else:
            print("❌ API Health Check - Server not responding properly")
            return False
    except Exception as e:
        print(f"❌ API Health Check - Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Faculty Dashboard API Testing")
    print("=" * 50)
    
    # Test API health first
    if test_api_health():
        test_faculty_endpoints()
    else:
        print("Cannot proceed with testing - API server not accessible")
        print("Make sure the backend server is running on http://localhost:8000")
