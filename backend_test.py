#!/usr/bin/env python3
"""
ATAKA Backend API Testing Suite
Tests the NestJS backend API endpoints via Python/FastAPI proxy
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://dev-preview-340.preview.emergentagent.com/api"
TEST_PHONE = "+380991234567"
TEST_OTP_CODE = "0000"  # Test mode accepts any 4-digit code

class ATAKAAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        # Add auth header if we have a token
        if self.access_token and headers is None:
            headers = {}
        if self.access_token:
            headers = headers or {}
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            # Success for 2xx status codes
            return 200 <= response.status_code < 300, response_data, response.status_code
            
        except Exception as e:
            return False, str(e), 0
    
    def test_health_check(self):
        """Test GET /api/health"""
        print("🔍 Testing Health Check Endpoint...")
        
        success, data, status_code = self.make_request("GET", "/health")
        
        if success and status_code == 200:
            if isinstance(data, dict) and data.get("status") == "ok":
                self.log_test("Health Check", True, f"Status: {data.get('status')}, Service: {data.get('service', 'N/A')}")
            else:
                self.log_test("Health Check", False, f"Invalid response format", data)
        else:
            self.log_test("Health Check", False, f"HTTP {status_code}", data)
    
    def test_auth_request_otp(self):
        """Test POST /api/auth/request-otp"""
        print("🔍 Testing OTP Request...")
        
        payload = {"phone": TEST_PHONE}
        success, data, status_code = self.make_request("POST", "/auth/request-otp", payload)
        
        if success and status_code in [200, 201]:
            if isinstance(data, dict) and data.get("success"):
                self.log_test("OTP Request", True, f"OTP sent to {TEST_PHONE}")
            else:
                self.log_test("OTP Request", False, "Success flag not found in response", data)
        else:
            self.log_test("OTP Request", False, f"HTTP {status_code}", data)
    
    def test_auth_verify_otp(self):
        """Test POST /api/auth/verify-otp"""
        print("🔍 Testing OTP Verification...")
        
        payload = {"phone": TEST_PHONE, "code": TEST_OTP_CODE}
        success, data, status_code = self.make_request("POST", "/auth/verify-otp", payload)
        
        if success and status_code in [200, 201]:
            if isinstance(data, dict) and "accessToken" in data:
                self.access_token = data["accessToken"]
                self.refresh_token = data.get("refreshToken")
                self.log_test("OTP Verification", True, f"Tokens received, User ID: {data.get('user', {}).get('id', 'N/A')}")
            else:
                self.log_test("OTP Verification", False, "Access token not found in response", data)
        else:
            self.log_test("OTP Verification", False, f"HTTP {status_code}", data)
    
    def test_competitions_public(self):
        """Test GET /api/competitions (public endpoint)"""
        print("🔍 Testing Competitions Public Endpoint...")
        
        success, data, status_code = self.make_request("GET", "/competitions")
        
        if success and status_code == 200:
            if isinstance(data, list):
                self.log_test("Competitions Public", True, f"Retrieved {len(data)} competitions")
            else:
                self.log_test("Competitions Public", False, "Response is not a list", data)
        else:
            self.log_test("Competitions Public", False, f"HTTP {status_code}", data)
    
    def test_groups_protected(self):
        """Test GET /api/groups (protected endpoint)"""
        print("🔍 Testing Groups Protected Endpoint...")
        
        if not self.access_token:
            self.log_test("Groups Protected", False, "No access token available - skipping test")
            return
        
        success, data, status_code = self.make_request("GET", "/groups")
        
        if success and status_code == 200:
            if isinstance(data, list):
                self.log_test("Groups Protected", True, f"Retrieved {len(data)} groups")
            else:
                self.log_test("Groups Protected", False, "Response is not a list", data)
        else:
            self.log_test("Groups Protected", False, f"HTTP {status_code}", data)
    
    def test_auth_me(self):
        """Test GET /api/auth/me (protected endpoint)"""
        print("🔍 Testing Auth Me Endpoint...")
        
        if not self.access_token:
            self.log_test("Auth Me", False, "No access token available - skipping test")
            return
        
        success, data, status_code = self.make_request("GET", "/auth/me")
        
        if success and status_code == 200:
            if isinstance(data, dict) and "id" in data:
                self.log_test("Auth Me", True, f"User info retrieved, ID: {data.get('id')}, Phone: {data.get('phone', 'N/A')}")
            else:
                self.log_test("Auth Me", False, "Invalid user data format", data)
        else:
            self.log_test("Auth Me", False, f"HTTP {status_code}", data)
    
    def test_competitions_stats(self):
        """Test GET /api/competitions/stats (public endpoint)"""
        print("🔍 Testing Competitions Stats...")
        
        success, data, status_code = self.make_request("GET", "/competitions/stats")
        
        if success and status_code == 200:
            if isinstance(data, dict):
                self.log_test("Competitions Stats", True, f"Stats retrieved: {list(data.keys())}")
            else:
                self.log_test("Competitions Stats", False, "Response is not a dict", data)
        else:
            self.log_test("Competitions Stats", False, f"HTTP {status_code}", data)
    
    def test_competitions_upcoming(self):
        """Test GET /api/competitions/upcoming (public endpoint)"""
        print("🔍 Testing Competitions Upcoming...")
        
        success, data, status_code = self.make_request("GET", "/competitions/upcoming")
        
        if success and status_code == 200:
            if isinstance(data, list):
                self.log_test("Competitions Upcoming", True, f"Retrieved {len(data)} upcoming competitions")
            else:
                self.log_test("Competitions Upcoming", False, "Response is not a list", data)
        else:
            self.log_test("Competitions Upcoming", False, f"HTTP {status_code}", data)
    
    def test_auth_refresh_token(self):
        """Test POST /api/auth/refresh"""
        print("🔍 Testing Token Refresh...")
        
        if not self.refresh_token:
            self.log_test("Token Refresh", False, "No refresh token available - skipping test")
            return
        
        payload = {"refreshToken": self.refresh_token}
        success, data, status_code = self.make_request("POST", "/auth/refresh", payload)
        
        if success and status_code in [200, 201]:
            if isinstance(data, dict) and "accessToken" in data:
                self.log_test("Token Refresh", True, "New access token received")
            else:
                self.log_test("Token Refresh", False, "Access token not found in response", data)
        else:
            self.log_test("Token Refresh", False, f"HTTP {status_code}", data)
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting ATAKA Backend API Tests")
        print("=" * 50)
        
        # Test public endpoints first
        self.test_health_check()
        self.test_competitions_public()
        self.test_competitions_stats()
        self.test_competitions_upcoming()
        
        # Test auth flow
        self.test_auth_request_otp()
        self.test_auth_verify_otp()
        
        # Test protected endpoints (requires auth)
        self.test_auth_me()
        self.test_groups_protected()
        self.test_auth_refresh_token()
        
        # Summary
        print("=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = ATAKAAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)