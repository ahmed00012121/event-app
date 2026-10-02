import React, { useState, useEffect } from "react";
import "../../assets/student/feedbackStudent.css";
import Nav from "../../components/nav";
import Footer from "../../components/footer";
import feedbackService from "../../services/feedbackService";
import eventService from "../../services/eventService";
import { useNavigate } from "react-router-dom";

export default function FeedbackStudent() {
  const [message, setMessage] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // success | error | warning
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatusType("error");
      setStatus("You must be logged in to submit feedback. Redirecting to login...");
      setTimeout(() => navigate("/login-student"), 1200);
      return;
    }

    const loadEvents = async () => {
      try {
        const data = await eventService.getAllEvents();
        setEvents(data || []);
      } catch (err) {
        console.warn("Could not load events for feedback selector:", err);
      }
    };
    loadEvents();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setStatusType("warning");
      setStatus("⚠️ Please enter feedback before submitting.");
      return;
    }

    // Check token before attempting submission
    const token = localStorage.getItem("token");
    if (!token) {
      setStatusType("error");
      setStatus("❌ Authentication required. Please log in again.");
      setTimeout(() => navigate("/login-student"), 1500);
      return;
    }

    // Helper: retry with exponential backoff
    const retryWithBackoff = async (fn, retries = 2) => {
      let lastError;
      for (let i = 0; i <= retries; i++) {
        try {
          const result = await fn();
          return result;
        } catch (err) {
          lastError = err;
          if (i === retries) break;
          
          // Update status to show retry attempt
          setStatus(`⏳ Connection issue. Retrying in ${Math.pow(2, i)} seconds...`);
          
          // Wait 2^i seconds before retry
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        }
      }
      throw lastError;
    };

    setStatusType("loading");
    setStatus("⏳ Submitting your feedback...");

    try {
      const payload = { message };
      if (eventId) payload.eventId = eventId;

      // Try submission with retries
      const res = await retryWithBackoff(async () => {
        const response = await feedbackService.submitFeedback(payload);
        if (!response || !response._id) {
          throw new Error('Invalid response format');
        }
        return response;
      });

      // Success!
      setStatusType("success");
      setStatus("✅ Feedback submitted successfully!");
      setMessage("");
      setEventId("");

      // auto-clear success after 3s
      setTimeout(() => {
        setStatus("");
        setStatusType("");
      }, 3000);

    } catch (err) {
      console.error("Feedback submission failed:", err);
      
      // Clear any retry messages immediately
      setStatusType("error");

      if (err.response?.data?.code === 'DB_UNAVAILABLE') {
        setStatus("🚫 Database connection issue. Please try again in a few minutes.");
      }
      else if (err.response?.status === 401) {
        setStatus("❌ Session expired. Please log in again.");
        setTimeout(() => navigate("/login-student"), 1500);
      }
      else if (err.response?.status === 404) {
        setStatus("❌ API endpoint not found. Please contact administrator.");
      }
      else if (err.response?.status === 503) {
        setStatus("🚫 Service temporarily unavailable. Please try again later.");
      }
      else if (!err.response || err.code === 'ECONNABORTED') {
        setStatus("🚫 Cannot reach server. Please check your connection.");
      }
      else if (err.response?.data?.message) {
        setStatus(`❌ ${err.response.data.message}`);
      }
      else {
        setStatus("❌ An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <Nav />

      <div className="feedback-container">
        <h2>Feedback</h2>

        <form onSubmit={handleSubmit} className="feedback-form">
          {events.length > 0 && (
            <label>
              Event (optional):
              <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">-- General feedback --</option>
                {events.map((ev) => (
                 <option key={ev._id} value={ev._id}>
  {ev.title}
</option>
                ))}
              </select>
            </label>
          )}

          <textarea
            placeholder="Write your feedback here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
          <button type="submit">Submit Feedback</button>
        </form>

        {/* ✅ Status Message (colored) */}
        {status && (
          <p
            className={`status-message ${
              statusType === "success"
                ? "status-success"
                : statusType === "error"
                ? "status-error"
                : "status-warning"
            }`}
          >
            {status}
          </p>
        )}
      </div>

      <Footer />
    </>
  );
}
