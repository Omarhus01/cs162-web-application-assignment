"""
Flask REST API Backend for Hierarchical TodoApp
================================================
A RESTful API that provides endpoints for user authentication,
todo list management, and hierarchical task operations.

This is the main Flask application file. It defines all API endpoints
that the React frontend calls. The API uses REST principles and returns JSON.

Features Implemented:
- Session-based authentication (using Flask sessions with cookies)
- Multi-user support with strict data isolation (users can only see their own data)
- CRUD operations for lists and tasks
- Extension 1: Hierarchical task management (5 levels deep, not just 3)
- Task completion with automatic cascading to all subtasks
- Collapse/expand state persistence in database
- Move top-level tasks between lists (MVP requirement)

Security:
- All routes (except register/login) require authentication
- Ownership verification prevents users from accessing others' data
- Passwords are hashed, never stored in plain text

Author: Created for CS162 Web Application Assignment
Extension 1 Implemented: 5-level task nesting
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from models import db, User, TodoList, Task
from functools import wraps
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
# SECRET_KEY is used for session encryption - keep it secret in production!
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# SQLite database file location (absolute path)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "instance", "todo.db")}'

# Disable modification tracking to save memory (we don't need it)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS (Cross-Origin Resource Sharing) setup
# This allows the React frontend (running on port 3000) to make requests to Flask (port 5000)
# Without CORS, browsers block requests between different ports for security
CORS(app, 
     origins=['http://localhost:3000'],  # Only allow requests from React frontend
     supports_credentials=True,  # Important! Allows cookies to be sent with requests
     allow_headers=['Content-Type', 'Authorization'],  # Headers frontend can send
     expose_headers=['Content-Type', 'Authorization'])  # Headers frontend can read

# Initialize SQLAlchemy with this Flask app
db.init_app(app)


# =============================================================================
# HELPER FUNCTIONS
# These are utility functions used by multiple routes
# =============================================================================

def login_required(f):
    """
    Decorator to protect routes that need authentication.
    
    Usage: @login_required above a route function
    
    How it works:
    1. Checks if 'user_id' exists in session (session is like a dictionary stored in a cookie)
    2. If yes, allows the route function to run
    3. If no, returns 401 Unauthorized error
    
    This prevents users from accessing API endpoints without logging in first.
    """
    @wraps(f)  # Preserves the original function's name and docstring
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)  # Call the original function
    return decorated_function

def get_current_user():
    """
    Get the currently logged-in user from the session.
    
    Returns:
        User: The user object if logged in
        None: If not logged in or user doesn't exist
    """
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)  # Query database for user


def verify_list_ownership(list_id, user_id):
    """
    Security check: Verify that a list belongs to the user.
    
    This prevents users from accessing or modifying other users' lists.
    For example, if User A tries to access User B's list by guessing the ID,
    this function will return None and the API will return an error.
    
    Args:
        list_id (int): ID of the list to verify
        user_id (int): ID of the user claiming ownership
        
    Returns:
        TodoList: The list if it exists AND belongs to the user
        None: If list doesn't exist OR doesn't belong to user
    """
    return TodoList.query.filter_by(id=list_id, user_id=user_id).first()


def verify_task_ownership(task_id, user_id):
    """
    Security check: Verify that a task belongs to a list owned by the user.
    
    Tasks don't have a user_id directly, but they belong to a list,
    and the list belongs to a user. So we check:
    task -> list -> user
    
    Args:
        task_id (int): ID of the task to verify
        user_id (int): ID of the user claiming ownership
        
    Returns:
        Task: The task if it exists AND its list belongs to the user
        None: If task doesn't exist OR doesn't belong to user
    """
    task = Task.query.get(task_id)
    if task and task.todo_list.user_id == user_id:
        return task
    return None


# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """
    Register a new user account.
    
    Request JSON:
        {
            "username": "string",
            "email": "string",
            "password": "string",
            "confirm_password": "string"
        }
    
    Returns:
        201: User created successfully
        400: Validation error or user already exists
    """
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['username', 'email', 'password', 'confirm_password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate passwords match
    if data['password'] != data['confirm_password']:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    # Check if username exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    # Check if email exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    # No default list - let users create their own lists
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Login with username and password.
    
    Request JSON:
        {
            "username": "string",
            "password": "string"
        }
    
    Returns:
        200: Login successful
        401: Invalid credentials
    """
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Missing username or password'}), 400
    
    # Find user
    user = User.query.filter_by(username=data['username']).first()
    
    # Verify password
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Store user_id in session
    session['user_id'] = user.id
    session.permanent = True  # Make session permanent (24 hours)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/user', methods=['GET'])
