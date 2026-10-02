// backend/controllers/notification.js
const Notification = require('../models/notification');

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    // If user is authenticated and not an admin, return only their notifications
    if (req.user && req.user.role && req.user.role === 'student') {
      const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.json(notifications);
    }

    // Admin or unauthenticated (rare) - return all notifications
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new notification (admin creates notifications for users)
const createNotification = async (req, res) => {
  try {
    const payload = { ...req.body };
    // If no user provided, and requester is a student, attach their id
    if (!payload.user && req.user && req.user.role === 'student') {
      payload.user = req.user._id;
    }

    const newNotif = new Notification(payload);
    await newNotif.save();
    res.status(201).json(newNotif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    // If requester is a student, ensure they only mark their own notifications
    if (req.user && req.user.role === 'student') {
      if (!notif.user || notif.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: cannot modify this notification' });
      }
    }

    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all notifications as read (optionally scoped to a user in future)
const markAllAsRead = async (req, res) => {
  try {
    let filter = { read: false };
    // If student, scope to their notifications only
    if (req.user && req.user.role === 'student') {
      filter.user = req.user._id;
    }

    const result = await Notification.updateMany(filter, { read: true });
    const modified = result.modifiedCount ?? result.nModified ?? 0;
    res.json({ modifiedCount: modified });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Broadcast notification to all students
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Title is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: 'Message is required',
      });
    }

    // Get all students
    const Student = require('../models/student');
    const students = await Student.find({}, '_id').lean();

    if (!students || students.length === 0) {
      return res.status(400).json({
        message: 'No students found to send broadcast to',
      });
    }

    // Prepare notifications array with defaults
    const notificationsToInsert = students.map((student) => ({
      user: student._id,
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      read: false,
    }));

    // Create notification for each student using insertMany
    const notifications = await Notification.insertMany(notificationsToInsert, { ordered: false });

    console.log(`📢 Broadcast sent to ${notifications.length} students`);

    res.status(201).json({
      message: `Broadcast sent to ${notifications.length} students`,
      count: notifications.length,
      success: true,
    });
  } catch (err) {
    console.error('❌ Broadcast error:', err.message);
    res.status(500).json({ message: 'Failed to send broadcast: ' + err.message });
  }
};

// Delete a notification (admin only)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log(`🗑️ Notification deleted: ${id}`);
    res.json({ message: 'Notification deleted successfully', id });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete notification: ' + err.message });
  }
};

// Update a notification (admin only)
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;

    // Validate input
    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required',
      });
    }

    const updateData = {
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
    };

    const notification = await Notification.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log(`✏️ Notification updated: ${id}`);
    res.json({ message: 'Notification updated successfully', notification });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ message: 'Failed to update notification: ' + err.message });
  }
};

module.exports = { getNotifications, createNotification, markAsRead, markAllAsRead, broadcastNotification, deleteNotification, updateNotification };
