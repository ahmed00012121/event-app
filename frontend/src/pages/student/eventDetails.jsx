// src/pages/student/eventDetails.jsx
import eventService from "../../services/eventService";
import regService from "../../services/regService";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Nav from "../../components/nav";
import Footer from "../../components/footer";
import EventCard from "../../components/eventCard";
import ChatbotWidget from "../../components/chatbotWidget";
import NotificationPanel from "../../components/notificationPanel";
import RegForm from "../../components/RegForm";

import "../../assets/student/event.css";
import "../../assets/shared/chatbot.css";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegModal, setShowRegModal] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view event details.");
      setLoading(false);
      setTimeout(() => navigate("/login-student"), 1500);
      return;
    }
    if (!id) {
      // When no ID is provided, fetch and show all events
      const fetchAllEvents = async () => {
        try {
          const allEvents = await eventService.getAllEvents();
          setRelated(allEvents); // Use related state to store all events
          setLoading(false);
        } catch (err) {
          setError("Failed to load events. Please try again later.");
          setLoading(false);
        }
      };
      fetchAllEvents();
      return;
    }
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEventById(id);
        setEvent(data);
        const allEvents = await eventService.getAllEvents();
        const filtered = allEvents.filter((e) => e._id !== id);
        setRelated(filtered.slice(0, 2));

        // Check if user is registered for this event
        try {
          const registrations = await regService.getRegistrations();
          const userReg = registrations.find(
            (r) => r.event?._id === id || r.event === id
          );
          if (userReg) {
            setUserRegistration(userReg);
          }
        } catch (regErr) {
          console.warn("Could not fetch user registrations:", regErr);
        }
      } catch (err) {
        let errorMsg = "Failed to fetch event data. Please try again later.";
        if (err.response) {
          errorMsg += `\nStatus: ${err.response.status}`;
          errorMsg += `\nMessage: ${err.response.data?.message || JSON.stringify(err.response.data)}`;
        } else if (err.request) {
          errorMsg += "\nNo response received from server.";
        } else {
          errorMsg += `\nError: ${err.message}`;
        }
        setError(errorMsg);
        console.error("Event fetch error details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const formatDate = (d) => {
    const date = d ? new Date(d) : null;
    if (!date || isNaN(date)) return "Not set";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="event-container">
          <h2>Loading event details...</h2>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Nav />
        <div className="event-container">
          <h2 style={{ color: 'red' }}>{error}</h2>
        </div>
        <Footer />
      </>
    );
  }

  // Show all events list when no specific event is requested
  if (!id && related.length > 0) {
    return (
      <>
        <Nav />
        <div className="event-container all-events-page">
          <h2>All Events</h2>
          <div className="all-events-list">
            {related.map((ev) => (
              <div key={ev._id} className={`event-item-full ${expandedId === ev._id ? 'expanded' : ''}`}>
                <div className="event-inner">
                  <div className="event-summary" onClick={() => setExpandedId(expandedId === ev._id ? null : ev._id)}>
                    <div className="summary-left">
                      <div className="summary-title">{ev.title}</div>
                      <div className="summary-meta">{formatDate(ev.startDateTime || ev.date)} • {ev.category || 'Event'}</div>
                    </div>
                    <div className="summary-right">
                      <div className="summary-action">{expandedId === ev._id ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {expandedId === ev._id && (
                    <div className="event-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-left">
                          {ev.eventBanner && <img src={ev.eventBanner} alt={ev.title} className="expanded-banner" />}
                          <h3>About</h3>
                          <p>{ev.description}</p>
                        </div>
                        <div className="expanded-right">
                          <ul className="meta-list">
                            <li><strong>Category:</strong> {ev.category || '—'}</li>
                            <li><strong>Mode:</strong> {ev.eventMode || '—'}</li>
                            <li><strong>Start:</strong> {formatDate(ev.startDateTime || ev.date)}</li>
                            <li><strong>End:</strong> {formatDate(ev.endDateTime)}</li>
                            <li><strong>Location:</strong> {ev.venueOrLink || '—'}</li>
                            <li><strong>Contact:</strong> {ev.contactEmail || '—'} {ev.contactPhone ? `• ${ev.contactPhone}` : ''}</li>
                            <li><strong>Capacity:</strong> {ev.maxParticipants || '—'}</li>
                            <li><strong>Status:</strong> {ev.status || '—'}</li>
                            <li><strong>Visibility:</strong> {ev.visibility || '—'}</li>
                          </ul>
                          <div className="expanded-actions">
                            <Link to={`/reg?eventId=${ev._id}`} className="btn-register small">Register</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
        <ChatbotWidget />
      </>
    );
  }

  // If no specific id and there are no events, show a friendly message
  if (!id && related.length === 0) {
    return (
      <>
        <Nav />
        <div className="event-container">
          <h2>No events available</h2>
          <p>There are currently no scheduled events. Check back later or contact the administrator if you think this is an error.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/dash-student" className="btn-cta">Return to Dashboard</Link>
          </div>
        </div>
        <Footer />
        <ChatbotWidget />
      </>
    );
  }

  // If we're looking for a specific event but it wasn't found
  if (id && !event) {
    return (
      <>
        <Nav />
        <div className="event-container">
          <h2>No event found.</h2>
          <p>The event you're looking for might have been removed or is no longer available.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/event-details" className="btn-cta">Browse All Events</Link>
          </div>
        </div>
        <Footer />
        <ChatbotWidget />
      </>
    );
  }

  // Show single event details
  return (
    <>
      <Nav />

      <div className="event-container event-layout">
        <main className="main-content">
          <div className="event-hero left">
            {event.eventBanner ? (
              <div className="hero-media">
                <img src={event.eventBanner} alt={event.title} />
              </div>
            ) : null}
            <div className="hero-text">
              <h1>{event.title}</h1>
              <div className="event-meta">
                <div className="meta-item"><strong>Category:</strong> {event.category || '—'}</div>
                <div className="meta-item"><strong>Mode:</strong> {event.eventMode || '—'}</div>
                <div className="meta-item"><strong>Start:</strong> {formatDate(event.startDateTime || event.date)}</div>
                <div className="meta-item"><strong>End:</strong> {formatDate(event.endDateTime)}</div>
                <div className="meta-item"><strong>Location:</strong> {event.venueOrLink || '—'}</div>
                <div className="meta-item"><strong>Contact:</strong> {event.contactEmail || '—'} {event.contactPhone ? `• ${event.contactPhone}` : ''}</div>
                <div className="meta-item"><strong>Capacity:</strong> {event.maxParticipants || '—'}</div>
                <div className="meta-item"><strong>Status:</strong> {event.status || '—'}</div>
                <div className="meta-item"><strong>Visibility:</strong> {event.visibility || '—'}</div>
              </div>

              <div className="event-actions">
                <button className="btn-register" onClick={() => setShowRegModal(true)}>
                  <span>🎟️</span> Register Now
                </button>
                <Link to="/event-details" className="btn-back">
                  Browse All Events
                </Link>
              </div>

              {userRegistration && (
                <div className="registration-proof-section">
                  <h3>✅ Registration Confirmed</h3>
                  <div className="proof-details">
                    <div className="proof-row">
                      <span className="proof-label">Registration ID:</span>
                      <span className="proof-value">{userRegistration._id}</span>
                    </div>
                    <div className="proof-row">
                      <span className="proof-label">Status:</span>
                      <span className={`proof-status ${userRegistration.status}`}>{userRegistration.status}</span>
                    </div>
                  </div>
                  
                  <div className="qr-code-full-display">
                    <h4>Your Event Pass - QR Code</h4>
                    <QRPass 
                      regId={userRegistration._id}
                      studentName={userRegistration.student?.name || "Student"}
                      eventTitle={event?.title || "Event"}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="event-description">
            <h2>About This Event</h2>
            <p>{event.description}</p>
          </div>

          {related.length > 0 && (
            <div className="event-related">
              <h2>Related Events</h2>
              <div className="events-grid">
                {related.map((ev) => (
                  <EventCard
                    key={ev._id}
                    id={ev._id}
                    title={ev.title}
                    date={formatDate(ev.startDateTime || ev.date)}
                    description={ev.description}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        <aside className="sidebar">
          <NotificationPanel />
        </aside>
      </div>

      <Footer />
      <ChatbotWidget />

      {showRegModal && (
        <div className="modal-overlay" onClick={() => setShowRegModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegModal(false)}>✕</button>
            <RegForm 
              onRegistrationSuccess={async () => {
                // Refresh user registration after successful registration
                try {
                  const registrations = await regService.getRegistrations();
                  const userReg = registrations.find(
                    (r) => r.event?._id === id || r.event === id
                  );
                  if (userReg) {
                    setUserRegistration(userReg);
                    // Auto-close modal after showing success
                    setTimeout(() => setShowRegModal(false), 1000);
                  }
                } catch (err) {
                  console.warn("Could not refresh registration:", err);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
