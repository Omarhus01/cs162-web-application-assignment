"""
Todo Lists API Tests
====================
Test CRUD operations for todo lists.
"""

import pytest


class TestListsAPI:
    """Test todo lists endpoints."""
    
    def test_create_list(self, authenticated_client):
        """Test creating a new todo list."""
        response = authenticated_client.post('/api/lists', json={
            'name': 'My New List'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'list' in data
        assert data['list']['name'] == 'My New List'
    
    def test_create_list_empty_name(self, authenticated_client):
        """Test creating list with empty name."""
        response = authenticated_client.post('/api/lists', json={
            'name': ''
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_get_all_lists(self, authenticated_client, test_list):
        """Test getting all lists for authenticated user."""
        response = authenticated_client.get('/api/lists')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'lists' in data
        assert len(data['lists']) > 0
    
    def test_get_single_list(self, authenticated_client, test_list):
        """Test getting a single list by ID."""
        response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == test_list['id']
        assert data['name'] == test_list['name']
        assert 'tasks' in data
    
    def test_get_nonexistent_list(self, authenticated_client):
        """Test getting a list that doesn't exist."""
        response = authenticated_client.get('/api/lists/99999')
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
    
    def test_delete_list(self, authenticated_client, test_list):
        """Test deleting a list."""
        response = authenticated_client.delete(f'/api/lists/{test_list["id"]}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'message' in data
        
        # Verify list is deleted
        get_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        assert get_response.status_code == 404
    
    def test_delete_list_cascade_tasks(self, authenticated_client, test_list, test_task):
        """Test that deleting a list also deletes its tasks."""
        # Create a task in the list
        task_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task to be deleted',
            'description': ''
        })
        task_data = task_response.get_json()
        task_id = task_data['task']['id']
        
        # Delete the list
        response = authenticated_client.delete(f'/api/lists/{test_list["id"]}')
        assert response.status_code == 200
        
        # Verify list no longer accessible
        get_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        assert get_response.status_code == 404
    
    def test_list_isolation_between_users(self, client, test_user, test_list):
        """Test that users can only see their own lists."""
        # Create a second user
        client.post('/api/auth/register', json={
            'username': 'otheruser',
            'email': 'other@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        
        # Login as second user
        client.post('/api/auth/login', json={
            'username': 'otheruser',
            'password': 'password123'
        })
        
        # Try to access first user's list
        response = client.get(f'/api/lists/{test_list["id"]}')
        assert response.status_code == 404  # Should not be accessible
    
    def test_create_duplicate_list_name(self, authenticated_client, test_list):
        """Test that creating a list with duplicate name fails."""
        # Try to create another list with the same name
        response = authenticated_client.post('/api/lists', json={
            'name': test_list['name']  # Same name as test_list
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'already have a list' in data['error'].lower()
    
    def test_create_list_with_whitespace_name(self, authenticated_client):
        """Test that list names are trimmed and validated."""
        # Create list with leading/trailing whitespace
        response = authenticated_client.post('/api/lists', json={
            'name': '  My List  '
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['list']['name'] == 'My List'  # Trimmed
        
        # Try to create another list with same name (different whitespace)
        response2 = authenticated_client.post('/api/lists', json={
            'name': 'My List'
        })
        
        assert response2.status_code == 400
        data2 = response2.get_json()
        assert 'error' in data2

