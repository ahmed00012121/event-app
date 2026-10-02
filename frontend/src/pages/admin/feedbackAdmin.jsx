// src/pages/admin/feedbackAdmin.jsx
import React, { useEffect, useState } from "react";
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import feedbackService from "../../services/feedbackService";
import "../../assets/admin/feedbackAdmin.css";

export default function FeedbackAdmin() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await feedbackService.getAllFeedback();
        setFeedbacks(data || []);
      } catch (err) {
        console.error("Failed to load feedback:", err);
        setMessage("Failed to load feedback.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      {/* 🔝 Top Navigation */}
      <NavAdmin />

      <div className="feedback-admin-container">
        <h2 className="feedback-admin-title">Student Feedback Overview</h2>

        <div className="feedback-admin-filters">
          <input
            placeholder="Search by student, message or event"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 2, padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)' }}
          />

          <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
            <option value="all">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>

          <select>
            <option value="">Sort by</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>

        <div className="feedback-admin-list">
          {loading ? (
            <p>Loading feedback...</p>
          ) : feedbacks.length === 0 ? (
            <p>No feedback available.</p>
          ) : (
            // Apply search & sentiment filter
            feedbacks
              .filter((f) => {
                const q = searchQuery.trim().toLowerCase();
                if (q) {
                  const inStudent = (f.student?.name || '').toLowerCase().includes(q) || (f.student?.email || '').toLowerCase().includes(q);
                  const inEvent = (f.event?.title || '').toLowerCase().includes(q);
                  const inMessage = (f.message || '').toLowerCase().includes(q);
                  if (!inStudent && !inEvent && !inMessage) return false;
                }
                if (sentimentFilter !== 'all') {
                  return (f.sentiment || 'neutral') === sentimentFilter;
                }
                return true;
              })
              .map((f) => (
                <div className="feedback-item" key={f._id}>
                  <div className="feedback-avatar">
                    {(
                      (f.student?.name && f.student.name.split(' ').map(n => n[0]).slice(0,2).join('')) ||
                      (f.student?.email && f.student.email.slice(0,2).toUpperCase()) ||
                      'ST'
                    )}
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-top">
                      <div className="feedback-meta">
                        <div className="feedback-event">{f.event?.title || 'General'}</div>
                        <div className="feedback-student">{f.student?.name || f.student?.email || 'Unknown'}</div>
                      </div>

                      <div className="feedback-actions">
                        <button className="btn btn-edit" onClick={() => setExpandedId(expandedId === f._id ? null : f._id)}>
                          {expandedId === f._id ? 'Hide' : 'View'}
                        </button>
                        <a className="btn btn-delete" href={f.student?.email ? `mailto:${f.student.email}?subject=Reply to your feedback` : '#'}>
                          Reply
                        </a>
                      </div>
                    </div>

                    <p>{expandedId === f._id ? f.message : (f.message.length > 160 ? f.message.slice(0,160) + '...' : f.message)}</p>
                    {f.sentiment && (
                      <div className={`sentiment-badge sentiment-${f.sentiment}`}>
                        {f.sentiment.charAt(0).toUpperCase() + f.sentiment.slice(1)}
                      </div>
                    )}
                    <div className="feedback-meta-row">
                      <small style={{ color: '#94a3b8' }}>{new Date(f.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                </div>
              ))
          )}

          {message && <p className="status-message">{message}</p>}
        </div>
      </div>

      {/* 🔻 Footer */}
      <Footer />
    </>
  );
}
