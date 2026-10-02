const mongoose = require("mongoose");
const crypto = require("crypto");

const regSchema = new mongoose.Schema({
    // Event for which the student has registered
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },

    // Student who registered for the event
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    // Current registration status
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "attended", "cancelled"],
        default: "pending"
    },

    // Reason provided when a registration is rejected
    rejectionReason: {
        type: String
    },

    // Date and time when the registration was created
    registeredAt: {
        type: Date,
        default: Date.now
    },

    // Attendance verification information
    attendanceConfirmed: {
        type: Boolean,
        default: false
    },

    studentVerified: {
        type: Boolean,
        default: false
    },

    // Reference to feedback submitted for this registration
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback"
    },

    // Unique code used to identify the student's attendance/ticket
    // `unique: true` already creates the required MongoDB unique index
    attendanceCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(8).toString("hex")
    },

    // Time when the student checked into the event
    checkedInAt: {
        type: Date
    },

    // Ticket information issued to the registered student
    ticket: {
        number: {
            type: String
        },
        seat: {
            type: String
        },
        issuedAt: {
            type: Date
        },
        qr: {
            type: String
        },
        emailed: {
            type: Boolean,
            default: false
        }
    }

}, { timestamps: true });
module.exports = mongoose.model("Reg", regSchema);