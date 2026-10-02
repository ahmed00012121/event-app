import React, { useState, useEffect } from "react";
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import eventService from "../../services/eventService";
import EventCard from "../../components/eventCard";
import NotificationPanel from "../../components/notificationPanel";
import ChatbotWidget from "../../components/chatbotWidget";
import "../../assets/admin/manageEvents.css";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);

  // Store the temporary changes made while editing an event.
  const [editData, setEditData] = useState({});

  // Fetch events when the component loads.
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      setMessage("Failed to load events.");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an event.
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventService.deleteEvent(id);

      setEvents(events.filter((event) => event._id !== id));
      setMessage("Event deleted successfully.");
    } catch (err) {
      setMessage("Failed to delete event.");
      console.error("Error deleting event:", err);
    }
  };

  // Start editing an event.
  // Only the editable event fields are copied.
  // registrations are intentionally NOT included.
  const startEditing = (event) => {
    setEditingEvent(event._id);

    setEditData({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "",
      startDateTime: event.startDateTime
        ? event.startDateTime.slice(0, 16)
        : "",
      endDateTime: event.endDateTime
        ? event.endDateTime.slice(0, 16)
        : "",
      eventMode: event.eventMode || "Online",
      venueOrLink: event.venueOrLink || "",
      maxParticipants: event.maxParticipants || "",
      status: event.status || "Upcoming",
    });
  };

  // Update only the local edit form.
  // This does NOT call the backend.
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: name === "maxParticipants" ? parseInt(value, 10) || "" : value,
    }));
  };

  // Save the edited event to the backend.
  const handleUpdate = async (id) => {
    try {
      // Create FormData because the backend supports multipart form data.
      const formData = new FormData();

      // Add only the fields that can actually be edited.
      Object.keys(editData).forEach((key) => {
        const value = editData[key];

        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      // Send the update only when Save Changes is clicked.
      const updated = await eventService.updateEvent(id, formData);

      // Replace the updated event in the current list.
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event._id === id ? updated : event
        )
      );

      // Close the edit form.
      setEditingEvent(null);
      setEditData({});

      setMessage("✅ Event updated successfully!");
    } catch (err) {
      setMessage(
        "❌ Failed to update event: " +
          (err.response?.data?.error || err.message)
      );

      console.error("Error updating event:", err);
    }
  };

  // Cancel editing without saving changes.
  const cancelEditing = () => {
    setEditingEvent(null);
    setEditData({});
  };

  // Format event date/time for display.
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);

      if (isNaN(date)) return "Date not set";

      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Date not set";
    }
  };

  // Return the CSS class based on the event status.
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "status-upcoming";
      case "ongoing":
        return "status-ongoing";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-upcoming";
    }
  };

  return (
    <>
      <NavAdmin />
      <NotificationPanel />

      <div className="manage-events">
        <h2>Manage Events</h2>
        <p>View, edit, and manage all your events in one place.</p>

        {loading ? (
          <div className="loading">
            <div className="loader"></div>
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="no-events">
            <p>No events found. Start by creating a new event!</p>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div key={event._id} className="event-item">
                {editingEvent === event._id ? (
                  <div className="edit-form">

                    {/* Event title */}
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        value={editData.title}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* Event description */}
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        value={editData.description}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* Event category */}
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        className="form-control"
                        value={editData.category}
                        onChange={handleEditChange}
                      >
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

                    {/* Start date and time */}
                    <div className="form-group">
                      <label>Start Date & Time</label>
                      <input
                        type="datetime-local"
                        name="startDateTime"
                        className="form-control"
                        value={editData.startDateTime}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* End date and time */}
                    <div className="form-group">
                      <label>End Date & Time</label>
                      <input
                        type="datetime-local"
                        name="endDateTime"
                        className="form-control"
                        value={editData.endDateTime}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* Event mode */}
                    <div className="form-group">
                      <label>Event Mode</label>
                      <select
                        name="eventMode"
                        className="form-control"
                        value={editData.eventMode}
                        onChange={handleEditChange}
                      >
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    {/* Venue or meeting link */}
                    <div className="form-group">
                      <label>Venue / Link</label>
                      <input
                        type="text"
                        name="venueOrLink"
                        className="form-control"
                        value={editData.venueOrLink}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* Maximum participants */}
                    <div className="form-group">
                      <label>Max Participants</label>
                      <input
                        type="number"
                        name="maxParticipants"
                        className="form-control"
                        min="1"
                        value={editData.maxParticipants}
                        onChange={handleEditChange}
                      />
                    </div>

                    {/* Event status */}
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        className="form-control"
                        value={editData.status}
                        onChange={handleEditChange}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Save and cancel buttons */}
                    <div className="form-actions">
                      <button
                        className="btn btn-save"
                        onClick={() => handleUpdate(event._id)}
                      >
                        Save Changes
                      </button>

                      <button
                        className="btn btn-cancel"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <EventCard
                      event={{
                        ...event,
                        startDate: formatDate(event.startDateTime),
                        endDate: formatDate(event.endDateTime),
                        location: event.venueOrLink,
                        mode: event.eventMode,
                        statusClass: getStatusClass(event.status),
                      }}
                      isAdmin={true}
                    />

                    <div className="event-actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => startEditing(event)}
                      >
                        <span className="icon">✏️</span>
                        <span>Edit</span>
                      </button>

                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(event._id)}
                      >
                        <span className="icon">🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {message && <div className="status-message">{message}</div>}
      </div>

      <ChatbotWidget />
      <Footer />
    </>
  );
}

