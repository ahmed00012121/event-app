import api from './api';

const feedbackService = {
  // Submit feedback (student)
  submitFeedback: async (data) => {
    const res = await api.post('/feedback', data);
    return res.data;
  },

  // Get all feedback (admin will receive all feedbacks)
  getAllFeedback: async () => {
    const res = await api.get('/feedback');
    return res.data;
  },

  // Optional helpers if backend supports them
  getFeedbackByEvent: async (eventId) => {
    const res = await api.get(`/feedback/event/${eventId}`);
    return res.data;
  },

  analyzeSentiment: async (text) => {
    const res = await api.post('/feedback/analyze', { text });
    return res.data;
  },

  // Get user feedback stats
  getUserStats: async (userId) => {
    try {
      const res = await api.get(`/feedback/user/${userId}/stats`);
      return res.data;
    } catch (err) {
      // If endpoint not implemented, return basic stats
      return {
        feedbackSubmitted: 0,
        averageSentiment: 0,
      };
    }
  },
};

export default feedbackService;
