import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/shared/auth.css";
import { loginAdmin } from "../../services/authAdminService";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await loginAdmin({
        email: email.trim(),
        password: password
      });

      console.log("Admin login success:", response);

      if (!response?.token) {
        throw new Error("Login failed. No authentication token was received.");
      }

      localStorage.setItem("token", response.token);

      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/dash-admin");
      }, 1000);

    } catch (err) {
      console.error("Admin login failed:", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Invalid email or password. Please try again.";

      setError(message);
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          required
        />

        <button type="submit">Login</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div className="login-links">
        <Link to="/login-student">Student Login</Link>
      </div>
    </div>
  );
}