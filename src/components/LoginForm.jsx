import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginForm({ onClose }) {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await signup(email, password, username);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        onClose?.();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>{isSignup ? 'Create Account' : 'Login'}</h2>

        {error && <div className="error-message">❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Loading...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="toggle-mode">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsSignup(false)}>Login</button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsSignup(true)}>Sign Up</button>
            </>
          )}
        </div>

        <div className="fam-info">
          <p>💰 <strong>Get 5 FAM credits</strong> on signup!</p>
          <p>1 more credit earned daily for engagement</p>
        </div>
      </div>
    </div>
  );
}
