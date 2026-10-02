const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student' },
    // additional profile fields
    phone: { type: String },
    department: { type: String },
    year: { type: String },
    college: { type: String },
    avatar: { type: String },
    // Interest tracking for recommendations
    interests: [{ type: String }],
    tags: [{ type: String }],
    // Activity history
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    attendedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    // reset password fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
studentSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
