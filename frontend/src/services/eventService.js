// src/services/eventService.js
import axios from "./api";

const eventService = {
  // 🧾 Fetch all events (students & admin)
  getAllEvents: async () => {
    const res = await axios.get("/event");
    return res.data;
  },

  // 🔍 Fetch single event details
  getEventById: async (id) => {
    const res = await axios.get(`/event/${id}`);
    return res.data;
  },

  // 🧑‍💼 Admin: Create new event
  createEvent: async (data) => {
    const token = localStorage.getItem("token");
    // When sending FormData, let the browser/axios set the Content-Type (boundary)
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.post("/event", data, { headers });
    return res.data;
  },

  // 🧑‍💼 Admin: Update an event
  updateEvent: async (id, data) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.put(`/event/${id}`, data, { headers });
    return res.data;
  },

  // 🧑‍💼 Admin: Delete event
  deleteEvent: async (id) => {
    const token = localStorage.getItem("token");
    const res = await axios.delete(`/event/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // (Registration endpoints were removed on the server to match requested minimal event model)
};

export default eventService;
