import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import eventService from "../services/eventService";
import aiService from "../services/aiService";
import "../assets/shared/components.css";

export default function RecommendCard({ event }) {
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await aiService.registerForEvent(event._id);
      setRegistered(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dash-student');
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="recommend-card">
      {/* Event Banner/Image */}
      {event.eventBanner && (
        <div className="recommend-card-image">
          <img 
            src={event.eventBanner} 
            alt={event.title}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Card Content */}
      <div className="recommend-card-content">
        {/* Category Badge */}
        {event.category && (
          <span className="recommend-card-category">{event.category}</span>
        )}

        {/* Title */}
        <h3 className="recommend-card-title">{event.title}</h3>

        {/* Description - Limited to 2 lines */}
        <p className="recommend-card-description">
          {event.description && event.description.substring(0, 100)}
          {event.description && event.description.length > 100 ? '...' : ''}
        </p>

        {/* Meta Info */}
        <div className="recommend-card-meta">
          <div className="meta-item">
            <span className="meta-label">📅</span>
            <span className="meta-value">{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="meta-item">
              <span className="meta-label">📍</span>
              <span className="meta-value">{event.location}</span>
            </div>
          )}
          {event.registrationCount !== undefined && (
            <div className="meta-item">
              <span className="meta-label">👥</span>
              <span className="meta-value">
                {event.registrationCount}/{event.maxParticipants || 'Unlimited'}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="recommend-card-tags">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Score/Recommendation indicator */}
        {event.score && (
          <div className="recommend-card-score">
            <span className="score-label">Match: </span>
            <span className="score-value">{Math.round(event.score * 100)}%</span>
          </div>
        )}

        {/* Register Button */}
        <button
          className={`recommend-card-register-btn ${registered ? 'registered' : ''} ${registering ? 'loading' : ''}`}
          onClick={handleRegister}
          disabled={registering || registered}
        >
          {registering ? 'Registering...' : registered ? '✓ Registered' : 'Register Now'}
        </button>
      </div>
    </div>
  );
}
