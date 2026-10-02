import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import Nav from "../../components/nav";
import Footer from "../../components/footer";

// Services
import profileUserService from "../../services/profileUserService";

// Styles
import "../../assets/student/profileUser.css";

export default function ProfileUser() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileUserService.getProfile();
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          department: data.department || "",
          year: data.year || "",
          college: data.college || "",
        });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await profileUserService.updateProfile(formData);
      setUser(updated);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert("Passwords do not match!");
    }
    try {
      await profileUserService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      alert("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to change password.");
    }
  };

  if (loading) return <div className="loading-state">Loading profile...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <>
      <Nav />

      <div className="profile-container">
        <h1>My Profile</h1>

        {/* Profile Form */}
        <form className="profile-form" onSubmit={handleUpdateProfile}>
          <label>Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <label>Email</label>
          <input type="email" value={formData.email} disabled />

          <label>Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <label>Department / Course</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />

          <label>Year / College</label>
          <input
            type="text"
            value={`${formData.year} ${formData.college ? `/ ${formData.college}` : ""}`}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />

          <button type="submit" className="btn-save">Save Changes</button>
        </form>

        {/* Password Change Form */}
        <form className="password-form" onSubmit={handleChangePassword}>
          <h2>Change Password</h2>

          <label>Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />

          <label>New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />

          <button type="submit" className="btn-change-password">Change Password</button>
        </form>
      </div>

      <Footer />
    </>
  );
}
