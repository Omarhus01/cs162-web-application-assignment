/**
 * Login Component
 * ===============
 * User login form with username and password.
 * Redirects to dashboard on successful authentication.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

function Login() {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth and navigation hooks
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * Attempts login and redirects to dashboard on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Call login API
    const result = await login({ username, password });

    if (result.success) {
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    } else {
      // Show error message
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Container 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '450px' }}>
        <Card 
          style={{ 
            borderRadius: '20px',
            boxShadow: '0 0 40px rgba(0, 255, 65, 0.5), 0 0 80px rgba(0, 255, 65, 0.3)',
            border: '2px solid #00ff41',
            background: 'rgba(15, 12, 41, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <h1 style={{ fontSize: '3rem', textShadow: '0 0 20px #00ff41' }}>📝</h1>
              <h2 className="mb-2" style={{ fontWeight: '700', color: '#00ff41', textShadow: '0 0 20px #00ff41' }}>
                Welcome Back!
              </h2>
              <p style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>
                Login to your TodoApp account
              </p>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#00ff41', textShadow: '0 0 5px rgba(0, 255, 65, 0.5)', fontSize: '0.95rem' }}>
                  Username
                </Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  size="lg"
                  style={{ 
                    borderRadius: '15px',
                    border: '2px solid rgba(0, 255, 65, 0.3)',
                    backgroundColor: 'rgba(15, 12, 41, 0.6)',
                    color: '#00ff41',
                    boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)',
                    backdropFilter: 'blur(5px)'
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: '600', color: '#00ff41', textShadow: '0 0 5px rgba(0, 255, 65, 0.5)', fontSize: '0.95rem' }}>
                  Password
                </Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  size="lg"
                  style={{ 
                    borderRadius: '15px',
                    border: '2px solid rgba(0, 255, 65, 0.3)',
                    backgroundColor: 'rgba(15, 12, 41, 0.6)',
                    color: '#00ff41',
                    boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)',
                    backdropFilter: 'blur(5px)'
                  }}
                />
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                size="lg"
                disabled={loading}
                style={{
                  borderRadius: '25px',
                  fontWeight: '700',
                  padding: '14px',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #00ff41, #00ffff)',
                  border: 'none',
                  color: '#0f0c29',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
                }}
              >
                {loading ? '🔄 Logging in...' : '🚀 Login'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="text-center mt-3">
          <p style={{ color: '#00ff41', fontWeight: '600', textShadow: '0 0 10px rgba(0, 255, 65, 0.7)' }}>
            Don't have an account? <Link to="/register" style={{ color: '#00ffff', textDecoration: 'underline', textShadow: '0 0 10px #00ffff' }}>Register here</Link>
          </p>
        </div>
      </div>
    </Container>
  );
}

export default Login;
