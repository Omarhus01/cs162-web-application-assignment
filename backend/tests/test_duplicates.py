"""
Duplicate Name Validation Tests
================================
Test that duplicate names are prevented for lists and tasks.
"""

import pytest


class TestDuplicateValidation:
    """Test duplicate name prevention."""
    
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
    
    def test_create_list_with_whitespace_trimmed(self, authenticated_client):
        """Test that list names are trimmed and validated."""
        # Create list with leading/trailing whitespace
        response = authenticated_client.post('/api/lists', json={
            'name': '  My List  '
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['list']['name'] == 'My List'  # Should be trimmed
        
        # Try to create another list with same name (different whitespace)
        response2 = authenticated_client.post('/api/lists', json={
            'name': 'My List'
        })
        
        assert response2.status_code == 400
        data2 = response2.get_json()
        assert 'error' in data2
    
    def test_create_duplicate_task_name(self, authenticated_client, test_task):
        """Test that creating a task with duplicate name in same list fails."""
        # Try to create another task with the same name in same list
        response = authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': test_task['title'],  # Same name as test_task
            'description': 'Different description'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'already exists' in data['error'].lower()
    
    def test_create_duplicate_subtask_name(self, authenticated_client, test_task):
        """Test that creating subtasks with duplicate names under same parent fails."""
        # Create first subtask
        response1 = authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Duplicate Subtask',
            'parent_id': test_task['id']
        })
        assert response1.status_code == 201
        
        # Try to create another subtask with same name under same parent
        response2 = authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Duplicate Subtask',
            'parent_id': test_task['id']
        })
        
        assert response2.status_code == 400
        data = response2.get_json()
        assert 'error' in data
        assert 'already exists' in data['error'].lower()
    
    def test_update_task_to_duplicate_name(self, authenticated_client, test_list):
        """Test that updating a task to a duplicate name fails."""
        # Create two tasks
        response1 = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task One'
        })
        task1 = response1.get_json()['task']
        
        response2 = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task Two'
        })
        task2 = response2.get_json()['task']
        
        # Try to rename task2 to task1's name
        response = authenticated_client.put(f'/api/tasks/{task2["id"]}', json={
            'title': 'Task One'  # Duplicate of task1
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'already exists' in data['error'].lower()
    
    def test_update_subtask_to_duplicate_name(self, authenticated_client, test_task):
        """Test that updating a subtask to a duplicate sibling name fails."""
        # Create two subtasks
        response1 = authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Subtask One',
            'parent_id': test_task['id']
        })
        subtask1 = response1.get_json()['task']
        
        response2 = authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Subtask Two',
            'parent_id': test_task['id']
        })
        subtask2 = response2.get_json()['task']
        
        # Try to rename subtask2 to subtask1's name
        response = authenticated_client.put(f'/api/tasks/{subtask2["id"]}', json={
            'title': 'Subtask One'  # Duplicate of subtask1
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'already exists' in data['error'].lower()
    
    def test_same_task_name_in_different_lists_allowed(self, authenticated_client):
        """Test that same task name is allowed in different lists."""
        # Create two lists
        list1_response = authenticated_client.post('/api/lists', json={
            'name': 'List One'
        })
        list1 = list1_response.get_json()['list']
        
        list2_response = authenticated_client.post('/api/lists', json={
            'name': 'List Two'
        })
        list2 = list2_response.get_json()['list']
        
        # Create task with same name in both lists - should succeed
        response1 = authenticated_client.post('/api/tasks', json={
            'list_id': list1['id'],
            'title': 'Same Task Name'
        })
        assert response1.status_code == 201
        
        response2 = authenticated_client.post('/api/tasks', json={
            'list_id': list2['id'],
            'title': 'Same Task Name'
        })
        assert response2.status_code == 201  # Should succeed - different lists
    
    def test_task_name_trimmed(self, authenticated_client, test_list):
        """Test that task names are trimmed of whitespace."""
        response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': '  Task with spaces  '
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['task']['title'] == 'Task with spaces'  # Should be trimmed
