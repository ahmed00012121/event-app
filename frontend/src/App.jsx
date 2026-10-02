import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/protectedRoute.jsx";

import LoginStudent from "./pages/student/loginStudent.jsx";
import LoginAdmin from "./pages/admin/loginAdmin.jsx";
import SignupStudent from "./pages/student/signupStudent.jsx";

import DashStudent from "./pages/student/dashStudent.jsx";
import DashAdmin from "./pages/admin/dashAdmin.jsx";

import EventDetails from "./pages/student/eventDetails.jsx";
import FeedbackStudent from "./pages/student/feedbackStudent.jsx";
import FeedbackAdmin from "./pages/admin/feedbackAdmin.jsx";

import ManageEvents from "./pages/admin/manageEvents.jsx";
import AddEvent from "./pages/admin/addEvent.jsx";

import ManageUsers from "./pages/admin/manageUsers.jsx";
import ManageRegUser from "./pages/admin/manageRegUser.jsx";
import Notificationsadmin from "./pages/admin/notificationsAdmin.jsx";

import Notificationsstudent from "./pages/student/notificationsStudent.jsx";
import Reg from "./pages/student/reg.jsx";
import Recommend from "./pages/student/recommend.jsx";
import ProfileUser from "./pages/student/profileUser.jsx";
import ForgotPassword from "./pages/student/forgotPassword.jsx";
import ResetPassword from "./pages/student/resetPassword.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login-student" replace />} />

        <Route path="/login-student" element={<LoginStudent />} />
        <Route path="/signup-student" element={<SignupStudent />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/dash-student"
          element={
            <ProtectedRoute loginPath="/login-student">
              <DashStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/event-details"
          element={
            <ProtectedRoute loginPath="/login-student">
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommend"
          element={
            <ProtectedRoute loginPath="/login-student">
              <Recommend />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reg"
          element={
            <ProtectedRoute loginPath="/login-student">
              <Reg />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback-student"
          element={
            <ProtectedRoute loginPath="/login-student">
              <FeedbackStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications-student"
          element={
            <ProtectedRoute loginPath="/login-student">
              <Notificationsstudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile-user"
          element={
            <ProtectedRoute loginPath="/login-student">
              <ProfileUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dash-admin"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <DashAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-events"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-event"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <AddEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback-admin"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <FeedbackAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-reg-user"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <ManageRegUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications-admin"
          element={
            <ProtectedRoute adminOnly loginPath="/login-admin">
              <Notificationsadmin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}