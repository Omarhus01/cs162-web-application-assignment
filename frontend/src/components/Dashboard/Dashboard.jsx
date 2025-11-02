/**
 * Dashboard Component
 * ===================
 * Main dashboard displaying all user's todo lists with statistics.
 * Features:
 * - View all lists with task counts
 * - Create new lists
 * - Delete existing lists
 * - Navigate to individual list views
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Navbar } from 'react-bootstrap';
import { listsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  // Component state
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth and navigation
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load lists on component mount
  useEffect(() => {
    fetchLists();
  }, []);

  /**
   * Fetch all lists from API
   */
  const fetchLists = async () => {
    try {
      const response = await listsAPI.getAll();
      setLists(response.data.lists);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lists:', error);
      setError('Failed to load lists');
      setLoading(false);
    }
  };

  /**
   * Create a new todo list
   */
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      await listsAPI.create({ name: newListName });
      setNewListName('');
      fetchLists(); // Refresh list
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create list');
    }
  };

  /**
   * Delete a list and all its tasks
   * Shows confirmation dialog before deletion
   */
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list and all its tasks?')) {
      return;
    }

    try {
      await listsAPI.delete(listId);
      fetchLists(); // Refresh list
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete list');
    }
  };

  /**
   * Log out user and redirect to login page
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  return (
    <>
      <Navbar className="mb-4" style={{ 
        background: 'rgba(15, 12, 41, 0.95)',
        borderBottom: '2px solid #00ff41',
        boxShadow: '0 5px 20px rgba(0, 255, 65, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 0'
      }}>
        <Container>
          <Navbar.Brand style={{ 
            color: '#00ff41',
            fontWeight: '700',
            fontSize: '1.5rem',
            textShadow: '0 0 15px #00ff41'
          }}>
            📝 TodoApp
          </Navbar.Brand>
          <Navbar.Text style={{ 
            color: '#00ff41',
            textShadow: '0 0 5px rgba(0, 255, 65, 0.5)',
            marginRight: '1rem'
          }}>
            Welcome, {user?.username}!
          </Navbar.Text>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={handleLogout}
            style={{
              border: '2px solid #ff0064',
              color: '#ff0064',
              background: 'rgba(255, 0, 100, 0.1)',
              boxShadow: '0 0 10px rgba(255, 0, 100, 0.3)',
              fontWeight: '600'
            }}
          >
            Logout
          </Button>
        </Container>
      </Navbar>

      <Container>
        <h1 className="mb-4" style={{ 
          color: '#00ff41',
          textShadow: '0 0 20px rgba(0, 255, 65, 0.8)',
          fontSize: '2.5rem',
          fontWeight: '700'
        }}>
          My Todo Lists
        </h1>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {/* Create New List Form */}
        <Card className="mb-4 create-task-section">
          <Card.Body>
            <h5 className="mb-3">✨ Create New List</h5>
            <Form onSubmit={handleCreateList}>
              <Row className="align-items-center">
                <Col md={9}>
                  <Form.Control
                    type="text"
                    placeholder="Enter list name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    size="lg"
                    style={{ 
                      borderRadius: '25px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Button 
                    type="submit" 
                    className="w-100"
                    size="lg"
                    style={{ 
                      borderRadius: '25px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #00ff41, #00ffff)',
                      border: 'none',
                      color: '#0f0c29',
                      padding: '0 40px',
                      boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
                    }}
                  >
                    Create
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Lists Grid */}
        <Row>
          {lists.length === 0 ? (
            <Col>
              <Alert variant="info">
                No lists yet. Create your first todo list above!
              </Alert>
            </Col>
          ) : (
            lists.map((list) => (
              <Col md={4} key={list.id} className="mb-4">
                <Card 
                  className="h-100" 
                  style={{ 
                    transition: 'all 0.3s ease',
                    borderRadius: '15px',
                    border: '2px solid #00ff41',
                    background: 'rgba(15, 12, 41, 0.8)',
                    boxShadow: '0 5px 20px rgba(0, 255, 65, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 255, 65, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 255, 65, 0.2)';
                  }}
                >
                  <Card.Body>
                    <Card.Title style={{ fontSize: '1.4rem', fontWeight: '700', color: '#00ff41', textShadow: '0 0 10px rgba(0, 255, 65, 0.5)' }}>
                      📋 {list.name}
                    </Card.Title>
                    <Card.Text style={{ fontSize: '1rem', color: '#e0e0e0' }}>
                      <div className="mb-2">
                        <strong style={{ color: '#00d9ff', textShadow: '0 0 5px rgba(0, 217, 255, 0.5)' }}>{list.task_count}</strong> tasks
                      </div>
                      <div className="mb-2">
                        <strong style={{ color: '#00ff41', textShadow: '0 0 5px rgba(0, 255, 65, 0.5)' }}>{list.completed_count}</strong> completed
                      </div>
                      <div style={{ color: '#ffa500', fontSize: '0.9rem', fontWeight: '500', textShadow: '0 0 5px rgba(255, 165, 0, 0.3)' }}>
                        📅 Created: {new Date(list.created_at).toLocaleDateString()}
                      </div>
                    </Card.Text>
                    <div className="d-grid gap-2">
                      <Button
                        onClick={() => navigate(`/list/${list.id}`)}
                        style={{ 
                          borderRadius: '20px',
                          fontWeight: '700',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #00ff41, #00ffff)',
                          border: 'none',
                          color: '#0f0c29',
                          boxShadow: '0 0 15px rgba(0, 255, 65, 0.5)'
                        }}
                      >
                        View Tasks →
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        style={{ 
                          borderRadius: '20px',
                          fontWeight: '600',
                          background: 'rgba(255, 20, 147, 0.15)',
                          border: '2px solid #ff1493',
                          color: '#ff1493',
                          boxShadow: '0 0 10px rgba(255, 20, 147, 0.3)'
                        }}
                      >
                        🗑️ Delete List
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;
