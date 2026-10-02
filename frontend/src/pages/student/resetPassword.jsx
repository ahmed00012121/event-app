import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../../assets/shared/auth.css';
import { resetPassword } from '../../services/authStudentService';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await resetPassword(token, { password });
      setMessage(res.message || 'Password reset successful');
      setTimeout(() => navigate('/login-student'), 1500);
    } catch (err) {
      console.error('Reset password failed', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</button>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <div className="login-links">
        <Link to="/login-student">Back to Login</Link>
      </div>
    </div>
  );
}
