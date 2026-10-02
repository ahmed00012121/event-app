import axios from "./api";

const regService = {
  // Register for an event (Student)
  registerEvent: async (eventId) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "/reg/register",
      { eventId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Axios instance is configured to not throw for 4xx, so explicitly handle errors
    if (!res || res.status >= 400) {
      const msg = res?.data?.message || 'Registration failed';
      const err = new Error(msg);
      err.response = res;
      throw err;
    }

    return res.data;
  },

  // Get all registrations (Student or Admin)
  getRegistrations: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("/reg", { headers: { Authorization: `Bearer ${token}` } });
    if (!res || res.status >= 400) {
      const msg = res?.data?.message || 'Failed to fetch registrations';
      const err = new Error(msg);
      err.response = res;
      throw err;
    }
    return res.data;
  },

  // Verify attendance code (Admin/Student)
  verifyAttendanceCode: async (attendanceCode) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "/reg/verify-code",
      { attendanceCode },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res || res.status >= 400) {
      const msg = res?.data?.message || 'Verification failed';
      const err = new Error(msg);
      err.response = res;
      throw err;
    }
    return res.data;
  },

  // Update registration status (Admin)
  updateRegistrationStatus: async (registrationId, status, extra = {}) => {
    const token = localStorage.getItem("token");
    const payload = { status, ...extra };
    const res = await axios.put(`/reg/update/${registrationId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res || res.status >= 400) {
      const msg = res?.data?.message || 'Failed to update registration status';
      const err = new Error(msg);
      err.response = res;
      throw err;
    }
    return res.data;
  },

  // Delete registration (Admin)
  deleteRegistration: async (registrationId) => {
    const token = localStorage.getItem("token");
    const res = await axios.delete(`/reg/delete/${registrationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res || res.status >= 400) {
      const msg = res?.data?.message || 'Failed to delete registration';
      const err = new Error(msg);
      err.response = res;
      throw err;
    }
    return res.data;
  },
};

export default regService;
