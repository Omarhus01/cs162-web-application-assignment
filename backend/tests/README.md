# TodoApp Backend Tests

## Running Tests

### Install Test Dependencies

```bash
pip install -r requirements-test.txt
```

### Run All Tests

```bash
pytest
```

### Run with Coverage Report

```bash
pytest --cov=. --cov-report=html --cov-report=term
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
pytest tests/test_lists.py
pytest tests/test_tasks.py
pytest tests/test_business_logic.py
```

### Run with Verbose Output

```bash
pytest -v
```

### Run Specific Test

```bash
pytest tests/test_auth.py::TestAuthentication::test_login_success
```

## Test Structure

```
tests/
├── __init__.py                  # Package initialization
├── conftest.py                  # Pytest fixtures and configuration
├── test_auth.py                 # Authentication tests (11 tests)
├── test_lists.py                # Todo lists CRUD tests (8 tests)
├── test_tasks.py                # Tasks CRUD tests (12 tests)
└── test_business_logic.py       # Business logic tests (10 tests)
```

## Test Coverage

### test_auth.py (11 tests)
- ✅ User registration (success, duplicate, password mismatch)
- ✅ User login (success, wrong password, nonexistent user)
- ✅ Logout functionality
- ✅ Authentication state checking
- ✅ Protected endpoint access control

### test_lists.py (8 tests)
- ✅ Create todo list
- ✅ Get all lists
- ✅ Get single list
- ✅ Delete list
- ✅ Cascade delete tasks when list deleted
- ✅ List isolation between users

### test_tasks.py (12 tests)
- ✅ Create top-level task
- ✅ Create subtask
- ✅ Update task
- ✅ Toggle completion
- ✅ Delete task
- ✅ Cascade delete subtasks
- ✅ Move task between lists
- ✅ Collapse/expand state
- ✅ Expand all tasks
- ✅ Collapse all tasks

### test_business_logic.py (10 tests)
- ✅ Cascading completion (parent to children)
- ✅ Deep nesting cascading
- ✅ Child uncomplete doesn't affect parent
- ✅ 5-level nesting allowed (Extension 1)
- ✅ Task counts calculation
- ✅ Priority default value
- ✅ Priority validation
- ✅ Collapsed state persistence
- ✅ Subtask count calculation

**Total: 41 comprehensive tests** 🎉

## Expected Output

```
=================== test session starts ===================
platform win32 -- Python 3.x.x, pytest-7.4.3
collected 41 items

tests/test_auth.py ...........                      [ 26%]
tests/test_lists.py ........                        [ 46%]
tests/test_tasks.py ............                    [ 75%]
tests/test_business_logic.py ..........             [100%]

=================== 41 passed in X.XXs ====================
```

## Tips

- Tests use in-memory SQLite database (no side effects)
- Each test is isolated with fresh database
- Fixtures handle setup/teardown automatically
- Tests validate HTTP status codes and response data
- Business logic tests verify complex scenarios
