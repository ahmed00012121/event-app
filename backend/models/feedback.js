const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    // event is optional (feedback can be general)
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false },
    message: { type: String, required: true },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
