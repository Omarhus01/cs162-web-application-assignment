"""
Business Logic Tests
====================
Test complex business rules: cascading completion, depth limits, hierarchy.
"""

import pytest


class TestBusinessLogic:
    """Test business logic and complex scenarios."""
    
    def test_parent_completion_cascades_to_children(self, authenticated_client, test_list):
        """Test that completing a parent auto-completes all children."""
        # Create parent task
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent Task'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        # Create subtasks
        subtask1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Subtask 1',
            'parent_id': parent_id
        })
        subtask1_data = subtask1_response.get_json()
        subtask1_id = subtask1_data['task']['id']
        
        subtask2_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Subtask 2',
            'parent_id': parent_id
        })
        subtask2_data = subtask2_response.get_json()
        subtask2_id = subtask2_data['task']['id']
        
        # Complete parent
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Verify via list endpoint (subtasks are nested in parent)
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        
        # Find parent task in list
        parent_task = None
        for task in list_data['tasks']:
            if task['id'] == parent_id:
                parent_task = task
                break
        
        assert parent_task is not None
        assert parent_task['completed'] is True
        # Check subtasks are completed
        assert len(parent_task['subtasks']) == 2
        for subtask in parent_task['subtasks']:
            assert subtask['completed'] is True
    
    def test_deep_nesting_cascading_completion(self, authenticated_client, test_list):
        """Test cascading completion works at multiple levels."""
        # Create hierarchy: Parent -> Child -> Grandchild
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child',
            'parent_id': parent_id
        })
        child_data = child_response.get_json()
        child_id = child_data['task']['id']
        
        grandchild_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Grandchild',
            'parent_id': child_id
        })
        grandchild_data = grandchild_response.get_json()
        grandchild_id = grandchild_data['task']['id']
        
        # Complete parent
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Verify all descendants are completed via list endpoint
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        
        parent_task = list_data['tasks'][0]
        assert parent_task['completed'] is True
        assert parent_task['subtasks'][0]['completed'] is True
        assert parent_task['subtasks'][0]['subtasks'][0]['completed'] is True
    
    def test_uncompleting_child_doesnt_affect_parent(self, authenticated_client, test_list):
        """Test OLD REMOVED BEHAVIOR: This test reflects removed logic - keeping for reference.
        NEW BEHAVIOR: Unchecking child DOES uncheck parent (CASCADE UP).
        See test_unchecking_any_child_unchecks_parent for current behavior."""
        # Create parent and child
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child',
            'parent_id': parent_id
        })
        child_data = child_response.get_json()
        child_id = child_data['task']['id']
        
        # Complete child first, then complete parent separately
        authenticated_client.patch(f'/api/tasks/{child_id}/toggle')
        authenticated_client.patch(f'/api/tasks/{child_id}/toggle')
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Uncomplete child
        authenticated_client.patch(f'/api/tasks/{child_id}/toggle')
        
        # NEW BEHAVIOR: Parent is now unchecked (CASCADE UP)
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        parent_task = list_data['tasks'][0]
        assert parent_task['completed'] is False  # Changed: parent now unchecks!
    
    def test_five_level_nesting_allowed(self, authenticated_client, test_list):
        """Test that 5 levels of nesting are allowed (Extension 1)."""
        # Create 5-level hierarchy
        level1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Level 1'
        })
        level1_data = level1_response.get_json()
        level1_id = level1_data['task']['id']
        
        level2_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Level 2',
            'parent_id': level1_id
        })
        level2_data = level2_response.get_json()
        level2_id = level2_data['task']['id']
        
        level3_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Level 3',
            'parent_id': level2_id
        })
        level3_data = level3_response.get_json()
        level3_id = level3_data['task']['id']
        
        level4_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Level 4',
            'parent_id': level3_id
        })
        level4_data = level4_response.get_json()
        level4_id = level4_data['task']['id']
        
        level5_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Level 5',
            'parent_id': level4_id
        })
        
        # All levels should be created successfully
        assert level1_response.status_code == 201
        assert level2_response.status_code == 201
        assert level3_response.status_code == 201
        assert level4_response.status_code == 201
        assert level5_response.status_code == 201
    
    def test_task_counts_in_list(self, authenticated_client, test_list):
        """Test that list returns correct task and completed counts."""
        # Create tasks
        task1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task 1'
        })
        task1_data = task1_response.get_json()
        task1_id = task1_data['task']['id']
        
        authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task 2'
        })
        
        authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task 3'
        })
        
        # Complete one task
        authenticated_client.patch(f'/api/tasks/{task1_id}/toggle')
        
        # Get list and check counts
        response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        data = response.get_json()
        
        assert data['task_count'] == 3
        assert data['completed_count'] == 1
    
    def test_priority_default_value(self, authenticated_client, test_list):
        """Test that tasks default to 'medium' priority."""
        response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Task without priority'
        })
        
        data = response.get_json()
        assert 'task' in data
        assert data['task']['priority'] == 'medium'
    
    def test_priority_validation(self, authenticated_client, test_list):
        """Test that only valid priority values are accepted."""
        # Valid priorities
        for priority in ['low', 'medium', 'high']:
            response = authenticated_client.post('/api/tasks', json={
                'list_id': test_list['id'],
                'title': f'Task with {priority} priority',
                'priority': priority
            })
            assert response.status_code == 201
    
    def test_collapsed_state_persists(self, authenticated_client, test_task):
        """Test that collapsed state is saved and retrieved."""
        # Collapse task
        authenticated_client.patch(f'/api/tasks/{test_task["id"]}/collapse', json={
            'collapsed': True
        })
        
        # Get task via list endpoint and verify state persisted
        response = authenticated_client.get(f'/api/lists/{test_task["list_id"]}')
        data = response.get_json()
        
        # Find the task in the list
        task_found = None
        for task in data['tasks']:
            if task['id'] == test_task['id']:
                task_found = task
                break
        
        assert task_found is not None
        assert task_found['collapsed'] is True
    
    def test_subtask_count_calculation(self, authenticated_client, test_task):
        """Test that subtask count is correctly calculated."""
        # Create subtasks
        authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Subtask 1',
            'parent_id': test_task['id']
        })
        
        authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Subtask 2',
            'parent_id': test_task['id']
        })
        
        authenticated_client.post('/api/tasks', json={
            'list_id': test_task['list_id'],
            'title': 'Subtask 3',
            'parent_id': test_task['id']
        })
        
        # Get parent task via list and verify count
        response = authenticated_client.get(f'/api/lists/{test_task["list_id"]}')
        data = response.get_json()
        
        # Find the parent task
        parent_task = None
        for task in data['tasks']:
            if task['id'] == test_task['id']:
                parent_task = task
                break
        
        assert parent_task is not None
        assert len(parent_task['subtasks']) == 3
    
    def test_unchecking_parent_keeps_children_checked(self, authenticated_client, test_list):
        """Test NEW checkbox logic: unchecking parent doesn't uncheck children."""
        # Create parent with children
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 1',
            'parent_id': parent_id
        })
        child1_data = child1_response.get_json()
        child1_id = child1_data['task']['id']
        
        child2_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 2',
            'parent_id': parent_id
        })
        child2_data = child2_response.get_json()
        child2_id = child2_data['task']['id']
        
        # Complete parent (this should complete children too)
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Verify all are completed
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        parent_task = list_data['tasks'][0]
        assert parent_task['completed'] is True
        assert parent_task['subtasks'][0]['completed'] is True
        assert parent_task['subtasks'][1]['completed'] is True
        
        # Now UNCHECK parent - children should stay checked!
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Verify parent unchecked but children still checked
        list_response2 = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data2 = list_response2.get_json()
        parent_task2 = list_data2['tasks'][0]
        assert parent_task2['completed'] is False  # Parent unchecked
        assert parent_task2['subtasks'][0]['completed'] is True  # Child still checked!
        assert parent_task2['subtasks'][1]['completed'] is True  # Child still checked!
    
    def test_completing_all_children_auto_completes_parent(self, authenticated_client, test_list):
        """Test CASCADE UP: completing all children auto-completes parent."""
        # Create parent with 3 children
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 1',
            'parent_id': parent_id
        })
        child1_data = child1_response.get_json()
        child1_id = child1_data['task']['id']
        
        child2_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 2',
            'parent_id': parent_id
        })
        child2_data = child2_response.get_json()
        child2_id = child2_data['task']['id']
        
        child3_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 3',
            'parent_id': parent_id
        })
        child3_data = child3_response.get_json()
        child3_id = child3_data['task']['id']
        
        # Complete first 2 children
        authenticated_client.patch(f'/api/tasks/{child1_id}/toggle')
        authenticated_client.patch(f'/api/tasks/{child2_id}/toggle')
        
        # Parent should still be incomplete
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        parent_task = list_data['tasks'][0]
        assert parent_task['completed'] is False
        
        # Complete the LAST child - parent should auto-complete!
        authenticated_client.patch(f'/api/tasks/{child3_id}/toggle')
        
        # Verify parent auto-completed
        list_response2 = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data2 = list_response2.get_json()
        parent_task2 = list_data2['tasks'][0]
        assert parent_task2['completed'] is True  # Auto-completed!
        assert parent_task2['subtasks'][0]['completed'] is True
        assert parent_task2['subtasks'][1]['completed'] is True
        assert parent_task2['subtasks'][2]['completed'] is True
    
    def test_unchecking_any_child_unchecks_parent(self, authenticated_client, test_list):
        """Test CASCADE UP: unchecking any child unchecks parent."""
        # Create parent with children, all completed
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent'
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child1_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 1',
            'parent_id': parent_id
        })
        child1_data = child1_response.get_json()
        child1_id = child1_data['task']['id']
        
        child2_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child 2',
            'parent_id': parent_id
        })
        child2_data = child2_response.get_json()
        child2_id = child2_data['task']['id']
        
        # Complete parent (completes all children)
        authenticated_client.patch(f'/api/tasks/{parent_id}/toggle')
        
        # Verify all completed
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        parent_task = list_data['tasks'][0]
        assert parent_task['completed'] is True
        assert parent_task['subtasks'][0]['completed'] is True
        assert parent_task['subtasks'][1]['completed'] is True
        
        # Uncheck ONE child - parent should auto-uncheck
        authenticated_client.patch(f'/api/tasks/{child1_id}/toggle')
        
        # Verify parent is now unchecked
        list_response2 = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data2 = list_response2.get_json()
        parent_task2 = list_data2['tasks'][0]
        assert parent_task2['completed'] is False  # Auto-unchecked!
        assert parent_task2['subtasks'][0]['completed'] is False  # Unchecked
        assert parent_task2['subtasks'][1]['completed'] is True  # Still checked
    
    def test_multi_level_cascade_up(self, authenticated_client, test_list):
        """Test CASCADE UP works through multiple levels (grandparent)."""
        # Create 3-level hierarchy: Grandparent -> Parent -> Child
        grandparent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Grandparent'
        })
        grandparent_data = grandparent_response.get_json()
        grandparent_id = grandparent_data['task']['id']
        
        parent_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Parent',
            'parent_id': grandparent_id
        })
        parent_data = parent_response.get_json()
        parent_id = parent_data['task']['id']
        
        child_response = authenticated_client.post('/api/tasks', json={
            'list_id': test_list['id'],
            'title': 'Child',
            'parent_id': parent_id
        })
        child_data = child_response.get_json()
        child_id = child_data['task']['id']
        
        # Complete the leaf child - should cascade up to grandparent
        authenticated_client.patch(f'/api/tasks/{child_id}/toggle')
        
        # Verify entire chain is completed
        list_response = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data = list_response.get_json()
        grandparent_task = list_data['tasks'][0]
        assert grandparent_task['completed'] is True
        assert grandparent_task['subtasks'][0]['completed'] is True  # Parent
        assert grandparent_task['subtasks'][0]['subtasks'][0]['completed'] is True  # Child
        
        # Now uncheck the child - should cascade up unchecking all ancestors
        authenticated_client.patch(f'/api/tasks/{child_id}/toggle')
        
        # Verify entire chain is unchecked
        list_response2 = authenticated_client.get(f'/api/lists/{test_list["id"]}')
        list_data2 = list_response2.get_json()
        grandparent_task2 = list_data2['tasks'][0]
        assert grandparent_task2['completed'] is False
        assert grandparent_task2['subtasks'][0]['completed'] is False  # Parent unchecked
        assert grandparent_task2['subtasks'][0]['subtasks'][0]['completed'] is False  # Child unchecked
