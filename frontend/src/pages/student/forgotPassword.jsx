import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/shared/auth.css';
import { requestPasswordReset } from '../../services/authStudentService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await requestPasswordReset({ email });
      setMessage(res.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      console.error('Forgot password error', err);
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <div className="login-links">
        <Link to="/login-student">Back to Login</Link>
      </div>
    </div>
  );
}
