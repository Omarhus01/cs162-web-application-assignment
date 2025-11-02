# Quick Setup Guide

## First Time Setup

### Backend Setup (One-time)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend Setup (One-time)
```powershell
cd frontend
npm install
```

## Running the Application

### Option 1: Automated (Recommended)
Simply run the PowerShell script from the root directory:
```powershell
.\START_APP.ps1
```

This will open two terminal windows:
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000

### Option 2: Manual

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

## Accessing the App

Open your browser to: **http://localhost:3000**

1. Register a new account
2. Login with your credentials
3. Start creating todo lists and tasks!

## Stopping the Servers

Press `Ctrl+C` in each terminal window to stop the servers.

## Project Structure

```
TodoApp w/
├── backend/           # Flask REST API
│   ├── app.py        # Main API application
│   ├── models.py     # Database models
│   ├── config.py     # Configuration
│   └── requirements.txt
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── README.md         # Full documentation
└── SETUP.md          # This file
```

## MVP Features Checklist

✅ Multi-user support with data isolation  
✅ User authentication (registration/login)  
✅ Task completion (cascades to subtasks)  
✅ Hierarchical tasks (3 levels max)  
✅ Collapse/expand subtasks  
✅ Move top-level tasks between lists  
✅ Persistent storage (SQLite database)  

## Technologies Used

**Backend:**
- Flask 2.3.3
- Flask-SQLAlchemy 3.0.5
- Flask-CORS 4.0.0
- Flask-JWT-Extended 4.5.3
- SQLite

**Frontend:**
- React 18
- React Router 6
- Axios
- Bootstrap 5
- React Bootstrap

## Need Help?

See the full README.md for detailed documentation, troubleshooting, and usage guide.
