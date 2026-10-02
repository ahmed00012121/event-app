import { Link, useNavigate } from "react-router-dom";
import "../assets/shared/navadmin.css";

export default function NavAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login-admin");
  };

  return (
    <nav className="nav-admin-container">
      <div className="nav-admin-logo">Admin Panel</div>

      <ul className="nav-admin-list">
        <li><Link to="/dash-admin">Dashboard</Link></li>
        <li><Link to="/manage-reg-user">Manage Registrations</Link></li>
        <li><Link to="/manage-events">Manage Events</Link></li>
        <li><Link to="/add-event">Add Event</Link></li>
        <li><Link to="/manage-users">Manage Users</Link></li>
        <li><Link to="/notifications-admin">Notifications</Link></li>
        <li><Link to="/feedback-admin">Feedback</Link></li>

        <li>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}