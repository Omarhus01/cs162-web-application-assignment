# Hierarchical TodoApp - CS162 Final Project

**Video Demonstration:** [Loom Video](https://www.loom.com/share/babe48111f424d8a8766cc8e6bbc7405)

**GitHub Repository:** https://github.com/Omarhus01/cs162-web-application-assignment


A full-stack hierarchical task management system built with Flask and React, featuring intelligent task completion cascading and 5-level nesting support.

---

## 📋 Overview

This application allows users to organize complex projects through nested tasks and subtasks. Built with a Flask REST API backend and React frontend, it supports up to 5 levels of task nesting with smart completion logic: checking a parent completes all children, and completing all children auto-completes the parent.

The system uses session-based authentication to keep users' data private, and features a recursive component architecture that dynamically renders the task hierarchy. The dark cyberpunk-themed interface makes it both functional and visually distinctive.

---

## ✨ Key Features

### Core Functionality
- **Multi-user Support** - Private todo lists with session-based authentication
- **5-Level Nesting** - Organize tasks into deep hierarchies (Extension 1)
- **Smart Completion** - Intelligent cascading when checking/unchecking tasks
- **Persistent State** - Collapse/expand states saved to database
- **Task Movement** - Move tasks between lists with all subtasks
- **Duplicate Prevention** - Validates unique names in context

### User Experience
- **Cyberpunk UI** - Custom dark theme with neon accents
- **Priority System** - Color-coded badges (🔴 High, 🟡 Medium, 🟢 Low)
- **Inline Editing** - Double-click to edit task titles
- **Create & Move** - Create new lists directly from move dropdown
- **Task Statistics** - Real-time progress tracking

---

## 🛠️ Technology Stack

**Backend**
- Flask 2.3.3 - REST API framework
- SQLAlchemy - Database ORM with self-referential relationships
- SQLite - Embedded database
- Werkzeug - Password hashing
- Pytest - Testing framework (52 tests, 86% coverage)

**Frontend**
- React 18 - Component-based UI
- React Router 6 - Client-side routing
- Axios - HTTP client
- Bootstrap 5 - Responsive framework
- Custom CSS - Cyberpunk theme

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 14+
- npm 6+

### Backend Setup

**Windows:**
```powershell
cd "TodoApp w\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**macOS/Linux:**
```bash
cd "TodoApp w/backend"
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 app.py
```

✅ Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd "TodoApp w/frontend"
npm install
npm start
```

✅ Frontend runs on `http://localhost:3000`

The database is created automatically on first run. No manual configuration needed!

---

## 🎮 Usage Guide

### Getting Started
1. **Register** - Create account with username, email, password
2. **Login** - Enter credentials to access dashboard
3. **Create List** - Click "+ New List" to organize tasks
4. **Add Tasks** - Create top-level tasks with title, description, priority
5. **Add Subtasks** - Click "⋮" → "➕ Add Subtask" (up to 5 levels deep)

### Task Actions
- **Complete** - Click checkbox (cascades to all subtasks)
- **Edit** - Double-click title or click "⋮" → "✏️ Edit"
- **Change Priority** - Click priority badge → Select level
- **Move to List** - Click "⋮" → "Move to List" → Select or create list
- **Delete** - Click "⋮" → "🗑️ Delete" (removes all subtasks)
- **Collapse/Expand** - Click ▶/▼ button (state persists)

### Checkbox Logic
- **Check parent** → All children auto-check
- **Check all children** → Parent auto-checks
- **Uncheck parent** → Children keep their state
- **Uncheck any child** → Parent auto-unchecks

---

## 🧪 Testing

### Run Tests

```bash
cd "TodoApp w\backend"
.\venv\Scripts\Activate.ps1
pytest tests/ -v
```

### Test Coverage

**52 tests, 100% pass rate, 86% coverage**

| Category | Tests | Coverage |
|----------|-------|----------|
| Authentication | 5 tests | Register, login, sessions |
| Todo Lists | 10 tests | CRUD + duplicate validation |
| Tasks | 15 tests | CRUD, toggle, collapse, move |
| Business Logic | 13 tests | Cascading, nesting, depth limits |
| Duplicates | 8 tests | Name validation across contexts |

```bash
# With coverage report
pytest tests/ --cov=app --cov=models --cov-report=html
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│     React Frontend (localhost:3000)         │
│  Components: Login, Dashboard, ListView,    │
│  TaskItem (recursive), AuthContext          │
└────────────────┬────────────────────────────┘
                 │ HTTP/JSON REST API
┌────────────────▼────────────────────────────┐
│      Flask Backend (localhost:5000)         │
│  Routes: /api/auth/*, /api/lists/*,         │
│  /api/tasks/* (15 endpoints)                │
│  Middleware: CORS, Sessions, Auth           │
└────────────────┬────────────────────────────┘
                 │ SQLAlchemy ORM
┌────────────────▼────────────────────────────┐
│        SQLite Database (todoapp.db)         │
│  Tables: users, todo_lists, tasks           │
│  Relationships: User→Lists(1:N),            │
│  List→Tasks(1:N), Task→Subtasks(1:N)       │
└─────────────────────────────────────────────┘
```

### Key Design Patterns
- **Self-referential Tasks** - `parent_id` foreign key enables unlimited nesting
- **Recursive Components** - TaskItem renders itself for subtask trees
- **Cascade Logic** - Helper functions traverse tree up/down on completion
- **Session Auth** - HTTP-only cookies with server-side validation
- **React Portals** - Dropdowns render outside hierarchy for proper z-index

---

## 📋 Assignment Requirements

### MVP Requirements ✅

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Multi-user support | ✅ | Session auth with user isolation |
| User authentication | ✅ | Register/login with password hashing |
| Task completion | ✅ | Toggle with smart cascading |
| Hierarchical tasks | ✅ Enhanced | **5 levels** (Extension 1) vs MVP's 3 |
| Collapse/expand | ✅ | Persistent state in database |
| Move tasks | ✅ | Top-level tasks with all descendants |
| Persistent storage | ✅ | SQLite with SQLAlchemy ORM |

### Extensions Implemented

**✅ Extension 1: Enhanced Hierarchy**
- **5 levels of nesting** instead of MVP's 3 levels
- `get_depth()` method enforces limit
- Color-coded borders for visual hierarchy
- Backend validation prevents Level 6+

**✅ Extension 3: Unit Testing**
- **52 tests** with **100% pass rate**
- **86% code coverage** (models: 96%, app: 83%)
- Fixtures for test isolation
- Comprehensive edge case validation

---

## 🔒 Security

- **Password Hashing** - Werkzeug pbkdf2:sha256 with 260k iterations
- **Session Management** - HTTP-only cookies with secret key signing
- **SQL Injection Prevention** - SQLAlchemy ORM with parameterized queries
- **XSS Prevention** - React auto-escapes all user content
- **Authorization** - Every endpoint verifies user ownership
- **CORS** - Restricted to localhost:3000 in development

---

## 🐛 Troubleshooting

**Port 5000 in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Module not found:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Database locked:**
```bash
# Stop Flask, delete instance/todoapp.db, restart Flask
```

**Cannot connect to backend:**
- Verify Flask running on http://localhost:5000
- Check `axios.defaults.withCredentials = true` in api.js
- Confirm CORS enabled in app.py

---

## 📁 Project Structure

```
TodoApp w/
├── backend/
│   ├── app.py                    # Flask API (763 lines, 15 routes)
│   ├── models.py                 # Database models (298 lines)
│   ├── requirements.txt          # Python dependencies
│   ├── tests/                    # 52 unit tests
│   │   ├── test_auth.py
│   │   ├── test_lists.py
│   │   ├── test_tasks.py
│   │   ├── test_business_logic.py
│   │   └── test_duplicates.py
│   ├── instance/                 # Database (auto-created)
│   │   └── .gitkeep              # Ensures folder exists in git
│   └── venv/                     # Python virtual env (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/             # Login & Register
│   │   │   ├── Dashboard/        # Lists overview
│   │   │   ├── TodoList/         # ListView component
│   │   │   └── Task/             # TaskItem (recursive, 919 lines)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── services/
│   │   │   └── api.js            # Axios API client
│   │   ├── App.js                # React Router setup
│   │   └── index.css             # Cyberpunk theme (1100+ lines)
│   ├── package.json
│   └── node_modules/             # Node packages (gitignored)
│
├── README.md                     # This file
└── SETUP.md                      # Quick start guide
```

---

## 💡 Development Process

This project was built iteratively over several phases:

1. **Backend Foundation** - Flask API with authentication and database models
2. **Frontend Setup** - React components with routing and state management
3. **Core Features** - Task CRUD, nesting, completion logic
4. **Smart Cascading** - Upward and downward completion propagation
5. **UI Polish** - Cyberpunk theme, inline editing, React Portals
6. **Testing** - Comprehensive pytest suite with 86% coverage
7. **Refinements** - Duplicate validation, "Create & Move" feature, bug fixes


## AI Statement 

I used AI assistance (GitHub Copilot, specifically Claude sonnet 4 and 4.5 alternatively) as a collaborative tool while maintaining full understanding of the code. I made sure I know what is being done, not just sendign the assignment and askign for it to be made. I also made sure that I can have the features that if I'm offered a TODO list as a user, I'd be happy to have these. I asked for it to be dark themed as it's much better forr my eyes than ligh versions. I made sure to cover all edge cases, there might be more but I made sure that whatever I can think of is handled in a good way. 

---

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [pytest Documentation](https://docs.pytest.org/)

---


**🎉 Thank you for checking out this project!**
