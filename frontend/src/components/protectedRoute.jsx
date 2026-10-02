import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  adminOnly = false,
  loginPath = "/login-student"
}) {
  const token = localStorage.getItem("token");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    localStorage.removeItem("user");
  }

  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/login-admin" replace />;
  }

  if (!adminOnly && user.role !== "student") {
    return <Navigate to="/login-student" replace />;
  }

  return children;
}