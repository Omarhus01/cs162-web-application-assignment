"""
Pytest Configuration and Fixtures
==================================
Setup test database, app context, and reusable fixtures.
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app
from models import db, User, TodoList, Task


@pytest.fixture(scope='function')
def app():
    """Create and configure a test Flask application."""
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',  # In-memory database
        'SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
        'SESSION_COOKIE_SECURE': False
    })
    
    # Create tables
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def test_user(app):
    """Create a test user in the database."""
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password': 'testpass123'  # Plain password for login tests
        }


@pytest.fixture(scope='function')
def authenticated_client(client, test_user):
    """Create a client with an authenticated session."""
    response = client.post('/api/auth/login', json={
        'username': test_user['username'],
        'password': test_user['password']
    })
    assert response.status_code == 200
    return client


@pytest.fixture(scope='function')
def test_list(app, test_user):
    """Create a test todo list."""
    with app.app_context():
        todo_list = TodoList(
            name='Test List',
            user_id=test_user['id']
        )
        db.session.add(todo_list)
        db.session.commit()
        return {
            'id': todo_list.id,
            'name': todo_list.name,
            'user_id': todo_list.user_id
        }


@pytest.fixture(scope='function')
def test_task(app, test_list):
    """Create a test task."""
    with app.app_context():
        task = Task(
            title='Test Task',
            description='Test description',
            list_id=test_list['id'],
            priority='medium',
            completed=False
        )
        db.session.add(task)
        db.session.commit()
        return {
            'id': task.id,
            'title': task.title,
            'list_id': task.list_id
        }
