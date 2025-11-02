/**
 * TaskItem Component
 * ==================
 * Recursive component for displaying hierarchical tasks.
 * 
 * Features:
 * - Display tasks with completion status and priority
 * - Create, edit, and delete tasks
 * - Add subtasks (up to 5 levels deep)
 * - Collapse/expand subtasks
 * - Move tasks between lists
 * - Change task priority
 * 
 * Props:
 * - task: Task object with title, priority, subtasks, etc.
 * - onUpdate: Callback to refresh parent component
 * - allLists: Array of all lists (for move functionality)
 * - currentListId: ID of the current list
 * - depth: Current nesting depth (1 = top-level, 2 = subtask, etc.)
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Card, Button, Form, Badge } from 'react-bootstrap';
import { tasksAPI, listsAPI } from '../../services/api';

function TaskItem({ task, onUpdate, allLists, currentListId, depth = 1 }) {
  // Component state
  const [isCollapsed, setIsCollapsed] = useState(task.collapsed || false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState(''); // Subtask description field
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || ''); // Add description editing
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [priorityMenuPosition, setPriorityMenuPosition] = useState({ top: 0, left: 0 });
  const priorityMenuRef = useRef(null);
  const priorityBadgeRef = useRef(null);
  const [creatingNewList, setCreatingNewList] = useState(false); // For new list creation
  const [newListName, setNewListName] = useState(''); // New list name input
  const [isCreatingList, setIsCreatingList] = useState(false); // Loading state for list creation

  // Sync collapse state when task prop changes
  useEffect(() => {
    setIsCollapsed(task.collapsed || false);
  }, [task.id, task.collapsed]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close task options dropdown
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
      
      // Close priority menu dropdown
      if (
        priorityMenuOpen &&
        priorityMenuRef.current &&
        !priorityMenuRef.current.contains(event.target) &&
        priorityBadgeRef.current &&
        !priorityBadgeRef.current.contains(event.target)
      ) {
        setPriorityMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, priorityMenuOpen]);

  // Check nesting limits
  const canHaveSubtasks = depth < 5; // Extension 1: Allow up to 5 levels deep
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Priority badge colors (traffic light system)
  const priorityColors = {
    low: 'success',    // Green
    medium: 'warning', // Yellow
    high: 'danger',    // Red
  };

  /**
   * Toggle task completion status
   * Cascades to all subtasks automatically (handled by backend)
   */
  const handleToggleComplete = async () => {
    try {
      await tasksAPI.toggle(task.id);
      onUpdate(); // Refresh parent to show updated state
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  /**
   * Toggle collapse/expand state for subtasks
   * Updates UI immediately for instant feedback
   */
  const handleToggleCollapse = async () => {
    console.log('🔘 Collapse toggled for task:', task.id);
    
    // Update UI immediately for better UX
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    try {
      // Save state to backend
      await tasksAPI.collapse(task.id, newState);
      console.log('✅ Collapse state saved');
    } catch (error) {
      console.error('❌ Failed to save collapse state:', error);
      // Revert UI on error
      setIsCollapsed(!newState);
    }
  };

  /**
   * Delete task and all its subtasks
   * Shows confirmation dialog before deletion
   */
  const handleDelete = async () => {
    if (!window.confirm('Delete this task and all its subtasks?')) return;
    
    try {
      await tasksAPI.delete(task.id);
      onUpdate(); // Refresh parent
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  /**
   * Create a new subtask under this task
   */
  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    try {
      await tasksAPI.create({
        list_id: currentListId,
        parent_id: task.id, // Link to parent task
        title: subtaskTitle,
        description: subtaskDescription, // Include description
      });
      setSubtaskTitle('');
      setSubtaskDescription(''); // Clear description field
      setShowSubtaskForm(false);
      setIsCollapsed(false); // Automatically expand to show new subtask
      onUpdate(); // Refresh parent
    } catch (error) {
      console.error('Error creating subtask:', error);
      alert(error.response?.data?.error || 'Failed to create subtask');
    }
  };

  /**
   * Update task title and description (called after inline editing)
   */
  const handleUpdateTask = async () => {
    if (!editTitle.trim()) return;

    try {
      await tasksAPI.update(task.id, { 
        title: editTitle,
        description: editDescription // Include description in update
      });
      setEditing(false);
      onUpdate(); // Refresh parent
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  /**
   * Enter edit mode and initialize edit state
   */
  const handleStartEditing = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditing(true);
  };

  /**
   * Change task priority (low/medium/high)
   */
  const handleChangePriority = async (priority) => {
    try {
      await tasksAPI.update(task.id, { priority });
      onUpdate(); // Refresh to show new priority badge color
    } catch (error) {
      console.error('Error changing priority:', error);
    }
  };

  /**
   * Move task to a different list
   * Only works for top-level tasks (enforced by backend)
   */
  const handleMoveTask = async (newListId) => {
    try {
      await tasksAPI.move(task.id, newListId);
      onUpdate(); // Refresh parent (task will disappear from current list)
    } catch (error) {
      console.error('Error moving task:', error);
      alert(error.response?.data?.error || 'Failed to move task');
    }
  };

  /**
   * Create a new list and move the task to it
   */
  const handleCreateAndMoveToNewList = async () => {
    // Prevent double-clicking
    if (isCreatingList) {
      console.log('⏳ Already creating list, ignoring...');
      return;
    }
    
    const trimmedName = newListName.trim();
    console.log('📝 Raw newListName state:', newListName);
    console.log('📝 Trimmed name:', trimmedName);
    console.log('📝 Length:', trimmedName.length);
    
    if (!trimmedName) {
      console.error('❌ Empty list name');
      alert('Please enter a list name (state was: "' + newListName + '")');
      return;
    }
    
    setIsCreatingList(true);
    console.log('🚀 Starting creation process...');
    
    try {
      console.log('🔨 Creating list with name:', trimmedName);
      const response = await listsAPI.create({ name: trimmedName });
      const newList = response.data.list; // Backend returns { message, list }
      console.log('✅ List created with ID:', newList.id, 'Name:', newList.name);
      
      console.log('📦 Moving task ID', task.id, 'to list ID', newList.id);
      await tasksAPI.move(task.id, newList.id);
      console.log('✅ Task moved successfully');
      
      // Reset state and refresh
      setCreatingNewList(false);
      setNewListName('');
      setDropdownOpen(false);
      setIsCreatingList(false);
      console.log('🔄 Calling onUpdate to refresh parent...');
      onUpdate();
      console.log('✅ All done!');
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('❌ Response:', error.response?.data);
      setIsCreatingList(false);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  /**
   * Toggle the task options dropdown menu
   * Calculates position based on button location
   */
  const toggleDropdown = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 220, // Align to right edge
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  /**
   * Execute a dropdown action and close the dropdown
   */
  const handleDropdownAction = (action) => {
    action();
    setDropdownOpen(false);
  };

  /**
   * Toggle the priority selection menu
   * Calculates position relative to priority badge
   */
  const togglePriorityMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!priorityMenuOpen && priorityBadgeRef.current) {
      const rect = priorityBadgeRef.current.getBoundingClientRect();
      setPriorityMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
    setPriorityMenuOpen(!priorityMenuOpen);
  };

  /**
   * Change priority and close menu
   */
  const handlePriorityChange = (newPriority) => {
    handleChangePriority(newPriority);
    setPriorityMenuOpen(false);
  };

  /**
   * Calculate indentation for nested tasks based on depth level.
   * Extension 1: Supports 5 levels (MVP was 3 levels).
   * Uses color-coded borders and progressive margin reduction.
   */
  const getIndentStyle = () => {
    if (depth === 1) return {}; /* No indentation for top-level tasks */
    
    // Cycle through colors for visual hierarchy
    const colors = [
      '#00ff41', // Neon green (primary)
      '#00d9ff', // Bright cyan (analogous to green)
      '#ffa500', // Orange (complementary to cyan)
      '#ff1493', // Deep pink (accent)
      '#9d4edd', // Purple (analogous to pink)
    ];
    const borderColor = colors[(depth - 2) % colors.length];
    
    // Progressive indentation: 25px for levels 2-4, then 15px per level
    const indentAmount = depth <= 4 
      ? (depth - 1) * 25
      : (3 * 25) + ((depth - 4) * 15);
    
    const maxIndent = 200; // Cap to prevent tasks becoming too narrow
    
    return {
      marginLeft: `${Math.min(indentAmount, maxIndent)}px`,
      borderLeft: `3px solid ${borderColor}`,
      paddingLeft: '15px',
    };
  };

  return (
    <div className={`task-item mb-2`} style={getIndentStyle()}>
      <Card className={`task-card ${task.completed ? 'completed' : ''}`}>
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center flex-grow-1" style={{ gap: '10px' }}>
              {/* Collapse/Expand Button - Beautiful Animated */}
              {hasSubtasks ? (
                <span
                  onClick={handleToggleCollapse}
                  style={{
                    cursor: 'pointer',
                    fontSize: '16px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCollapsed 
                      ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 255, 65, 0.15))'
                      : 'linear-gradient(135deg, rgba(0, 255, 65, 0.15), rgba(0, 217, 255, 0.15))',
                    border: `2px solid ${isCollapsed ? '#00d9ff' : '#00ff41'}`,
                    borderRadius: '8px',
                    backdropFilter: 'blur(5px)',
                    boxShadow: isCollapsed 
                      ? '0 0 15px rgba(0, 217, 255, 0.3)'
                      : '0 0 15px rgba(0, 255, 65, 0.3)',
                    userSelect: 'none',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  }}
                  title={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
                  onMouseEnter={(e) => {
                    e.target.style.transform = isCollapsed ? 'rotate(0deg) scale(1.15)' : 'rotate(90deg) scale(1.15)';
                    e.target.style.boxShadow = isCollapsed 
                      ? '0 0 25px rgba(0, 217, 255, 0.5)'
                      : '0 0 25px rgba(0, 255, 65, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = isCollapsed ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(1)';
                    e.target.style.boxShadow = isCollapsed 
                      ? '0 0 15px rgba(0, 217, 255, 0.3)'
                      : '0 0 15px rgba(0, 255, 65, 0.3)';
                  }}
                >
                  ▶
                </span>
              ) : (
                <div style={{ width: '32px', flexShrink: 0 }} />
              )}

              {/* Complete Checkbox */}
              <Form.Check
                type="checkbox"
                checked={task.completed}
                onChange={handleToggleComplete}
                title="Mark as complete/incomplete"
              />

              {/* Task Title */}
              {editing ? (
                <div className="flex-grow-1">
                  <div className="d-flex" style={{ gap: '8px', marginBottom: '8px' }}>
                    <Form.Control
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateTask()}
                      size="sm"
                      placeholder="Task title..."
                      autoFocus
                    />
                    <Button size="sm" variant="success" onClick={handleUpdateTask}>
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(false);
                        setEditTitle(task.title);
                        setEditDescription(task.description || '');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    size="sm"
                    placeholder="Task description (optional)..."
                    style={{ resize: 'vertical', fontSize: '0.85rem' }}
                  />
                </div>
              ) : (
                <div className="flex-grow-1">
                  <span
                    className={`task-title ${task.completed ? 'completed' : ''}`}
                    onDoubleClick={() => !task.completed && handleStartEditing()}
                    title="Double-click to edit"
                    style={{ cursor: task.completed ? 'default' : 'pointer' }}
                  >
                    {task.title}
                  </span>
                  
                  {/* Task Description */}
                  {task.description && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'rgba(0, 217, 255, 0.7)',
                      marginTop: '0.25rem',
                      fontStyle: 'italic',
                      paddingLeft: '0.5rem',
                      borderLeft: '2px solid rgba(0, 217, 255, 0.3)'
                    }}>
                      {task.description}
                    </div>
                  )}
                  
                  {/* Show placeholder if no description */}
                  {!task.description && !task.completed && (
                    <div 
                      style={{
                        fontSize: '0.8rem',
                        color: 'rgba(0, 217, 255, 0.4)',
                        marginTop: '0.25rem',
                        fontStyle: 'italic',
                        cursor: 'pointer'
                      }}
                      onClick={handleStartEditing}
                      title="Click to add description"
                    >
                      + Add description
                    </div>
                  )}
                </div>
              )}

              {/* Priority Badge - Clickable with Popup Menu */}
              <Badge 
                ref={priorityBadgeRef}
                className="priority-badge"
                onClick={togglePriorityMenu}
                title="Click to change priority"
                style={{
                  background: task.priority === 'low' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.2))'
                    : task.priority === 'medium'
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(250, 204, 21, 0.25))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(248, 113, 113, 0.25))',
                  border: `2px solid ${
                    task.priority === 'low' ? '#22c55e'
                    : task.priority === 'medium' ? '#eab308'
                    : '#ef4444'
                  }`,
                  color: task.priority === 'low' ? '#22c55e'
                    : task.priority === 'medium' ? '#eab308'
                    : '#ef4444',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: `0 0 15px ${
                    task.priority === 'low' ? 'rgba(34, 197, 94, 0.3)'
                    : task.priority === 'medium' ? 'rgba(234, 179, 8, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = `0 0 25px ${
                    task.priority === 'low' ? 'rgba(34, 197, 94, 0.5)'
                    : task.priority === 'medium' ? 'rgba(234, 179, 8, 0.5)'
                    : 'rgba(239, 68, 68, 0.5)'
                  }`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = `0 0 15px ${
                    task.priority === 'low' ? 'rgba(34, 197, 94, 0.3)'
                    : task.priority === 'medium' ? 'rgba(234, 179, 8, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                  }`;
                }}
              >
                {task.priority === 'low' && '🟢'} 
                {task.priority === 'medium' && '🟡'} 
                {task.priority === 'high' && '🔴'}{' '}
                {task.priority.toUpperCase()}
              </Badge>

              {/* Priority Menu - Uses React Portal to avoid z-index issues with nested cards */}
              {priorityMenuOpen &&
                ReactDOM.createPortal(
                  <div
                    ref={priorityMenuRef}
                    style={{
                      position: 'absolute',
                      top: `${priorityMenuPosition.top}px`,
                      left: `${priorityMenuPosition.left}px`,
                      zIndex: 999999, /* Must be above all task cards */
                      background: 'rgba(15, 12, 41, 0.98)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 217, 255, 0.3)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px',
                      minWidth: '140px',
                    }}
                  >
                    <div
                      onClick={() => handlePriorityChange('low')}
                      style={{
                        padding: '10px 16px',
                        color: '#22c55e',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: task.priority === 'low' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        border: task.priority === 'low' ? '1px solid #22c55e' : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = 'rgba(34, 197, 94, 0.15)')}
                      onMouseLeave={(e) => (e.target.style.background = task.priority === 'low' ? 'rgba(34, 197, 94, 0.2)' : 'transparent')}
                    >
                      🟢 Low
                    </div>
                    <div
                      onClick={() => handlePriorityChange('medium')}
                      style={{
                        padding: '10px 16px',
                        color: '#eab308',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: task.priority === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                        border: task.priority === 'medium' ? '1px solid #eab308' : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = 'rgba(234, 179, 8, 0.15)')}
                      onMouseLeave={(e) => (e.target.style.background = task.priority === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'transparent')}
                    >
                      🟡 Medium
                    </div>
                    <div
                      onClick={() => handlePriorityChange('high')}
                      style={{
                        padding: '10px 16px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: task.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        border: task.priority === 'high' ? '1px solid #ef4444' : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = 'rgba(239, 68, 68, 0.15)')}
                      onMouseLeave={(e) => (e.target.style.background = task.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'transparent')}
                    >
                      🔴 High
                    </div>
                  </div>,
                  document.body
                )}


              {/* Depth Indicator only for MAX level (Level 5) */}
              {depth === 5 && (
                <Badge
                  style={{
                    background: 'rgba(255, 20, 147, 0.25)',
                    border: '2px solid #ff1493',
                    color: '#ff1493',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    fontWeight: '700',
                    marginLeft: '8px',
                    textShadow: '0 0 5px rgba(255, 20, 147, 0.5)'
                  }}
                  title="Maximum nesting level reached"
                >
                  ⚠️ MAX DEPTH
                </Badge>
              )}

              {/* Subtask Count */}
              {hasSubtasks && (
                <span className="subtask-count" title={`${task.subtasks.length} subtask(s)`}>
                  {task.subtasks.length}
                </span>
              )}
            </div>

            {/* Actions Dropdown Button */}
            <button
              ref={buttonRef}
              onClick={toggleDropdown}
              style={{
                background: 'none',
                border: 'none',
                color: '#00ff41',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0 8px',
                lineHeight: 1,
              }}
              title="More actions"
            >
              ⋮
            </button>

            {/* Dropdown Menu - Uses React Portal for proper z-index layering */}
            {dropdownOpen &&
              ReactDOM.createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    zIndex: 999999, /* Above all other elements */
                    background: 'rgba(15, 12, 41, 0.98)',
                    border: '2px solid #00ff41',
                    borderRadius: '8px',
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
                    minWidth: '200px',
                    padding: '8px 0',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {canHaveSubtasks && (
                    <div
                      onClick={() => handleDropdownAction(() => setShowSubtaskForm(!showSubtaskForm))}
                      style={{
                        padding: '8px 16px',
                        color: '#00ff41',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = 'rgba(0, 255, 65, 0.2)')}
                      onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                    >
                      ➕ Add Subtask
                    </div>
                  )}
                  <div
                    onClick={() => handleDropdownAction(handleStartEditing)}
                    style={{
                      padding: '8px 16px',
                      color: '#00ff41',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(0, 255, 65, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    ✏️ Edit
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 255, 65, 0.3)', margin: '8px 0' }} />
                  <div style={{ padding: '4px 16px', color: '#00ffff', fontSize: '0.85rem', fontWeight: 700 }}>
                    Priority
                  </div>

                  <div
                    onClick={() => handleDropdownAction(() => handleChangePriority('low'))}
                    style={{ padding: '8px 16px', color: '#00ff41', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(0, 255, 65, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    🟢 Low
                  </div>
                  <div
                    onClick={() => handleDropdownAction(() => handleChangePriority('medium'))}
                    style={{ padding: '8px 16px', color: '#ffc800', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 200, 0, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    🟡 Medium
                  </div>
                  <div
                    onClick={() => handleDropdownAction(() => handleChangePriority('high'))}
                    style={{ padding: '8px 16px', color: '#ff0064', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 0, 100, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    🔴 High
                  </div>

                  {depth === 1 && allLists.length > 1 && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(0, 255, 65, 0.3)', margin: '8px 0' }} />
                      <div style={{ padding: '4px 16px', color: '#00ffff', fontSize: '0.85rem', fontWeight: 700 }}>
                        Move to List
                      </div>
                      {allLists
                        .filter((list) => list.id !== currentListId)
                        .map((list) => (
                          <div
                            key={list.id}
                            onClick={() => handleDropdownAction(() => handleMoveTask(list.id))}
                            style={{ padding: '8px 16px', color: '#00ff41', cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.target.style.background = 'rgba(0, 255, 65, 0.2)')}
                            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                          >
                            📋 {list.name}
                          </div>
                        ))}
                    </>
                  )}

                  {/* Create New List Option */}
                  {depth === 1 && !creatingNewList && (
                    <div
                      onClick={() => {
                        setCreatingNewList(true);
                        setNewListName('');
                      }}
                      style={{ padding: '8px 16px', color: '#00ffff', cursor: 'pointer', fontStyle: 'italic' }}
                      onMouseEnter={(e) => (e.target.style.background = 'rgba(0, 255, 255, 0.2)')}
                      onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                    >
                      ➕ Create New List
                    </div>
                  )}

                  {/* New List Creation Form */}
                  {depth === 1 && creatingNewList && (
                    <div 
                      style={{ padding: '8px 16px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="New list name..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateAndMoveToNewList();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{ marginBottom: '8px' }}
                      />
                      <div className="d-flex" style={{ gap: '4px' }}>
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateAndMoveToNewList();
                          }}
                          disabled={isCreatingList}
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          {isCreatingList ? 'Creating...' : 'Create & Move'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreatingNewList(false);
                            setNewListName('');
                          }}
                          disabled={isCreatingList}
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(0, 255, 65, 0.3)', margin: '8px 0' }} />
                  <div
                    onClick={() => handleDropdownAction(handleDelete)}
                    style={{ padding: '8px 16px', color: '#ff0064', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 0, 100, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    🗑️ Delete
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* Subtask Creation Form */}
          {showSubtaskForm && (
            <Form onSubmit={handleCreateSubtask} className="mt-2">
              <Form.Control
                type="text"
                size="sm"
                placeholder="New subtask title..."
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <Form.Control
                as="textarea"
                rows={2}
                size="sm"
                placeholder="Subtask description (optional)..."
                value={subtaskDescription}
                onChange={(e) => setSubtaskDescription(e.target.value)}
                className="mb-2"
                style={{ resize: 'vertical' }}
              />
              <div className="d-flex">
                <Button type="submit" size="sm" variant="primary">
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowSubtaskForm(false);
                    setSubtaskTitle('');
                    setSubtaskDescription('');
                  }}
                  className="ms-1"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>

      {/* Render Subtasks Recursively */}
      {!isCollapsed && hasSubtasks && (
        <div className="mt-2">
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onUpdate={onUpdate}
              allLists={allLists}
              currentListId={currentListId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskItem;