@login_required
def get_user():
    """
    Get current authenticated user information.
    
    Requires: User session
    
    Returns:
        200: User data
        401: Unauthorized
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """Logout user by clearing session."""
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


# =============================================================================
# TODO LIST ROUTES
# =============================================================================

@app.route('/api/lists', methods=['GET'])
@login_required
def get_lists():
    """
    Get all todo lists for the current user.
    
    Returns:
        200: List of todo lists with statistics
    """
    user = get_current_user()
    lists = TodoList.query.filter_by(user_id=user.id).all()
    
    return jsonify({
        'lists': [todo_list.to_dict() for todo_list in lists]
    }), 200


@app.route('/api/lists/<int:list_id>', methods=['GET'])
@login_required
def get_list(list_id):
    """
    Get a specific todo list with all its tasks.
    
    Args:
        list_id (int): ID of the list
    
    Returns:
        200: List data with nested tasks
        404: List not found or access denied
    """
    user = get_current_user()
    todo_list = verify_list_ownership(list_id, user.id)
    
    if not todo_list:
        return jsonify({'error': 'List not found'}), 404
    
    return jsonify(todo_list.to_dict(include_tasks=True)), 200


@app.route('/api/lists', methods=['POST'])
@login_required
def create_list():
    """
    Create a new todo list.
    
    Request JSON:
        {
            "name": "string"
        }
    
    Returns:
        201: List created successfully
        400: Validation error (missing name or duplicate name)
    """
    user = get_current_user()
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'List name is required'}), 400
    
    list_name = data['name'].strip()
    
    # Check if user already has a list with this name
    existing_list = TodoList.query.filter_by(
        user_id=user.id,
        name=list_name
    ).first()
    
    if existing_list:
        return jsonify({'error': f'You already have a list named "{list_name}"'}), 400
    
    new_list = TodoList(name=list_name, user_id=user.id)
    db.session.add(new_list)
    db.session.commit()
    
    return jsonify({
        'message': 'List created successfully',
        'list': new_list.to_dict()
    }), 201


@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_list(list_id):
    """
    Delete a todo list and all its tasks.
    
    Args:
        list_id (int): ID of the list
    
    Returns:
        200: List deleted successfully
        404: List not found or access denied
    """
    user = get_current_user()
    todo_list = verify_list_ownership(list_id, user.id)
    
    if not todo_list:
        return jsonify({'error': 'List not found'}), 404
    
    db.session.delete(todo_list)
    db.session.commit()
    
    return jsonify({'message': 'List deleted successfully'}), 200


# =============================================================================
# TASK ROUTES
# =============================================================================

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """
    Create a new task or subtask.
    
    Request JSON:
        {
            "list_id": int,
            "title": "string",
            "description": "string" (optional),
            "priority": "low|medium|high" (optional),
            "parent_id": int (optional, for creating subtasks)
        }
    
    Returns:
        201: Task created successfully
        400: Validation error
        404: List or parent task not found
    """
    user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('list_id') or not data.get('title'):
        return jsonify({'error': 'List ID and title are required'}), 400
    
    task_title = data['title'].strip()
    
    # Verify list ownership
    todo_list = verify_list_ownership(data['list_id'], user.id)
    if not todo_list:
        return jsonify({'error': 'List not found'}), 404
    
    # Check hierarchy depth if creating a subtask
    parent_id = data.get('parent_id')
    if parent_id:
        # Verify parent task exists and belongs to user
        parent_task = verify_task_ownership(parent_id, user.id)
        if not parent_task:
            return jsonify({'error': 'Parent task not found'}), 404
        
        # Extension 1 Implementation: Allow 5 levels of nesting
        # MVP requirement was 3 levels, we implemented 5 levels as Extension 1
        # We enforce this limit for UI usability (deeper nesting becomes hard to display)
        if parent_task.get_depth() >= 5:
            return jsonify({'error': 'Maximum depth of 5 levels reached (Extension 1)'}), 400
        
        # Check for duplicate subtask name under the same parent
        existing_subtask = Task.query.filter_by(
            parent_id=parent_id,
            title=task_title
        ).first()
        
        if existing_subtask:
            return jsonify({'error': f'A subtask named "{task_title}" already exists here'}), 400
    else:
        # Check for duplicate top-level task name in the same list
        existing_task = Task.query.filter_by(
            list_id=data['list_id'],
            parent_id=None,
            title=task_title
        ).first()
        
        if existing_task:
            return jsonify({'error': f'A task named "{task_title}" already exists in this list'}), 400
    
    # Create the new task
    new_task = Task(
        title=task_title,
        description=data.get('description', ''),  # Optional field, defaults to empty string
        list_id=data['list_id'],
        parent_id=parent_id,  # None for top-level tasks
        priority=data.get('priority', 'medium')  # Defaults to 'medium' if not provided
    )
    db.session.add(new_task)
    db.session.commit()  # Save to database
    
    return jsonify({
        'message': 'Task created successfully',
        'task': new_task.to_dict(include_subtasks=True)  # Return task with nested subtasks
    }), 201


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """
    Update a task's title, description, or priority.
    
    Request JSON:
        {
            "title": "string" (optional),
            "description": "string" (optional),
            "priority": "low|medium|high" (optional)
        }
    
    Returns:
        200: Task updated successfully
        404: Task not found or access denied
    """
    user = get_current_user()
    task = verify_task_ownership(task_id, user.id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    # If updating title, check for duplicates
    if 'title' in data:
        new_title = data['title'].strip()
        
        # Check for duplicate name (excluding the current task)
        if task.parent_id:
            # For subtasks, check siblings under same parent
            duplicate = Task.query.filter(
                Task.parent_id == task.parent_id,
                Task.title == new_title,
                Task.id != task.id  # Exclude current task
            ).first()
            
            if duplicate:
                return jsonify({'error': f'A subtask named "{new_title}" already exists here'}), 400
        else:
            # For top-level tasks, check within same list
            duplicate = Task.query.filter(
                Task.list_id == task.list_id,
                Task.parent_id == None,
                Task.title == new_title,
                Task.id != task.id  # Exclude current task
            ).first()
            
            if duplicate:
                return jsonify({'error': f'A task named "{new_title}" already exists in this list'}), 400
        
        task.title = new_title
    
    if 'description' in data:
        task.description = data['description']
    if 'priority' in data and data['priority'] in ['low', 'medium', 'high']:
        task.priority = data['priority']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': task.to_dict(include_subtasks=True)
    }), 200


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """
    Delete a task and all its subtasks.
    
    Args:
        task_id (int): ID of the task
    
    Returns:
        200: Task deleted successfully
        404: Task not found or access denied
    """
    user = get_current_user()
    task = verify_task_ownership(task_id, user.id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'}), 200


@app.route('/api/tasks/<int:task_id>/toggle', methods=['PATCH'])
@login_required
def toggle_task(task_id):
    """
    Toggle task completion status with smart cascading logic.
    
    Behavior:
    1. Checking a task → all its descendants get checked (CASCADE DOWN)
    2. Checking all children → parent auto-checks (CASCADE UP)
    3. Unchecking a task → descendants stay as they were (NO CASCADE DOWN)
    4. Unchecking any child → all ancestors get unchecked (CASCADE UP)
    
    Args:
        task_id (int): ID of the task
    
    Returns:
        200: Task toggled successfully
        404: Task not found or access denied
    """
    user = get_current_user()
    task = verify_task_ownership(task_id, user.id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Toggle completion status
    new_status = not task.completed
    
    # Mark this task (CASCADE DOWN handled by mark_complete method)
    # mark_complete only cascades down when marking as complete (new_status=True)
    task.mark_complete(new_status)
    
    # Handle CASCADE UP logic
    if new_status:
        # CHECKING: If all siblings are now complete, auto-complete parent
        _cascade_up_on_complete(task)
    else:
        # UNCHECKING: Uncheck all ancestors up the chain
        _cascade_up_on_incomplete(task)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task status updated',
        'task': task.to_dict(include_subtasks=True)
    }), 200


def _cascade_up_on_complete(task):
    """
    Recursively check if parent should be completed when a child is completed.
    If all siblings are complete, mark parent as complete and continue up the chain.
    
    Args:
        task (Task): The task that was just completed
    """
    if not task.parent_id:
        return  # No parent to cascade to
    
    parent_task = Task.query.get(task.parent_id)
    if not parent_task or parent_task.completed:
        return  # Parent already complete or doesn't exist
    
    # Check if ALL siblings (including this task) are now complete
    siblings = Task.query.filter_by(parent_id=task.parent_id).all()
    if all(sibling.completed for sibling in siblings):
        # Mark parent as complete
        parent_task.completed = True
        # Recursively check parent's parent
        _cascade_up_on_complete(parent_task)


def _cascade_up_on_incomplete(task):
    """
    Recursively uncheck all ancestors when a task is unchecked.
    This ensures that if any child is incomplete, all parents are incomplete.
    
    Args:
        task (Task): The task that was just unchecked
    """
    if not task.parent_id:
        return  # No parent to cascade to
    
    parent_task = Task.query.get(task.parent_id)
    if not parent_task:
        return  # Parent doesn't exist
    
    if parent_task.completed:
        # Uncheck parent
        parent_task.completed = False
        # Recursively uncheck grandparents
        _cascade_up_on_incomplete(parent_task)


@app.route('/api/tasks/<int:task_id>/collapse', methods=['PATCH'])
@login_required
def collapse_task(task_id):
    """
    Toggle or set the collapse state of a task.
    
    Request JSON (optional):
        {
            "collapsed": boolean
        }
    
    Args:
        task_id (int): ID of the task
    
    Returns:
        200: Collapse state updated
        404: Task not found or access denied
    """
    user = get_current_user()
    task = verify_task_ownership(task_id, user.id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json() or {}
    
    if 'collapsed' in data:
        task.collapsed = bool(data['collapsed'])
    else:
        task.collapsed = not task.collapsed
    
    db.session.commit()
    
    return jsonify({
        'message': 'Collapse state updated',
        'collapsed': task.collapsed
    }), 200


@app.route('/api/tasks/<int:task_id>/move', methods=['PATCH'])
@login_required
def move_task(task_id):
    """
    Move a top-level task to a different list.
    
    Request JSON:
        {
            "new_list_id": int
        }
    
    Args:
        task_id (int): ID of the task
    
    Returns:
        200: Task moved successfully
        400: Validation error (not top-level or invalid list)
        404: Task or list not found
    """
    user = get_current_user()
    task = verify_task_ownership(task_id, user.id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    new_list_id = data.get('new_list_id')
    
    if not new_list_id:
        return jsonify({'error': 'New list ID is required'}), 400
    
    # Verify new list ownership
    new_list = verify_list_ownership(new_list_id, user.id)
    if not new_list:
        return jsonify({'error': 'Destination list not found'}), 404
    
    # Check if task is top-level
    if task.parent_id is not None:
        return jsonify({'error': 'Only top-level tasks can be moved between lists'}), 400
    
    try:
        task.move_to_list(new_list_id)
        db.session.commit()
        
        return jsonify({
            'message': 'Task moved successfully',
            'task': task.to_dict(include_subtasks=True)
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# =============================================================================
# APPLICATION ENTRY POINT
# =============================================================================

if __name__ == '__main__':
    # Create database tables
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")
        print("🚀 Flask API running on http://localhost:5000")
    
    # Run development server
    app.run(debug=True, host='0.0.0.0', port=5000)
