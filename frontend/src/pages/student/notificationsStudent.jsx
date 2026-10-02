import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 🧩 Shared Components
import Nav from "../../components/nav";
import Footer from "../../components/footer";

// 📡 Services
import notificationService from "../../services/notificationService";

// 🎨 Styles
import "../../assets/shared/notifications.css";

// Icon mapping
const getNotificationIcon = (type) => {
  const icons = {
    event: "🎉",
    warning: "⚠️",
    reminder: "⏰",
    info: "ℹ️",
    system: "⚙️",
    update: "📢",
    other: "🔔",
  };
  return icons[type] || "🔔";
};

export default function NotificationsStudent() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, event, reminder

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await notificationService.getNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching student notifications:", err);
        if (err.response?.status === 401) {
          navigate("/login-student");
        } else {
          setError("Failed to load notifications. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [navigate]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notifications];

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter === "event") {
      filtered = filtered.filter((n) => n.type === "event");
    } else if (filter === "reminder") {
      filtered = filtered.filter((n) => n.type === "reminder");
    }

    // Sort by date descending
    filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prevNotes) =>
        prevNotes.map((note) =>
          note._id === notificationId ? { ...note, read: true } : note
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prevNotes) =>
        prevNotes.map((note) => ({ ...note, read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.delete(notificationId);
      setNotifications((prevNotes) =>
        prevNotes.filter((note) => note._id !== notificationId)
      );
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <>
      {/* ✅ Top Navigation */}
      <Nav />

      <div className="notifications-container">
        <div className="notifications-header">
          <div>
            <h1 className="notifications-title">🔔 My Notifications</h1>
            {unreadCount > 0 && (
              <p className="unread-badge">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="notification-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "event" ? "active" : ""}`}
            onClick={() => setFilter("event")}
          >
            Events
          </button>
          <button
            className={`filter-btn ${filter === "reminder" ? "active" : ""}`}
            onClick={() => setFilter("reminder")}
          >
            Reminders
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}

        {/* Loading State */}
        {loading && <p className="loading-text">Loading notifications...</p>}

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="no-notifications">
            <span>🔔</span>
            <p>
              {filter === "all"
                ? "No notifications yet"
                : `No ${filter} notifications`}
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${
                  notification.read ? "read" : "unread"
                }`}
              >
                <div className="notification-icon-large">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content-full">
                  <div className="notification-title-full">
                    {notification.title}
                    {!notification.read && (
                      <span className="new-badge">NEW</span>
                    )}
                  </div>
                  <p className="notification-message-full">
                    {notification.message}
                  </p>
                  <div className="notification-meta">
                    <span className="notification-type">
                      {notification.type}
                    </span>
                    <span className="notification-date">
                      {new Date(notification.createdAt).toLocaleDateString()}{" "}
                      {new Date(notification.createdAt).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="action-btn mark-read"
                      onClick={() => handleMarkAsRead(notification._id)}
                      title="Mark as read"
                    >
                      ✓ Read
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(notification._id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Footer */}
      <Footer />
    </>
  );
}
