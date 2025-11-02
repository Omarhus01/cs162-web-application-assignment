"""
Authentication Tests
====================
Test user registration, login, logout, and session management.
"""

import pytest


class TestAuthentication:
    """Test authentication endpoints."""
    
    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'message' in data
        assert data['message'] == 'User registered successfully'
    
    def test_register_duplicate_username(self, client, test_user):
        """Test registration with existing username."""
        response = client.post('/api/auth/register', json={
            'username': test_user['username'],
            'email': 'different@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_password_mismatch(self, client):
        """Test registration with mismatched passwords."""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123',
            'confirm_password': 'different123'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post('/api/auth/login', json={
            'username': test_user['username'],
            'password': test_user['password']
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'user' in data
        assert data['user']['username'] == test_user['username']
    
    def test_login_wrong_password(self, client, test_user):
        """Test login with incorrect password."""
        response = client.post('/api/auth/login', json={
            'username': test_user['username'],
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent username."""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_logout(self, authenticated_client):
        """Test logout functionality."""
        response = authenticated_client.post('/api/auth/logout')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'message' in data
    
    def test_get_current_user(self, authenticated_client, test_user):
        """Test getting current authenticated user."""
        response = authenticated_client.get('/api/auth/user')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['username'] == test_user['username']
    
    def test_get_user_unauthenticated(self, client):
        """Test getting user without authentication."""
        response = client.get('/api/auth/user')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_protected_endpoint_unauthorized(self, client):
        """Test accessing protected endpoint without authentication."""
        response = client.get('/api/lists')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
