"""
Test script for SocialConnect API endpoints
Run this script to verify the API is working correctly.
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000/api"

def print_response(response, title):
    """Print formatted response."""
    print(f"\n{'='*50}")
    print(f"{title}")
    print(f"{'='*50}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_api():
    """Test SocialConnect API endpoints."""
    print("🚀 Testing SocialConnect API")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now()}")
    
    # Test data
    test_user_data = {
        "username": "testuser123",
        "email": "test@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    }
    
    login_data = {
        "username_or_email": "testuser123",
        "password": "testpassword123"
    }
    
    # 1. Test User Registration
    print("\n1. Testing User Registration...")
    response = requests.post(f"{BASE_URL}/auth/register/", json=test_user_data)
    print_response(response, "User Registration")
    
    if response.status_code == 201:
        user_data = response.json()
        access_token = user_data.get('tokens', {}).get('access')
        user_id = user_data.get('user', {}).get('id')
        
        if access_token:
            # Headers for authenticated requests
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # 2. Test User Profile
            print("\n2. Testing Get Current User Profile...")
            response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
            print_response(response, "Current User Profile")
            
            # 3. Test Create Post
            print("\n3. Testing Create Post...")
            post_data = {
                "content": "This is a test post from the API test script! 🚀",
                "category": "general"
            }
            response = requests.post(f"{BASE_URL}/posts/", json=post_data, headers=headers)
            print_response(response, "Create Post")
            
            if response.status_code == 201:
                post_id = response.json().get('id')
                
                # 4. Test Get Posts Feed
                print("\n4. Testing Get Posts Feed...")
                response = requests.get(f"{BASE_URL}/posts/feed/", headers=headers)
                print_response(response, "Posts Feed")
                
                # 5. Test Like Post
                if post_id:
                    print(f"\n5. Testing Like Post (ID: {post_id})...")
                    response = requests.post(f"{BASE_URL}/posts/{post_id}/like/", headers=headers)
                    print_response(response, "Like Post")
                
                # 6. Test Add Comment
                if post_id:
                    print(f"\n6. Testing Add Comment to Post (ID: {post_id})...")
                    comment_data = {"content": "Great test post! 👍"}
                    response = requests.post(f"{BASE_URL}/posts/{post_id}/comments/", json=comment_data, headers=headers)
                    print_response(response, "Add Comment")
            
            # 7. Test Get Notifications
            print("\n7. Testing Get Notifications...")
            response = requests.get(f"{BASE_URL}/notifications/", headers=headers)
            print_response(response, "Get Notifications")
            
            # 8. Test Admin Login (if admin exists)
            print("\n8. Testing Admin Login...")
            admin_login_data = {
                "username_or_email": "admin",
                "password": "admin123"
            }
            response = requests.post(f"{BASE_URL}/auth/login/", json=admin_login_data)
            print_response(response, "Admin Login")
            
            if response.status_code == 200:
                admin_data = response.json()
                admin_token = admin_data.get('tokens', {}).get('access')
                
                if admin_token:
                    admin_headers = {'Authorization': f'Bearer {admin_token}'}
                    
                    # 9. Test Admin Stats
                    print("\n9. Testing Admin Stats...")
                    response = requests.get(f"{BASE_URL}/admin/stats/", headers=admin_headers)
                    print_response(response, "Admin Stats")
    
    print(f"\n🎉 API testing completed at: {datetime.now()}")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"Error during testing: {e}")
        print("Make sure the Django development server is running at http://127.0.0.1:8000")