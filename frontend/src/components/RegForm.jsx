import { useState, useEffect } from "react";
import regService from "../services/regService";
import eventService from "../services/eventService";
import "../assets/shared/components.css";

export default function RegForm({ onRegistrationSuccess }) {
  const [studentId, setStudentId] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [attendanceCode, setAttendanceCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load logged-in student from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?._id) setStudentId(user._id);
    } catch {}

    // Fetch available events
    const fetchEvents = async () => {
      try {
        const list = await eventService.getAllEvents();
        setEvents(list || []);
      } catch (err) {
        console.error("Event load error:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setAttendanceCode("");
    setLoading(true);

    if (!eventId) {
      setMessage("⚠️ Please select an event.");
      setLoading(false);
      return;
    }

    try {
      const res = await regService.registerEvent(eventId);

      // Save attendance code from backend (res is the registration object)
      setAttendanceCode(res.attendanceCode || res.ticket?.number || "");
      setMessage("✅ Registration successful! Your ticket will show in your dashboard.");

      if (onRegistrationSuccess) onRegistrationSuccess();
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.message || "⚠️ Registration failed. Please try again.";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-container">
      <h3>Register for an Event</h3>

      <form className="reg-form" onSubmit={handleSubmit}>
        <label>Student ID:</label>
        <input type="text" value={studentId} disabled />

        <label>Select Event:</label>
        <select value={eventId} required onChange={(e) => setEventId(e.target.value)}>
          <option value="">-- Choose an event --</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} — {new Date(ev.date).toLocaleDateString()}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {message && <p className="reg-message">{message}</p>}

      {attendanceCode && (
        <div className="attendance-code-box">
          <strong>Attendance Code:</strong> {attendanceCode}
          <p className="pass-note">Use this code to enter the event.</p>

          {/* Simple QR-ish box (no external lib) */}
          <div className="qr-box" style={{ marginTop: 8, padding: 12, border: '1px dashed #444', display: 'inline-block' }}>
            <div style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{attendanceCode}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Ticket ID</div>
          </div>
        </div>
      )}
    </div>
  );
}
