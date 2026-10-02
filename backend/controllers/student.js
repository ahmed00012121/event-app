const Student = require('../models/student');
const { generateToken } = require('../utils/auth');
const crypto = require('crypto');
const { sendMail } = require('../utils/mail');

// helper to build client reset link
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Signup student
const signupStudent = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existing = await Student.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const student = await Student.create({ name, email, password });
        const token = generateToken(student);

        res.status(201).json({ token, user: { id: student._id, name, email, role: student.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Student login
const loginStudent = async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await Student.findOne({ email });
        if (!student || !(await student.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(student);
        res.json({ token, user: { id: student._id, name: student.name, email: student.email, role: student.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

 

// Request password reset - send email with token
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const student = await Student.findOne({ email });
        if (!student) {
            // To avoid account enumeration, respond with success message
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // generate token
        const token = crypto.randomBytes(20).toString('hex');
        student.resetPasswordToken = token;
        student.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await student.save();

        const resetUrl = `${CLIENT_URL}/reset-password/${token}`;
        const subject = 'Password Reset Request';
        const html = `<p>You requested a password reset. Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

        await sendMail(student.email, subject, `Reset your password: ${resetUrl}`, html);

        return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('requestPasswordReset error', err);
        return res.status(500).json({ message: 'Failed to process password reset' });
    }
};

// Perform password reset
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const student = await Student.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!student) return res.status(400).json({ message: 'Invalid or expired token' });

        student.password = password;
        student.resetPasswordToken = undefined;
        student.resetPasswordExpires = undefined;
        await student.save();

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('resetPassword error', err);
        return res.status(500).json({ message: 'Failed to reset password' });
    }
};

module.exports = { signupStudent, loginStudent, requestPasswordReset, resetPassword };
