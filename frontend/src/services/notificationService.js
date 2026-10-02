import api from './api';

const STORAGE_KEY = 'local_notifications_v1';

const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to read local notifications:', e);
    return [];
  }
};

const writeLocal = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to write local notifications:', e);
  }
};

const notificationService = {
  // Get notifications with fallback to localStorage when backend is unreachable
  getNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      // Save a local copy for offline use
      writeLocal(res.data || []);
      return res.data;
    } catch (err) {
      console.warn('Notification GET failed, using local cache:', err.message || err);
      return readLocal();
    }
  },

  // Mark a single notification as read; if offline, update local cache
  markAsRead: async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      // Update local cache to keep in sync
      const list = readLocal().map(n => n._id === id ? { ...n, read: true } : n);
      writeLocal(list);
      return res.data;
    } catch (err) {
      console.warn('markAsRead failed; updating local cache:', err.message || err);
      const list = readLocal();
      const idx = list.findIndex(n => n._id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], read: true };
        writeLocal(list);
        return list[idx];
      }
      // If not found locally, create a minimal local record so UI can reflect change
      const fake = { _id: id, title: 'Notification', message: '', read: true, createdAt: new Date().toISOString() };
      list.unshift(fake);
      writeLocal(list);
      return fake;
    }
  },

  // Mark all notifications as read; if offline, update local cache
  markAllAsRead: async () => {
    try {
      const res = await api.put('/notifications/mark-all-read');
      // Update local cache
      const list = readLocal().map(n => ({ ...n, read: true }));
      writeLocal(list);
      return res.data;
    } catch (err) {
      console.warn('markAllAsRead failed; updating local cache:', err.message || err);
      const list = readLocal().map(n => ({ ...n, read: true }));
      writeLocal(list);
      return { modifiedCount: list.length };
    }
  },

  // Send notification to specific user(s) - Admin only
  sendNotificationToUser: async (payload) => {
    try {
      const res = await api.post('/notifications', payload);
      // add to local cache
      const list = readLocal();
      list.unshift(res.data);
      writeLocal(list);
      return res.data;
    } catch (err) {
      console.warn('send notification failed:', err.message || err);
      throw err;
    }
  },

  // Send notification to multiple users
  sendNotificationToMultipleUsers: async (userIds, notificationData) => {
    try {
      const promises = userIds.map((userId) =>
        api.post('/notifications', {
          ...notificationData,
          user: userId,
        })
      );
      const results = await Promise.all(promises);
      // Update local cache
      const newNotifications = results.map((r) => r.data);
      const list = readLocal();
      newNotifications.forEach((notif) => {
        const existing = list.findIndex((n) => n._id === notif._id);
        if (existing === -1) {
          list.unshift(notif);
        }
      });
      writeLocal(list);
      return newNotifications;
    } catch (err) {
      console.warn('sendNotificationToMultipleUsers failed:', err.message || err);
      throw err;
    }
  },

  // Broadcast notification to all students
  broadcastNotification: async (payload) => {
    try {
      console.log('📢 Sending broadcast with payload:', payload);
      const res = await api.post('/notifications/broadcast/all', payload);
      console.log(`✅ Broadcast sent to ${res.data.count} students`);
      
      // Update local cache with new notifications
      const list = readLocal();
      if (res.data.notifications && Array.isArray(res.data.notifications)) {
        res.data.notifications.forEach((notif) => {
          const existing = list.findIndex((n) => n._id === notif._id);
          if (existing === -1) {
            list.unshift(notif);
          }
        });
        writeLocal(list);
      }
      
      return res.data;
    } catch (err) {
      console.error('Broadcast failed:', err.message || err);
      throw err;
    }
  },

  // Backwards-compatible helpers (optional)
  getAll: async () => notificationService.getNotifications(),
  create: async (payload) => {
    try {
      const res = await api.post('/notifications', payload);
      // add to local cache
      const list = readLocal();
      list.unshift(res.data);
      writeLocal(list);
      return res.data;
    } catch (err) {
      console.warn('create notification failed; saving locally:', err.message || err);
      const list = readLocal();
      const fake = { ...payload, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      list.unshift(fake);
      writeLocal(list);
      return fake;
    }
  },
  delete: async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      const list = readLocal().filter(n => n._id !== id);
      writeLocal(list);
      return res.data;
    } catch (err) {
      console.warn('delete failed; removing from local cache if present:', err.message || err);
      const list = readLocal().filter(n => n._id !== id);
      writeLocal(list);
      return { removedLocal: true };
    }
  },

  // Get unread count for badge
  getUnreadCount: async () => {
    try {
      const notifications = await notificationService.getNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch (err) {
      console.warn('getUnreadCount failed:', err.message || err);
      const list = readLocal();
      return list.filter((n) => !n.read).length;
    }
  },

  // Get unread notifications only
  getUnreadNotifications: async () => {
    try {
      const notifications = await notificationService.getNotifications();
      return notifications.filter((n) => !n.read);
    } catch (err) {
      console.warn('getUnreadNotifications failed:', err.message || err);
      const list = readLocal();
      return list.filter((n) => !n.read);
    }
  },

  // Filter by type
  filterByType: (notifications, type) => {
    return notifications.filter((n) => n.type === type);
  },

  // Delete a notification (admin only)
  deleteNotification: async (id) => {
    try {
      console.log('🗑️ Deleting notification:', id);
      const res = await api.delete(`/notifications/${id}`);
      
      // Remove from local cache
      const list = readLocal().filter(n => n._id !== id);
      writeLocal(list);
      
      console.log('✅ Notification deleted');
      return res.data;
    } catch (err) {
      console.error('Delete failed:', err.message || err);
      throw err;
    }
  },

  // Update a notification (admin only)
  updateNotification: async (id, payload) => {
    try {
      console.log('✏️ Updating notification:', id, payload);
      const res = await api.put(`/notifications/${id}`, payload);
      
      // Update local cache
      const list = readLocal();
      const idx = list.findIndex(n => n._id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...res.data };
        writeLocal(list);
      }
      
      console.log('✅ Notification updated');
      return res.data;
    } catch (err) {
      console.error('Update failed:', err.message || err);
      throw err;
    }
  },
};

export default notificationService;
