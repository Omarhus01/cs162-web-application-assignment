"""
Database Models for Hierarchical TodoApp
=========================================
Defines the database schema using SQLAlchemy ORM.

This file contains all database models for the TodoApp.
SQLAlchemy handles the Object-Relational Mapping (ORM),
which means we write Python classes instead of raw SQL.

Models:
- User: User accounts with secure password hashing
- TodoList: Todo lists owned by users (one-to-many relationship)
- Task: Hierarchical tasks with up to 5 levels of nesting (Extension 1)

Extension 1 Implemented: 5-level task nesting instead of 3-level MVP requirement
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """
    User model for authentication and data isolation.
    
    Each user has their own todo lists and tasks.
    Passwords are hashed using Werkzeug's security functions.
    """
    __tablename__ = 'users'
    
    # Primary key - unique identifier for each user
    id = db.Column(db.Integer, primary_key=True)
    
    # Username must be unique and indexed for fast lookups during login
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    
    # Email must be unique and indexed for fast lookups
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    
    # Store hashed password, never plain text
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Timestamp when user registered
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # One-to-many relationship: one user can have many todo lists
    # cascade='all, delete-orphan' means when user is deleted, all their lists are deleted too
    todo_lists = db.relationship('TodoList', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """
        Hash and store password securely.
        Uses Werkzeug's generate_password_hash which applies salt and multiple rounds.
        We never store plain text passwords for security.
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Verify a password against the stored hash.
        Returns True if password matches, False otherwise.
        This is used during login.
        """
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary (exclude password)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class TodoList(db.Model):
    """
    TodoList model representing a collection of tasks.
    
    Each list belongs to one user and can contain multiple tasks.
    """
    __tablename__ = 'todo_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Foreign key linking to User - every list belongs to exactly one user
    # Index on user_id makes queries like "get all lists for this user" fast
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # One-to-many relationship: one list can have many tasks
    # cascade='all, delete-orphan' means deleting a list also deletes all its tasks
    tasks = db.relationship('Task', backref='todo_list', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_tasks=False):
        """
        Convert list to dictionary for JSON API responses.
        
        Args:
            include_tasks (bool): If True, includes all tasks in the list (nested structure)
                                 If False, only returns list metadata
        
        Returns:
            dict: List data with task_count and completed_count statistics
        """
        result = {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            # Calculate statistics
            'task_count': len(self.tasks),  # Total number of tasks in this list
            'completed_count': sum(1 for task in self.tasks if task.completed)  # How many are done
        }
        
        if include_tasks:
            # Only include top-level tasks (those without a parent)
            # Subtasks are nested inside their parent tasks via recursion
            result['tasks'] = [
                task.to_dict(include_subtasks=True) 
                for task in self.tasks 
                if task.parent_id is None  # Filter to get only top-level tasks
            ]
        
        return result


class Task(db.Model):
    """
    Task model with hierarchical structure (self-referencing).
    
    Extension 1: Tasks can have subtasks up to 5 levels deep:
    - Level 1: Top-level tasks (parent_id = None)
    - Level 2: Subtasks
    - Level 3: Sub-subtasks
    - Level 4: Sub-sub-subtasks
    - Level 5: Sub-sub-sub-subtasks
    
    The self-referencing relationship allows infinite nesting theoretically,
    but we enforce a 5-level limit for usability.
    
    Features:
    - Completion status (cascades to all subtasks when parent is completed)
    - Collapse state (for hiding/showing subtasks in UI)
    - Priority levels (low=green, medium=yellow, high=red)
    """
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    
    # Index on completed helps speed up queries like "show only incomplete tasks"
    completed = db.Column(db.Boolean, default=False, index=True)
    
    # Collapsed determines if subtasks are hidden in the UI
    collapsed = db.Column(db.Boolean, default=False)
    
    # Priority uses traffic light colors: low=green, medium=yellow, high=red
    priority = db.Column(db.String(20), default='medium')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign key to TodoList - every task belongs to a list
    list_id = db.Column(db.Integer, db.ForeignKey('todo_lists.id'), nullable=False, index=True)
    
    # Self-referencing foreign key for hierarchy
    # parent_id = None means this is a top-level task
    # parent_id = some_id means this task is a subtask of task with id=some_id
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), index=True)
    
    # Self-referencing relationship - this is the tricky part!
    # This allows a task to have subtasks, which themselves can have subtasks, etc.
    # remote_side=[id] tells SQLAlchemy which side is the "parent" in the relationship
    # cascade='all, delete-orphan' means deleting a task deletes all its subtasks
    subtasks = db.relationship(
        'Task',  # Relationship to the same model (self-referencing)
        backref=db.backref('parent', remote_side=[id]),  # Creates parent attribute on child tasks
        lazy=True,  # Don't load subtasks until accessed
        cascade='all, delete-orphan'  # Cascade deletes down the hierarchy
    )
    
    def get_depth(self):
        """
        Calculate how deep this task is in the hierarchy.
        
        This method walks up the parent chain counting levels.
        Example: If task C is a subtask of B, and B is a subtask of A,
        then C.get_depth() returns 3.
        
        Returns:
            int: Depth level (1=top-level, 2=subtask, 3=sub-subtask, etc.)
        """
        depth = 1
        current = self
        # Keep going up the parent chain until we reach a top-level task
        while current.parent_id is not None:
            depth += 1
            current = current.parent  # Move to parent task
        return depth
    
    def mark_complete(self, status=True):
        """
        Mark this task as complete/incomplete with smart cascading logic.
        
        Cascade DOWN (to children) ONLY when marking complete (status=True):
        - Completing a parent completes all its subtasks
        
        NO cascade DOWN when unmarking (status=False):
        - Unchecking a parent does NOT uncheck its children
        - This allows users to keep completed subtasks when unchecking parent
        
        Args:
            status (bool): True to mark complete, False to mark incomplete
        """
        self.completed = status
        
        # Only cascade to children when MARKING as complete, not when unmarking
        if status:
            for subtask in self.subtasks:
                subtask.mark_complete(True)  # Recursive call
    
    def move_to_list(self, new_list_id):
        """
        Move this task (and all its subtasks) to a different list.
        Only top-level tasks can be moved between lists (MVP requirement).
        
        Why the restriction? Subtasks are conceptually "part of" their parent task,
        so moving only a subtask to another list would break the hierarchy.
        
        Args:
            new_list_id (int): ID of the destination list
            
        Raises:
            ValueError: If task is not top-level (has a parent) or list doesn't exist
        """
        # Check if this is a top-level task
        if self.parent_id is not None:
            raise ValueError("Only top-level tasks can be moved between lists")
        
        # Verify the destination list exists
        new_list = TodoList.query.get(new_list_id)
        if not new_list:
            raise ValueError("Destination list not found")
        
        # Recursive function to move task and all descendants
        def move_recursive(task):
            task.list_id = new_list_id  # Update list_id
            for subtask in task.subtasks:
                move_recursive(subtask)  # Recursively move all subtasks
        
        move_recursive(self)  # Start the recursive process
    
    def to_dict(self, include_subtasks=False):
        """
        Convert task to dictionary for JSON API responses.
        
        This method can recursively include subtasks, creating a nested JSON structure.
        Example output:
        {
            'id': 1,
            'title': 'Parent Task',
            'subtasks': [
                {'id': 2, 'title': 'Subtask 1', 'subtasks': [...]},
                {'id': 3, 'title': 'Subtask 2', 'subtasks': [...]}
            ]
        }
        
        Args:
            include_subtasks (bool): If True, recursively includes all subtasks
                                     If False, only returns this task's data
            
        Returns:
            dict: Task data with optional nested subtasks
        """
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'collapsed': self.collapsed,
            'priority': self.priority,
            'list_id': self.list_id,
            'parent_id': self.parent_id,
            'depth': self.get_depth(),  # Calculate depth dynamically
            'created_at': self.created_at.isoformat(),  # Convert datetime to string
            'subtask_count': len(self.subtasks)  # How many direct children
        }
        
        if include_subtasks:
            # Recursively convert all subtasks to dictionaries
            result['subtasks'] = [
                subtask.to_dict(include_subtasks=True)  # Recursive call
                for subtask in self.subtasks
            ]
        
        return result
