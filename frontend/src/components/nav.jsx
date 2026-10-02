import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationPanel from "./notificationPanel";
import notificationService from "../services/notificationService";
import "../assets/shared/nav.css";

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data || []);
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login-student");
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header-left">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <span className="app-title">Event App</span>
        </div>

        <div className="app-header-center">
          <span className="app-message">Discover our events</span>
        </div>

        <div className="app-header-right">
          <div className="notification-bell-container">
            <button
              className="notification-bell"
              onClick={() => setNotificationOpen(!notificationOpen)}
              aria-label="Toggle notifications"
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {notificationOpen && (
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                isDropdownMode={true}
              />
            )}
          </div>
        </div>
      </header>

      <nav className={`nav-student ${menuOpen ? "open" : ""}`}>
        <div className="nav-logo">
          <span className="logo-emoji">🎓</span>
          <span className="logo-text">Event App</span>
        </div>

        <ul className="nav-list">
          <li className="nav-section">
            <Link
              to="/dash-student"
              onClick={() => setMenuOpen(false)}
              className="nav-link primary"
            >
              <span className="nav-icon">📊</span>Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/reg"
              onClick={() => setMenuOpen(false)}
              className="nav-link primary"
            >
              <span className="nav-icon">📝</span>Register
            </Link>
          </li>

          <li>
            <Link
              to="/event-details"
              onClick={() => setMenuOpen(false)}
              className="nav-link primary"
            >
              <span className="nav-icon">🎉</span>Event Details
            </Link>
          </li>

          <li className="nav-divider"></li>

          <li>
            <Link
              to="/recommend"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
            >
              <span className="nav-icon">⭐</span>Recommendations
            </Link>
          </li>

          <li>
            <Link
              to="/notifications-student"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
            >
              <span className="nav-icon">🔔</span>Notifications
            </Link>
          </li>

          <li className="nav-divider"></li>

          <li>
            <Link
              to="/profile-user"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
            >
              <span className="nav-icon">👤</span>Profile
            </Link>
          </li>

          <li>
            <Link
              to="/feedback-student"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
            >
              <span className="nav-icon">💭</span>Feedback
            </Link>
          </li>

          <li className="nav-divider"></li>

          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-link logout"
            >
              <span className="nav-icon">🚪</span>Logout
            </button>
          </li>
        </ul>
      </nav>

      {menuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}

export default Nav;