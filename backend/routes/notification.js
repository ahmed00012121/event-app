// backend/routes/notification.js
const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAsRead, markAllAsRead, broadcastNotification, deleteNotification, updateNotification } = require('../controllers/notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Get notifications: student -> their notifications; admin -> all
router.get('/', protect, getNotifications);

// Create a new notification (admin only)
router.post('/', protect, authorize('admin'), createNotification);

// Broadcast notification to all students (admin only)
router.post('/broadcast/all', protect, authorize('admin'), broadcastNotification);

// Update a notification (admin only)
router.put('/:id', protect, authorize('admin'), updateNotification);

// Delete a notification (admin only)
router.delete('/:id', protect, authorize('admin'), deleteNotification);

// Mark a single notification as read
router.put('/:id/read', protect, markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', protect, markAllAsRead);

module.exports = router;
