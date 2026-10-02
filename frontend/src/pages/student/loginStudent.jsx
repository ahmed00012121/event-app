import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/shared/auth.css";
import { loginStudent } from "../../services/authStudentService";

export default function LoginStudent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await loginStudent({
        email: trimmedEmail,
        password,
      });

      if (!response?.token) {
        setError("Login could not be completed. Please try again.");
        return;
      }

      localStorage.setItem("token", response.token);

      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/dash-student");
      }, 1500);
    } catch (err) {
      console.error("Login failed:", err);

      if (err.status === 401) {
        setError("Invalid email or password.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Unable to login. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Student Login</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          required
        />

        <button type="submit">Login</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div className="login-links">
        <Link to="/signup-student">
          Don’t have an account? Sign Up
        </Link>

        <Link to="/forgot-password" className="forgot-link">
          Forgot Password?
        </Link>

        <Link to="/login-admin">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

