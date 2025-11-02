/**
 * Register Component
 * ==================
 * User registration form with email, username, and password confirmation.
 * Validates password match before submission.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

function Register() {
  // Form state with all registration fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth and navigation hooks
  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * Update form data on input change
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Handle registration form submission
   * Validates password match and creates new user account
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation: check if passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    // Call registration API
    const result = await register(formData);

    if (result.success) {
      // Show success message and redirect to login
      alert('Registration successful! Please login.');
      navigate('/login');
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
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.3)',
            border: '2px solid #00ffff',
            background: 'rgba(15, 12, 41, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <h1 style={{ fontSize: '3rem', textShadow: '0 0 20px #00ffff' }}>📝</h1>
              <h2 className="mb-2" style={{ fontWeight: '700', color: '#00ffff', textShadow: '0 0 20px #00ffff' }}>
                Join TodoApp!
              </h2>
              <p style={{ color: '#00ff41', textShadow: '0 0 10px #00ff41' }}>
                Create your account to get started
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
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
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

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#00ff41', textShadow: '0 0 5px rgba(0, 255, 65, 0.5)', fontSize: '0.95rem' }}>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
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

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#00ff41', textShadow: '0 0 5px rgba(0, 255, 65, 0.5)', fontSize: '0.95rem' }}>
                  Password
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Choose a password (min 6 characters)"
                  minLength="6"
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
                  Confirm Password
                </Form.Label>
                <Form.Control
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
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
                  background: 'linear-gradient(135deg, #00ffff, #00ff41)',
                  border: 'none',
                  color: '#0f0c29',
                  boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                }}
              >
                {loading ? '⏳ Registering...' : '✨ Register'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="text-center mt-3">
          <p style={{ color: '#00ff41', fontWeight: '600', textShadow: '0 0 10px rgba(0, 255, 65, 0.7)' }}>
            Already have an account? <Link to="/login" style={{ color: '#00ffff', textDecoration: 'underline', textShadow: '0 0 10px #00ffff' }}>Login here</Link>
          </p>
        </div>
      </div>
    </Container>
  );
}

export default Register;
