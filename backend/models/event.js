const mongoose = require('mongoose');

// Event schema using exact field names requested by the UI
const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Event title is required'], trim: true },
  description: { type: String, required: [true, 'Event description is required'], trim: true },
  category: { type: String, required: [true, 'Event category is required'], trim: true },
  startDateTime: { type: Date, required: [true, 'Start date/time is required'] },
  endDateTime: { type: Date, required: [true, 'End date/time is required'] },
  eventMode: { type: String, required: [true, 'Event mode is required'], enum: ['Online', 'Offline', 'Hybrid'] },
  venueOrLink: { type: String, required: [true, 'Venue or meeting link is required'], trim: true },
  contactEmail: { type: String, required: [true, 'Contact email is required'], trim: true },
  contactPhone: { type: String, required: [true, 'Contact phone is required'], trim: true },
  maxParticipants: { type: Number, required: [true, 'Max participants is required'], min: [1, 'Must allow at least 1 participant'] },
  eventBanner: { type: String, required: false }, // optional
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming' },
  visibility: { type: String, enum: ['Public', 'Private'], default: 'Public' },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reg' }],
  tags: [{ type: String }],
  popularity: { type: Number, default: 0 }
}, { timestamps: true });

// Validate that endDateTime is after startDateTime
eventSchema.pre('validate', function(next) {
  if (this.startDateTime && this.endDateTime && this.endDateTime < this.startDateTime) {
    this.invalidate('endDateTime', 'End date/time must be after start date/time');
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;