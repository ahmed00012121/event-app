const Student = require('../models/student');
const Admin = require('../models/admin');
const crypto = require('crypto');
const { sendMail } = require('../utils/mail');

// ✅ Get all users (students + admins)
const getAllUsers = async (req, res) => {
  try {
    const students = await Student.find({}, 'name email department'); // select fields
    const admins = await Admin.find({}, 'name email role');

    res.json({ students, admins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// ✅ Delete user by ID and type
const deleteUser = async (req, res) => {
  const { id, type } = req.params; // type = 'student' or 'admin'
  try {
    if (type === 'student') {
      await Student.findByIdAndDelete(id);
    } else if (type === 'admin') {
      await Admin.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }
    res.json({ message: `${type} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Admin: send reset link to a student by id
const adminSendReset = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const token = crypto.randomBytes(20).toString('hex');
    student.resetPasswordToken = token;
    student.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await student.save();

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${CLIENT_URL}/reset-password/${token}`;
    const subject = 'Admin-Initiated Password Reset';
    const html = `<p>An admin has requested a password reset for your account. Click below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

    await sendMail(student.email, subject, `Reset your password: ${resetUrl}`, html);

    res.json({ message: 'Reset email sent successfully' });
  } catch (err) {
    console.error('[MANAGEUSER] adminSendReset error', err.message || err);
    return res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// Admin: directly set a student's password
const adminSetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.password = password; // will be hashed by model pre-save
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[MANAGEUSER] adminSetPassword error', err.message || err);
    return res.status(500).json({ message: 'Failed to update password' });
  }
};

module.exports = { getAllUsers, deleteUser, adminSendReset, adminSetPassword };
