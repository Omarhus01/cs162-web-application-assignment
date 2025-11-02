/**
 * ListView Component
 * ==================
 * Display and manage a specific todo list with all its tasks.
 * 
 * Features:
 * - Display hierarchical tasks (up to 3 levels)
 * - Create new top-level tasks
 * - Toggle show/hide completed tasks
 * - Expand/collapse all tasks
 * - Task editing, deletion, and movement
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Form,
  Card,
  Alert,
  Navbar,
  Row,
  Col,
} from 'react-bootstrap';
import { listsAPI, tasksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskItem from '../Task/TaskItem';

function ListView() {
  // Get list ID from URL params
  const { listId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Component state
  const [list, setList] = useState(null);
  const [allLists, setAllLists] = useState([]); // For moving tasks between lists
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState(''); // Task description field
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true); // Toggle completed tasks visibility

  // Load list data when component mounts or listId changes
  useEffect(() => {
    fetchList();
    fetchAllLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  /**
   * Fetch the current list with all its tasks
   */
  const fetchList = async () => {
    try {
      const response = await listsAPI.getOne(listId);
      setList(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching list:', error);
      setError('Failed to load list');
      setLoading(false);
    }
  };

  /**
   * Fetch all user's lists (needed for task movement feature)
   */
  const fetchAllLists = async () => {
    try {
      const response = await listsAPI.getAll();
      setAllLists(response.data.lists);
    } catch (error) {
      console.error('Error fetching all lists:', error);
    }
  };

  /**
   * Refresh both the current list and all lists
   * Used when tasks are moved or lists are created
   */
  const handleRefreshAll = () => {
    fetchList();
    fetchAllLists();
  };

  /**
   * Create a new top-level task in this list
   */
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await tasksAPI.create({
        list_id: listId,
        title: newTaskTitle,
        description: newTaskDescription, // Include description
      });
      setNewTaskTitle('');
      setNewTaskDescription(''); // Clear description field
      fetchList(); // Refresh list to show new task
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create task');
    }
  };

  /**
   * Expand all tasks in the list (show all subtasks)
   * Recursively collects all tasks with subtasks and expands them
   */
  const handleExpandAll = async () => {
    console.log('🔓 EXPAND ALL clicked!');
    if (!list || !list.tasks) {
      console.log('❌ No list or tasks');
      return;
    }
    
    try {
      // Collect all task IDs that have subtasks
      const allTasksWithSubtasks = [];
      
      // Recursive function to find all tasks with subtasks
      const collectTasks = (tasks) => {
        tasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0) {
            allTasksWithSubtasks.push(task.id);
            collectTasks(task.subtasks); // Recursively check subtasks
          }
        });
      };
      
      collectTasks(list.tasks);
      console.log('📋 Found tasks with subtasks:', allTasksWithSubtasks);
      
      // Expand all tasks by setting collapsed = false
      await Promise.all(
        allTasksWithSubtasks.map(taskId => 
          tasksAPI.collapse(taskId, false)
        )
      );
      
      console.log('✅ All tasks expanded, refreshing...');
      fetchList(); // Refresh to show updated state
    } catch (error) {
      console.error('❌ Error expanding all:', error);
      setError('Failed to expand all tasks');
    }
  };

  /**
   * Collapse all tasks in the list (hide all subtasks)
   * Recursively collects all tasks with subtasks and collapses them
   */
  const handleCollapseAll = async () => {
    console.log('🔒 COLLAPSE ALL clicked!');
    if (!list || !list.tasks) {
      console.log('❌ No list or tasks');
      return;
    }
    
    try {
      // Collect all task IDs that have subtasks
      const allTasksWithSubtasks = [];
      
      // Recursive function to find all tasks with subtasks
      const collectTasks = (tasks) => {
        tasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0) {
            allTasksWithSubtasks.push(task.id);
            collectTasks(task.subtasks);
          }
        });
      };
      
      collectTasks(list.tasks);
      console.log('📋 Found tasks with subtasks:', allTasksWithSubtasks);
      
      // Collapse all tasks (set collapsed = true)
      await Promise.all(
        allTasksWithSubtasks.map(taskId => 
          tasksAPI.collapse(taskId, true)
        )
      );
      
      console.log('✅ All tasks collapsed, refreshing...');
      // Refresh the list
      fetchList();
    } catch (error) {
      console.error('❌ Error collapsing all:', error);
      setError('Failed to collapse all tasks');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (!list) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">List not found</Alert>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </Container>
    );
  }

  const topLevelTasks = list.tasks || [];
  const completedCount = topLevelTasks.filter((t) => t.completed).length;
  const totalCount = topLevelTasks.length;

  return (
    <>
      {/* Compact Fixed Navbar */}
      <Navbar className="mb-3" style={{ 
        background: 'rgba(15, 12, 41, 0.95)',
        borderBottom: '2px solid #00ff41',
        boxShadow: '0 5px 20px rgba(0, 255, 65, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '0.5rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Container>
          <Navbar.Brand style={{ 
            color: '#00ff41',
            fontWeight: '700',
            fontSize: '1.2rem',
            textShadow: '0 0 15px #00ff41'
          }}>
            📝 {list.name}
          </Navbar.Brand>
          <Navbar.Text style={{ 
            color: '#00d9ff',
            textShadow: '0 0 5px rgba(0, 217, 255, 0.6)',
            marginRight: '1rem',
            fontSize: '0.9rem'
          }}>
            ✅ {completedCount}/{totalCount}
          </Navbar.Text>
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => navigate('/dashboard')}
            style={{
              marginRight: '0.5rem',
              border: '1px solid #00ff41',
              color: '#00ff41',
              background: 'rgba(0, 255, 65, 0.1)',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
              fontWeight: '600',
              fontSize: '0.85rem',
              padding: '0.25rem 0.75rem'
            }}
          >
            Dashboard
          </Button>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={handleLogout}
            style={{
              border: '1px solid #ff0064',
              color: '#ff0064',
              background: 'rgba(255, 0, 100, 0.1)',
              boxShadow: '0 0 10px rgba(255, 0, 100, 0.3)',
              fontWeight: '600',
              fontSize: '0.85rem',
              padding: '0.25rem 0.75rem'
            }}
          >
            Logout
          </Button>
        </Container>
      </Navbar>

      <Container style={{ overflow: 'visible', maxWidth: '1000px', padding: '0 15px' }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-2">
            {error}
          </Alert>
        )}

        {/* Compact Create New Task Form - Horizontal Layout */}
        <Card className="mb-3 create-task-section" style={{ 
          background: 'rgba(15, 12, 41, 0.85)',
          borderColor: '#00ff41'
        }}>
          <Card.Body style={{ padding: '1rem' }}>
            <h6 className="mb-2" style={{ 
              color: '#00ff41',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.6)',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              ✨ New Task
            </h6>
            <Form onSubmit={handleCreateTask}>
              <div className="row g-2">
                <div className="col-md-5">
                  <Form.Control
                    type="text"
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    size="sm"
                    style={{ 
                      borderRadius: '8px',
                      border: '1px solid #00ff41',
                      backgroundColor: 'rgba(15, 12, 41, 0.6)',
                      color: '#00ff41',
                      boxShadow: '0 0 5px rgba(0, 255, 65, 0.2)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div className="col-md-5">
                  <Form.Control
                    type="text"
                    placeholder="Description (optional)..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    size="sm"
                    style={{ 
                      borderRadius: '8px',
                      border: '1px solid #00ff41',
                      backgroundColor: 'rgba(15, 12, 41, 0.6)',
                      color: '#00ff41',
                      boxShadow: '0 0 5px rgba(0, 255, 65, 0.2)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div className="col-md-2">
                  <Button 
                    type="submit" 
                    size="sm"
                    className="w-100"
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #00ff41, #00ffff)',
                      border: 'none',
                      color: '#0f0c29',
                      boxShadow: '0 0 10px rgba(0, 255, 65, 0.4)',
                      fontSize: '0.9rem',
                      padding: '0.375rem'
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Compact Controls */}
        <div className="d-flex justify-content-between align-items-center mb-2"
             style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              onClick={handleExpandAll}
              style={{
                background: 'rgba(0, 217, 255, 0.15)',
                border: '1px solid #00d9ff',
                color: '#00d9ff',
                fontWeight: '600',
                boxShadow: '0 0 8px rgba(0, 217, 255, 0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              📂 Expand
            </Button>
            <Button
              size="sm"
              onClick={handleCollapseAll}
              style={{
                background: 'rgba(255, 165, 0, 0.15)',
                border: '1px solid #ffa500',
                color: '#ffa500',
                fontWeight: '600',
                boxShadow: '0 0 8px rgba(255, 165, 0, 0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              📁 Collapse
            </Button>
          </div>
          <div 
            style={{
              background: 'rgba(0, 255, 65, 0.1)',
              border: '1px solid #00ff41',
              borderRadius: '8px',
              padding: '0.25rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 8px rgba(0, 255, 65, 0.3)',
              backdropFilter: 'blur(5px)',
              fontSize: '0.85rem'
            }}
          >
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#00ff41',
              textShadow: '0 0 5px rgba(0, 255, 65, 0.5)'
            }}>
              👁️ Show Completed
            </span>
            <Form.Check
              type="switch"
              id="show-completed"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              style={{ 
                transform: 'scale(1.3)',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* Tasks List */}
        {topLevelTasks.length === 0 ? (
          <Alert 
            style={{
              background: 'rgba(0, 255, 255, 0.1)',
              border: '2px solid #00ffff',
              color: '#00ffff',
              borderRadius: '15px',
              textAlign: 'center',
              padding: '2rem',
              fontSize: '1.1rem'
            }}
          >
            No tasks yet. Create your first task above!
          </Alert>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
            {topLevelTasks
              .filter((task) => showCompleted || !task.completed)
              .map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={handleRefreshAll}
                  allLists={allLists}
                  currentListId={parseInt(listId)}
                  depth={1}
                  showCompleted={showCompleted}
                />
              ))}
          </div>
        )}
      </Container>
    </>
  );
}

export default ListView;
