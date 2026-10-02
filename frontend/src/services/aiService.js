import axios from "./api";

/**
 * AI Service - Handles chatbot communication and AI-driven features
 * Provides role-based responses and real-time data integration
 */
const aiService = {
  // 💬 Chatbot interaction with role awareness
  sendMessage: async (message) => {
    try {
      const res = await axios.post("/chatbot", { message });
      return res.data;
    } catch (error) {
      console.error("Chatbot error:", error);
      throw error;
    }
  },

  // 🧾 Get chatbot conversation logs (admin only)
  getChatLogs: async (page = 1, limit = 20, userId = null) => {
    try {
      const params = { page, limit };
      if (userId) params.userId = userId;
      const res = await axios.get("/chatbot/logs", { params });
      return res.data;
    } catch (error) {
      console.error("Error fetching chat logs:", error);
      throw error;
    }
  },

  // 📊 Get chatbot usage statistics (admin only)
  getChatStats: async () => {
    try {
      const res = await axios.get("/chatbot/stats");
      return res.data;
    } catch (error) {
      console.error("Error fetching chat stats:", error);
      throw error;
    }
  },

  // 🎯 Get personalized event recommendations (for students)
  getRecommendations: async (studentId) => {
    try {
      const res = await axios.get(`/recommend/${studentId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  },

  // ✅ Register for event via chatbot action
  registerForEvent: async (eventId) => {
    try {
      const res = await axios.post("/reg", { eventId });
      return res.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // 💬 Submit feedback via chatbot
  submitFeedback: async (eventId, rating, comment) => {
    try {
      const res = await axios.post("/feedback", { eventId, rating, comment });
      return res.data;
    } catch (error) {
      console.error("Feedback submission error:", error);
      throw error;
    }
  },

  // 📋 Get event details
  getEventDetails: async (eventId) => {
    try {
      const res = await axios.get(`/event/${eventId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching event details:", error);
      throw error;
    }
  },

  // 🔔 Get user notifications
  getNotifications: async () => {
    try {
      const res = await axios.get("/notifications");
      return res.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // 📊 Get admin dashboard stats (admin only)
  getAdminStats: async () => {
    try {
      const res = await axios.get("/admin/stats");
      return res.data;
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw error;
    }
  },
};

export default aiService;
