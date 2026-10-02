import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/shared/auth.css";
import { signupStudent } from "../../services/authStudentService";

export default function SignupStudent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const validateInputs = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return false;
    }

    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      setError("Name should contain only letters.");
      return false;
    }

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateInputs()) {
      return;
    }

    try {
      const response = await signupStudent({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      console.log("Signup success:", response);

      setSuccess("Signup successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login-student");
      }, 2000);
    } catch (err) {
      console.error("Signup failed:", err);

      if (
        err.status === 400 &&
        err.message === "Email already exists"
      ) {
        setError("Email already exists. Please use a different email to create a new account");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Unable to create your account. Please try again.");
      }

      setSuccess("");
    }
  };

  return (
    <div className="login-container">
      <h2>Student Signup</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          required
        />

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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          required
        />

        <button type="submit">Sign Up</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div className="login-links">
        <Link to="/login-student">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
}

