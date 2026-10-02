import React from "react";
import "../assets/shared/components.css"; // ✅ shared styles

const ProfileCard = ({ name, email, department, year, onEdit, avatar }) => {
  return (
    <div className="profile-card">
      <div className="avatar-wrap">
        <img
          src={avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
          alt="Profile Avatar"
          className="avatar-img"
        />
      </div>
      <h3 className="profile-name">{name}</h3>
      <p className="profile-email">{email}</p>
      <div className="meta-row">
        <span className="meta"><strong>Department:</strong> {department || '—'}</span>
        <span className="meta"><strong>Year:</strong> {year || '—'}</span>
      </div>

      {onEdit && (
        <button onClick={onEdit} className="edit-btn profile-edit-btn">
          Edit Profile
        </button>
      )}
    </div>
  );
};

export default ProfileCard;
