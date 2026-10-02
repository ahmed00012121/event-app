import { Link } from "react-router-dom";
import "../assets/shared/components.css";

export default function EventCard({ event, onRegister }) {
  const {
    _id,
    title,
    description,
    date,
    location
  } = event || {};

  // Format date nicely
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  // Truncate description if it's too long
  const shortDescription = description?.length > 120 
    ? description.substring(0, 120) + "..."
    : description;

  return (
    <div className="event-card">
      <div className="card-inner">
        <div className="card-thumb">🎉</div>
        <div className="card-body">
          <h3>{title || 'Untitled Event'}</h3>
          <p className="event-meta">
            <span className="date"><strong>📅 {formattedDate}</strong></span>
            {location && <span className="location">📍 {location}</span>}
          </p>
          <p className="description">{shortDescription || 'No description available'}</p>
          <button onClick={() => onRegister?.()} className="btn-register">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
