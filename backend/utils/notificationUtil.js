// backend/utils/notificationUtil.js
// Minimal helper to send/store notifications — extend later to send emails or push
const Notification = require("../models/notification");

async function sendNotification(userId, { title, message, type = "info" }) {
  // Store in DB
  const note = new Notification({ userId, title, message, type });
  await note.save();

  // TODO: integrate email / push / websocket here
  console.log("Notification saved:", note._id);
  return note;
}

module.exports = { sendNotification };
