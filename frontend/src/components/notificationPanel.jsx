import React, { useState, useEffect, useCallback } from "react";
import "../assets/shared/components.css";
import notificationService from "../services/notificationService";

// Icon mapping based on notification type
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

// Toast notification for popup display
const NotificationToast = ({ notification, onClose }) => (
  <div className={`notification-toast ${notification.type || 'info'}`}>
    <span className="notification-icon">
      {getNotificationIcon(notification.type)}
    </span>
    <div className="notification-content-toast">
      <p className="notification-message">
        <strong>{notification.title || 'Notification'}</strong>
        <br />
        {notification.message}
      </p>
    </div>
    <button 
      className="notification-close" 
      onClick={() => onClose(notification._id)}
      aria-label="Close notification"
      title="Dismiss"
    >
      ×
    </button>
  </div>
);

// Main panel component - displays as list with mark as read buttons
export default function NotificationPanel({ 
  notifications = [], 
  onMarkAsRead,
  isDropdownMode = false  // true for dropdown, false for full page
}) {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(new Set());

  const handleClose = useCallback((id) => {
    setActiveNotifications(current => 
      current.filter(note => note._id !== id)
    );
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  }, [onMarkAsRead]);

  // Auto-remove notifications after 5 seconds (only for toast mode)
  useEffect(() => {
    if (isDropdownMode) return;
    
    const timers = activeNotifications.map(note => {
      return setTimeout(() => {
        handleClose(note._id);
      }, 5000); // 5 seconds
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [activeNotifications, handleClose, isDropdownMode]);

  // Process new notifications
  useEffect(() => {
    const newNotifications = notifications.filter(note => 
      !note.read && !seenIds.has(note._id)
    );

    if (newNotifications.length > 0 && !isDropdownMode) {
      // Add new notifications with staggered timing (toast mode only)
      newNotifications.forEach((notification, index) => {
        setTimeout(() => {
          setActiveNotifications(current => [...current, notification]);
          setSeenIds(current => {
            const updated = new Set(current);
            updated.add(notification._id);
            return updated;
          });
        }, index * 300); // Stagger each notification by 300ms
      });
    }
  }, [notifications, isDropdownMode]);

  // Toast mode (popup in corner)
  if (!isDropdownMode) {
    return (
      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 1100 }}>
        {activeNotifications.map((notification, index) => (
          <div 
            key={notification._id}
            style={{
              marginBottom: '10px',
              transform: `translateY(${index * 10}px)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <NotificationToast
              notification={notification}
              onClose={handleClose}
            />
          </div>
        ))}
      </div>
    );
  }

  // Dropdown/List mode
  return (
    <div className="notification-dropdown">
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <span>🔔</span>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <div 
              key={notification._id}
              className={`notification-list-item ${notification.read ? 'read' : 'unread'}`}
            >
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="notification-info">
                <div className="notification-title">
                  {notification.title || 'Notification'}
                </div>
                <div className="notification-text">
                  {notification.message.substring(0, 50)}
                  {notification.message.length > 50 ? '...' : ''}
                </div>
                <div className="notification-time">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </div>
              </div>
              {!notification.read && (
                <button
                  className="mark-read-btn"
                  onClick={() => onMarkAsRead && onMarkAsRead(notification._id)}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {notifications.length > 5 && (
        <div className="notification-footer">
          <a href="/notifications-student" className="view-more-link">
            View All Notifications →
          </a>
        </div>
      )}
    </div>
  );
}
