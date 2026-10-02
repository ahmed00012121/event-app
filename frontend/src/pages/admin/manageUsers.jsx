// src/pages/admin/manageUsers.jsx
import React, { useState, useEffect } from "react";
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import "../../assets/admin/manageUsers.css";
import manageUserService from "../../services/manageUserService";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await manageUserService.getAllUsers();

        const students = (data.students || []).map((s) => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          role: "student",
          type: "student",
        }));

        const admins = (data.admins || []).map((a) => ({
          _id: a._id,
          name: a.name,
          email: a.email,
          role: a.role || "admin",
          type: "admin",
        }));

        setUsers([...admins, ...students]);
      } catch (err) {
        console.error("Failed to load users", err);
        setMessage("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;

    try {
      await manageUserService.deleteUser(user.type, user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setMessage("User deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("Failed to delete user");
    }
  };

  return (
    <>
      <NavAdmin />

      <div className="manage-users-page">
        <h2>Manage Users</h2>
        <p className="subtitle">Admin & Student Accounts</p>

        {loading ? (
          <div className="loading-users">Loading users...</div>
        ) : (
          <div className="users-list">
            {users.map((user, index) => (
              <div key={user._id} className="user-item">
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>Email: {user.email}</p>
                  <p>Role: {user.role}</p>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(user)}
                >
                  Delete
                </button>
              </div>
            ))}

            {users.length === 0 && (
              <div className="no-users">No users found</div>
            )}
          </div>
        )}

        {message && <div className="status-msg">{message}</div>}
      </div>

      <Footer />
    </>
  );
}
