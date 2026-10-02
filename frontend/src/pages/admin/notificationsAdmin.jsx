// src/pages/admin/notificationsAdmin.jsx
import React, { useEffect, useState } from "react";
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import notificationService from "../../services/notificationService";
import manageUserService from "../../services/manageUserService";
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

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', message: '', type: 'info' });
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [updating, setUpdating] = useState(false);
  // Filters: all, broadcast, user
  const [filterType, setFilterType] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMap, setUserMap] = useState({}); // maps userId -> { name, email }

  // Fetch all notifications
  const [formData, setFormData] = useState({
    user: "",
    title: "",
    message: "",
    type: "info",
    target: "single", // single, all, category
    category: "", // for category-based sending
  });

  // Fetch all notifications
  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getAll();
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching admin notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await manageUserService.getAllUsers();
      const students = (data && data.students) || [];
      const map = {};
      students.forEach((s) => {
        map[s._id] = { name: s.name || s.email, email: s.email };
      });
      setUserMap(map);
    } catch (err) {
      console.error('Failed to fetch users for notifications:', err);
    }
  };

  const resolveUserLabel = (user) => {
    if (!user) return 'N/A';
    const uid = (typeof user === 'object') ? user._id : user;
    return userMap[uid]?.name || userMap[uid]?.email || String(uid).slice(0, 8);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update preview
    if (name === "title" || name === "message" || name === "type") {
      setPreview({
        title: name === "title" ? value : formData.title,
        message: name === "message" ? value : formData.message,
        type: name === "type" ? value : formData.type,
      });
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      setError("❌ Please fill in title and message");
      return;
    }

    if (formData.target === "single" && !formData.user) {
      setError("❌ Please enter a student ID (MongoDB ObjectId)");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
      };

      if (formData.target === "single") {
        payload.user = formData.user;
        console.log("📤 Sending notification to single student:", payload);
        
        const response = await notificationService.sendNotificationToUser(payload);
        console.log("✅ Single notification sent:", response);
        
        setSuccessMessage("✅ Notification successfully sent to student!");
        
        // Reset form
        setFormData({
          user: "",
          title: "",
          message: "",
          type: "info",
          target: "single",
          category: "",
        });
        setPreview(null);
        setShowForm(false);

        // Refresh notifications after 1 second
        setTimeout(() => {
          fetchNotifications();
          setSuccessMessage(null);
        }, 1000);
      } else if (formData.target === "all") {
        console.log("📢 Broadcasting to all students...");
        
        const response = await notificationService.broadcastNotification({
          title: formData.title,
          message: formData.message,
          type: formData.type,
        });
        
        console.log(`✅ Broadcast response:`, response);
        setSuccessMessage(`✅ Broadcast successfully sent to ${response.count} students!`);
        
        // Reset form
        setFormData({
          user: "",
          title: "",
          message: "",
          type: "info",
          target: "single",
          category: "",
        });
        setPreview(null);
        setShowForm(false);
        
        // Refresh notifications after 1 second
        setTimeout(() => {
          fetchNotifications();
          setSuccessMessage(null);
        }, 1000);
      } else if (formData.target === "category") {
        setError("📂 Category targeting coming soon");
      }
    } catch (err) {
      console.error("❌ Error sending notification:", err);
      console.error("Response data:", err.response?.data);
      
      let errorMessage = "Failed to send notification: ";
      if (err.response?.status === 401) {
        errorMessage += "Not authenticated. Please login as admin.";
      } else if (err.response?.status === 403) {
        errorMessage += "Permission denied. Admin access required.";
      } else if (err.response?.status === 400) {
        errorMessage += `${err.response.data?.message || "Check student ID format or try again"}`;
      } else if (err.response?.status === 404) {
        errorMessage += "Student not found. Check the student ID.";
      } else if (err.response?.status === 500) {
        errorMessage += "Server error. Please check the backend logs.";
      } else {
        errorMessage += err.message || "Unknown error";
      }
      
      setError(`❌ ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      setError(null);
      await notificationService.deleteNotification(notificationId);
      setSuccessMessage("✅ Notification deleted successfully!");
      
      setTimeout(() => {
        fetchNotifications();
        setSuccessMessage(null);
      }, 1000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(`❌ Failed to delete notification: ${err.response?.data?.message || err.message}`);
    }
  };

  // Filter / thread handlers
  const handleFilterChange = (type) => {
    setFilterType(type);
    setSelectedUser(null);
  };

  const handleSelectUser = (user) => {
    setFilterType("user");
    setSelectedUser(user);
  };

  const handleShowUserThread = (user) => {
    if (!user) return;
    setFilterType("user");
    setSelectedUser(user);
  };

  const handleEditNotification = (notification) => {
    setEditingId(notification._id);
    setEditData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
  };

  const handleUpdateNotification = async (e) => {
    e.preventDefault();

    if (!editData.title || !editData.message) {
      setError("❌ Please fill in title and message");
      return;
    }

    try {
      setError(null);
      await notificationService.updateNotification(editingId, editData);
      setSuccessMessage("✅ Notification updated successfully!");
      setEditingId(null);
      setEditData({ title: '', message: '', type: 'info' });
      
      setTimeout(() => {
        fetchNotifications();
        setSuccessMessage(null);
      }, 1000);
    } catch (err) {
      console.error("Update error:", err);
      setError(`❌ Failed to update notification: ${err.response?.data?.message || err.message}`);
    }
  };

  // Edit modal handlers
  const handleEditClick = (notification) => {
    setEditingNotification({
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingNotification.title || !editingNotification.message) {
      setError("❌ Please fill in all fields");
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      await notificationService.updateNotification(
        editingNotification._id,
        {
          title: editingNotification.title,
          message: editingNotification.message,
          type: editingNotification.type,
          read: editingNotification.read,
        }
      );

      setSuccessMessage("✅ Notification updated successfully!");
      setShowEditModal(false);
      setEditingNotification(null);

      setTimeout(() => {
        fetchNotifications();
        setSuccessMessage(null);
      }, 1000);
    } catch (err) {
      console.error("Update error:", err);
      setError(
        `❌ Failed to update notification: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* 🔝 Admin Navbar */}
      <NavAdmin />

      <div className="notifications-container">
        <div className="notifications-header">
          <h1 className="notifications-title">📢 Notifications Management</h1>
          <button
            className="mark-all-read-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "➕ Send Notification"}
          </button>
        </div>

        {/* Send Notification Form */}
        {showForm && (
          <div className="notification-form-section">
            <h2>📝 Send New Notification</h2>

            <form onSubmit={handleSendNotification} className="notification-form">
              <div className="form-group">
                <label>Target Type</label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                >
                  <option value="single">Single Student</option>
                  <option value="all">All Students</option>
                  <option value="category">By Category (coming soon)</option>
                </select>
              </div>

              {formData.target === "single" && (
                <div className="form-group">
                  <label>Student ID / Email</label>
                  <input
                    type="text"
                    name="user"
                    value={formData.user}
                    onChange={handleInputChange}
                    placeholder="Enter MongoDB ObjectId (24 hex characters) or student email"
                    required
                  />
                  <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                    📝 Hint: MongoDB ID looks like: 5f1a2b3c4d5e6f7g8h9i0j1k
                  </small>
                </div>
              )}

              {formData.target === "category" && (
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select category</option>
                    <option value="event">Event Related</option>
                    <option value="registration">Registration Updates</option>
                    <option value="system">System Updates</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Notification Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="event">🎉 Event</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="reminder">⏰ Reminder</option>
                  <option value="system">⚙️ System</option>
                  <option value="update">📢 Update</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notification title"
                  maxLength="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Notification message (max 500 characters)"
                  maxLength="500"
                  rows="4"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={sending}
              >
                {sending ? "Sending..." : "✉️ Send Notification"}
              </button>
            </form>

            {/* Preview */}
            {preview && (
              <div className="notification-preview">
                <h3>📋 Preview</h3>
                <div className={`preview-item ${preview.type}`}>
                  <span className="preview-icon">
                    {getNotificationIcon(preview.type)}
                  </span>
                  <div className="preview-content">
                    <div className="preview-title">{preview.title}</div>
                    <div className="preview-message">{preview.message}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message" style={{ borderColor: '#ef4444', backgroundColor: '#fee2e2' }}>
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {successMessage && (
          <div className="error-message" style={{ borderColor: '#22c55e', backgroundColor: '#dcfce7', color: '#166534' }}>
            {successMessage}
            <button onClick={() => setSuccessMessage(null)} style={{ backgroundColor: '#22c55e' }}>Dismiss</button>
          </div>
        )}

        {/* Notifications List */}
        <div className="notification-form-section">
          {/* Filters bar */}
          <div className="notification-filters" style={{ marginBottom: '1rem', alignItems: 'center' }}>
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Notifications ({notifications.length})
            </button>

            <button
              className={`filter-btn ${filterType === 'broadcast' ? 'active' : ''}`}
              onClick={() => handleFilterChange('broadcast')}
              title="Show broadcast / all-students notifications"
            >
              Broadcasts ({notifications.filter(n => !n.user).length})
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: 'auto' }}>
              {/* derived user list */}
              {Array.from(new Set(notifications.map(n => {
                const u = n.user;
                return u && typeof u === 'object' ? u._id : u;
              }).filter(Boolean))).slice(0, 40).map((userId) => {
                const count = notifications.filter(n => String(n.user && (typeof n.user === 'object' ? n.user._id : n.user)) === String(userId)).length;
                const label = userMap[userId]?.name || userMap[userId]?.email || String(userId).slice(0, 8);
                return (
                  <button
                    key={userId}
                    className={`filter-btn ${filterType === 'user' && selectedUser === userId ? 'active' : ''}`}
                    onClick={() => handleSelectUser(userId)}
                    title={`Show notifications for ${label}`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <h2>
            {filterType === 'all' && `📬 All Notifications (${notifications.length})`}
            {filterType === 'broadcast' && `📢 Broadcasts (${notifications.filter(n => !n.user).length})`}
            {filterType === 'user' && selectedUser && `👤 Notifications to ${userMap[selectedUser]?.name || String(selectedUser).slice(0,8)} (${notifications.filter(n => String(n.user && (typeof n.user === 'object' ? n.user._id : n.user)) === String(selectedUser)).length})`}
          </h2>

          {loading ? (
            <p className="loading-text">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="no-notifications">No notifications sent yet.</p>
          ) : (
            <div className="notifications-list">
              {(
                // compute filtered list
                (() => {
                  if (filterType === 'broadcast') return notifications.filter(n => !n.user);
                  if (filterType === 'user' && selectedUser) return notifications.filter(n => String(n.user && (typeof n.user === 'object' ? n.user._id : n.user)) === String(selectedUser));
                  return notifications;
                })()
              ).map((notification) => (
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
                    <div className="notification-title-full" onClick={() => handleShowUserThread(notification.user && (typeof notification.user === 'object' ? notification.user._id : notification.user))} style={{ cursor: notification.user ? 'pointer' : 'default' }}>
                      {notification.title}
                      <span className="notification-type">
                        {notification.type}
                      </span>
                    </div>
                    <p className="notification-message-full">
                      {notification.message}
                    </p>
                    <div className="notification-meta">
                      <span className="notification-user">
                        User: {resolveUserLabel(notification.user)}
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

                  <div className="notification-status">
                    {notification.read ? (
                      <span className="status-read">✓ Read</span>
                    ) : (
                      <span className="status-unread">⚫ Unread</span>
                    )}
                  </div>

                  <div className="notification-actions">
                    <button
                      onClick={() => handleEditClick(notification)}
                      className="btn-edit-small"
                      title="Edit notification"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="btn-delete-small"
                      title="Delete notification"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔻 Edit Notification Modal */}
      {showEditModal && editingNotification && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Notification</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={editingNotification.title}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      title: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={editingNotification.message}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      message: e.target.value,
                    })
                  }
                  className="textarea-field"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Type:</label>
                <select
                  value={editingNotification.type}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      type: e.target.value,
                    })
                  }
                  className="select-field"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✓ Success</option>
                  <option value="error">✕ Error</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingNotification.read}
                    onChange={(e) =>
                      setEditingNotification({
                        ...editingNotification,
                        read: e.target.checked,
                      })
                    }
                  />
                  Mark as read
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-save"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔻 Footer */}
      <Footer />
    </>
  );
}
