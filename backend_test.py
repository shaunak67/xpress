#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Field Management Application
Tests all backend endpoints with Supabase integration
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_USER_DATA = {
    "admin": {
        "email": f"admin_{uuid.uuid4().hex[:8]}@fieldmanager.com",
        "password": "AdminPass123!",
        "fullName": "John Admin",
        "role": "admin"
    },
    "agent": {
        "email": f"agent_{uuid.uuid4().hex[:8]}@fieldmanager.com", 
        "password": "AgentPass123!",
        "fullName": "Sarah Agent",
        "role": "agent"
    }
}

# GPS coordinates for testing (New York City area)
TEST_GPS_COORDS = {
    "latitude": 40.7128,
    "longitude": -74.0060
}

class FieldManagementAPITester:
    def __init__(self):
        self.test_results = []
        self.registered_users = {}
        self.logged_in_users = {}
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        for role, user_data in TEST_USER_DATA.items():
            try:
                response = requests.post(
                    f"{BASE_URL}/auth/register",
                    headers=HEADERS,
                    json=user_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'user' in data and 'profile' in data:
                        self.registered_users[role] = {
                            'user_id': data['user']['id'],
                            'profile': data['profile'],
                            'credentials': user_data
                        }
                        self.log_test(
                            f"Register {role} user",
                            True,
                            f"Successfully registered {role} user with ID: {data['user']['id']}",
                            data
                        )
                    else:
                        self.log_test(
                            f"Register {role} user",
                            False,
                            "Registration response missing user or profile data",
                            data
                        )
                else:
                    self.log_test(
                        f"Register {role} user",
                        False,
                        f"Registration failed with status {response.status_code}",
                        response.json() if response.content else None
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Register {role} user",
                    False,
                    f"Registration error: {str(e)}"
                )
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        for role, user_info in self.registered_users.items():
            try:
                credentials = user_info['credentials']
                response = requests.post(
                    f"{BASE_URL}/auth/login",
                    headers=HEADERS,
                    json={
                        "email": credentials['email'],
                        "password": credentials['password']
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'user' in data and 'profile' in data and 'session' in data:
                        self.logged_in_users[role] = {
                            'user_id': data['user']['id'],
                            'profile': data['profile'],
                            'session': data['session']
                        }
                        self.log_test(
                            f"Login {role} user",
                            True,
                            f"Successfully logged in {role} user",
                            data
                        )
                    else:
                        self.log_test(
                            f"Login {role} user",
                            False,
                            "Login response missing required data",
                            data
                        )
                else:
                    self.log_test(
                        f"Login {role} user",
                        False,
                        f"Login failed with status {response.status_code}",
                        response.json() if response.content else None
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Login {role} user",
                    False,
                    f"Login error: {str(e)}"
                )
    
    def test_photo_upload_api(self):
        """Test photo upload API"""
        print("\n=== Testing Photo Upload API ===")
        
        if not self.registered_users:
            self.log_test("Photo Upload", False, "No registered users available for testing")
            return
            
        # Test photo upload for agent user
        agent_user = self.registered_users.get('agent')
        if agent_user:
            try:
                photo_data = {
                    "user_id": agent_user['user_id'],
                    "image_url": "https://example.com/field-photo-001.jpg",
                    "latitude": TEST_GPS_COORDS['latitude'],
                    "longitude": TEST_GPS_COORDS['longitude'],
                    "description": "Field inspection photo from downtown location"
                }
                
                response = requests.post(
                    f"{BASE_URL}/photos",
                    headers=HEADERS,
                    json=photo_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and 'users' in data:
                        self.log_test(
                            "Photo Upload",
                            True,
                            f"Successfully uploaded photo with ID: {data['id']}",
                            data
                        )
                    else:
                        self.log_test(
                            "Photo Upload",
                            False,
                            "Photo upload response missing required fields",
                            data
                        )
                else:
                    self.log_test(
                        "Photo Upload",
                        False,
                        f"Photo upload failed with status {response.status_code}",
                        response.json() if response.content else None
                    )
                    
            except Exception as e:
                self.log_test("Photo Upload", False, f"Photo upload error: {str(e)}")
    
    def test_get_photos_api(self):
        """Test get photos API"""
        print("\n=== Testing Get Photos API ===")
        
        try:
            response = requests.get(f"{BASE_URL}/photos", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get Photos",
                        True,
                        f"Successfully retrieved {len(data)} photos",
                        {"photo_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Get Photos",
                        False,
                        "Photos response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Get Photos",
                    False,
                    f"Get photos failed with status {response.status_code}",
                    response.json() if response.content else None
                )
                
        except Exception as e:
            self.log_test("Get Photos", False, f"Get photos error: {str(e)}")
    
    def test_lead_capture_api(self):
        """Test lead capture API"""
        print("\n=== Testing Lead Capture API ===")
        
        if not self.registered_users:
            self.log_test("Lead Capture", False, "No registered users available for testing")
            return
            
        # Test lead capture for agent user
        agent_user = self.registered_users.get('agent')
        if agent_user:
            try:
                lead_data = {
                    "user_id": agent_user['user_id'],
                    "contact_name": "Michael Johnson",
                    "contact_phone": "+1-555-0123",
                    "contact_email": "michael.johnson@techcorp.com",
                    "business_name": "TechCorp Solutions",
                    "latitude": TEST_GPS_COORDS['latitude'] + 0.001,
                    "longitude": TEST_GPS_COORDS['longitude'] + 0.001,
                    "notes": "Interested in enterprise field management solution. Follow up next week."
                }
                
                response = requests.post(
                    f"{BASE_URL}/leads",
                    headers=HEADERS,
                    json=lead_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and 'users' in data:
                        self.log_test(
                            "Lead Capture",
                            True,
                            f"Successfully captured lead with ID: {data['id']}",
                            data
                        )
                    else:
                        self.log_test(
                            "Lead Capture",
                            False,
                            "Lead capture response missing required fields",
                            data
                        )
                else:
                    self.log_test(
                        "Lead Capture",
                        False,
                        f"Lead capture failed with status {response.status_code}",
                        response.json() if response.content else None
                    )
                    
            except Exception as e:
                self.log_test("Lead Capture", False, f"Lead capture error: {str(e)}")
    
    def test_get_leads_api(self):
        """Test get leads API"""
        print("\n=== Testing Get Leads API ===")
        
        try:
            response = requests.get(f"{BASE_URL}/leads", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get Leads",
                        True,
                        f"Successfully retrieved {len(data)} leads",
                        {"lead_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Get Leads",
                        False,
                        "Leads response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Get Leads",
                    False,
                    f"Get leads failed with status {response.status_code}",
                    response.json() if response.content else None
                )
                
        except Exception as e:
            self.log_test("Get Leads", False, f"Get leads error: {str(e)}")
    
    def test_gps_tracking_api(self):
        """Test GPS tracking API"""
        print("\n=== Testing GPS Tracking API ===")
        
        if not self.registered_users:
            self.log_test("GPS Tracking", False, "No registered users available for testing")
            return
            
        # Test GPS tracking for agent user
        agent_user = self.registered_users.get('agent')
        if agent_user:
            try:
                # Test multiple activity types
                activities = [
                    {"activity_type": "active", "lat_offset": 0.001, "lng_offset": 0.001},
                    {"activity_type": "break", "lat_offset": 0.002, "lng_offset": 0.002},
                    {"activity_type": "idle", "lat_offset": 0.003, "lng_offset": 0.003}
                ]
                
                for activity in activities:
                    gps_data = {
                        "user_id": agent_user['user_id'],
                        "latitude": TEST_GPS_COORDS['latitude'] + activity['lat_offset'],
                        "longitude": TEST_GPS_COORDS['longitude'] + activity['lng_offset'],
                        "activity_type": activity['activity_type']
                    }
                    
                    response = requests.post(
                        f"{BASE_URL}/gps-tracking",
                        headers=HEADERS,
                        json=gps_data,
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if 'id' in data and 'users' in data:
                            self.log_test(
                                f"GPS Tracking ({activity['activity_type']})",
                                True,
                                f"Successfully recorded {activity['activity_type']} GPS data with ID: {data['id']}",
                                data
                            )
                        else:
                            self.log_test(
                                f"GPS Tracking ({activity['activity_type']})",
                                False,
                                "GPS tracking response missing required fields",
                                data
                            )
                    else:
                        self.log_test(
                            f"GPS Tracking ({activity['activity_type']})",
                            False,
                            f"GPS tracking failed with status {response.status_code}",
                            response.json() if response.content else None
                        )
                    
                    # Small delay between requests
                    time.sleep(0.5)
                    
            except Exception as e:
                self.log_test("GPS Tracking", False, f"GPS tracking error: {str(e)}")
    
    def test_get_gps_tracking_api(self):
        """Test get GPS tracking API"""
        print("\n=== Testing Get GPS Tracking API ===")
        
        try:
            response = requests.get(f"{BASE_URL}/gps-tracking", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get GPS Tracking",
                        True,
                        f"Successfully retrieved {len(data)} GPS tracking records",
                        {"tracking_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Get GPS Tracking",
                        False,
                        "GPS tracking response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Get GPS Tracking",
                    False,
                    f"Get GPS tracking failed with status {response.status_code}",
                    response.json() if response.content else None
                )
                
        except Exception as e:
            self.log_test("Get GPS Tracking", False, f"Get GPS tracking error: {str(e)}")
    
    def test_user_management_api(self):
        """Test user management API"""
        print("\n=== Testing User Management API ===")
        
        # Test get all users
        try:
            response = requests.get(f"{BASE_URL}/users", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get Users",
                        True,
                        f"Successfully retrieved {len(data)} users",
                        {"user_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Get Users",
                        False,
                        "Users response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Get Users",
                    False,
                    f"Get users failed with status {response.status_code}",
                    response.json() if response.content else None
                )
                
        except Exception as e:
            self.log_test("Get Users", False, f"Get users error: {str(e)}")
        
        # Test update user role
        if self.registered_users.get('agent'):
            try:
                agent_user = self.registered_users['agent']
                user_id = agent_user['user_id']
                
                response = requests.put(
                    f"{BASE_URL}/users/{user_id}/role",
                    headers=HEADERS,
                    json={"role": "admin"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'role' in data and data['role'] == 'admin':
                        self.log_test(
                            "Update User Role",
                            True,
                            f"Successfully updated user role to admin",
                            data
                        )
                    else:
                        self.log_test(
                            "Update User Role",
                            False,
                            "Role update response missing or incorrect role",
                            data
                        )
                else:
                    self.log_test(
                        "Update User Role",
                        False,
                        f"Update user role failed with status {response.status_code}",
                        response.json() if response.content else None
                    )
                    
            except Exception as e:
                self.log_test("Update User Role", False, f"Update user role error: {str(e)}")
    
    def test_error_handling(self):
        """Test API error handling"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoint
        try:
            response = requests.get(f"{BASE_URL}/invalid-endpoint", timeout=10)
            if response.status_code == 404:
                self.log_test(
                    "Invalid Endpoint",
                    True,
                    "Correctly returned 404 for invalid endpoint"
                )
            else:
                self.log_test(
                    "Invalid Endpoint",
                    False,
                    f"Expected 404, got {response.status_code}"
                )
        except Exception as e:
            self.log_test("Invalid Endpoint", False, f"Error testing invalid endpoint: {str(e)}")
        
        # Test invalid login credentials
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                headers=HEADERS,
                json={"email": "invalid@test.com", "password": "wrongpassword"},
                timeout=10
            )
            if response.status_code == 400:
                self.log_test(
                    "Invalid Login",
                    True,
                    "Correctly returned 400 for invalid credentials"
                )
            else:
                self.log_test(
                    "Invalid Login",
                    False,
                    f"Expected 400, got {response.status_code}"
                )
        except Exception as e:
            self.log_test("Invalid Login", False, f"Error testing invalid login: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_photo_upload_api()
        self.test_get_photos_api()
        self.test_lead_capture_api()
        self.test_get_leads_api()
        self.test_gps_tracking_api()
        self.test_get_gps_tracking_api()
        self.test_user_management_api()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = FieldManagementAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)