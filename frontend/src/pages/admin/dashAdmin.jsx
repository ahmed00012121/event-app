import React from "react";
import { Link, useNavigate } from "react-router-dom";

// 🔗 Shared Components
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import NotificationPanel from "../../components/notificationPanel";

// 🎨 Styles
import "../../assets/admin/dashboard.css";

export default function DashAdmin() {
  const navigate = useNavigate();

  // 🔐 Simple logout handler
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/login-admin");
  };

  return (
    <>
      {/* 🧭 Admin Navigation */}
      <NavAdmin />

      <div className="dashboard-container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div>
            <h1 className="hero-title">📊 Admin Dashboard</h1>
            <p className="hero-sub">Welcome to your event management control center. Manage events, users, feedback, and notifications all in one place.</p>
          </div>
          <div style={{ fontSize: '4rem', opacity: 0.1 }}>⚙️</div>
        </div>

        {/* Main Actions Grid */}
        <div className="dashboard-links">
          <Link to="/add-event" className="link-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>➕</div>
            <div className="link-title">Create Event</div>
            <div className="link-desc">Add a new event to the system</div>
          </Link>

          <Link to="/manage-events" className="link-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</div>
            <div className="link-title">Manage Events</div>
            <div className="link-desc">Edit, delete, view all events</div>
          </Link>

          <Link to="/manage-users" className="link-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
            <div className="link-title">Users</div>
            <div className="link-desc">Manage students and admins</div>
          </Link>

          <Link to="/feedback-admin" className="link-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
            <div className="link-title">Feedback</div>
            <div className="link-desc">Review event feedback</div>
          </Link>

          <Link to="/notifications-admin" className="link-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔔</div>
            <div className="link-title">Notifications</div>
            <div className="link-desc">Send & manage notifications</div>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <section className="dashboard-section">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700 }}>📬 Recent Activity</h3>
          <NotificationPanel />
        </section>
      </div>

      {/* 🦶 Footer */}
      <Footer />
    </>
  );
}
