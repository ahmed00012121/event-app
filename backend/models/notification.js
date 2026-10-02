const mongoose = require('mongoose');

/**
 * Notification schema designed to persist notification history.
 * - user: reference to the Student (or Admin) who is target of the notification
 * - title/message: human-facing content
 * - type: optional categorization (info, warning, event, system, etc.)
 * - event: optional ref to an Event document when notification relates to an event
 * - meta: free-form object for extra structured data (links, ids)
 * - read/archived: state flags
 * - timestamps: createdAt/updatedAt maintained by mongoose
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // could be Admin in some cases; keep as ref for lookups
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Notification',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'event', 'system', 'reminder', 'other'],
      default: 'info',
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch a user's recent notifications
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
