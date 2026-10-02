import React, { useState } from 'react';
import eventService from '../../services/eventService';
import NavAdmin from '../../components/navAdmin';
import NotificationPanel from '../../components/notificationPanel';
import ChatbotWidget from '../../components/chatbotWidget';
import '../../assets/admin/addEvent.css';

export default function AddEvent() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    startDateTime: '',
    endDateTime: '',
    eventMode: 'Online',
    venueOrLink: '',
    contactEmail: '',
    contactPhone: '',
    maxParticipants: '',
    eventBanner: null,
    status: 'Upcoming',
    visibility: 'Public',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        const val = form[key];
        if (val !== null && val !== '') {
          formData.append(key, val);
        }
      });

      await eventService.createEvent(formData);
      setMessage({ type: 'success', text: '✅ Event created successfully!' });
      setForm({
        title: '',
        description: '',
        category: '',
        startDateTime: '',
        endDateTime: '',
        eventMode: 'Online',
        venueOrLink: '',
        contactEmail: '',
        contactPhone: '',
        maxParticipants: '',
        eventBanner: null,
        status: 'Upcoming',
        visibility: 'Public',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err?.response?.data?.error ||
          '❌ Failed to create event. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-event-root">
      <NavAdmin />

      {/* Fixed Notification Panel */}
      <NotificationPanel />

      <div className="add-event-page">
        <div className="add-event glass-card">
          <h2 className="page-title">🎉 Create New Event</h2>
          <p className="page-subtitle">Fill in the details to create an event</p>

          <form className="add-event-form" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Event Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="field full">
              <label>Description</label>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                placeholder="Briefly describe your event"
                required
              />
            </div>

            <div className="field">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Conference">Conference</option>
                <option value="Webinar">Webinar</option>
                <option value="Meetup">Meetup</option>
                <option value="Competition">Competition</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="field">
              <label>Event Mode</label>
              <select
                name="eventMode"
                value={form.eventMode}
                onChange={handleChange}
                required
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="field">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={form.startDateTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={form.endDateTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field full">
              <label>Venue / Link</label>
              <input
                type="text"
                name="venueOrLink"
                value={form.venueOrLink}
                onChange={handleChange}
                placeholder={
                  form.eventMode === 'Online'
                    ? 'Enter meeting link'
                    : 'Enter venue address'
                }
                required
              />
            </div>

            <div className="field">
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Max Participants</label>
              <input
                type="number"
                name="maxParticipants"
                min="1"
                value={form.maxParticipants}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Event Banner (optional)</label>
              <input
                type="file"
                name="eventBanner"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="field">
              <label>Visibility</label>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>

            {message.text && (
              <div
                className={
                  message.type === 'error'
                    ? 'error-message'
                    : 'success-message'
                }
              >
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
}
