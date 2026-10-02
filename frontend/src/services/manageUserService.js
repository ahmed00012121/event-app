import api from './api';

const manageUserService = {
  // Get all users (students + admins)
  getAllUsers: async () => {
    const res = await api.get('/manage-users');
    return res.data; // { students: [...], admins: [...] }
  },

  // Delete a specific user
  deleteUser: async (type, id) => {
    const res = await api.delete(`/manage-users/${type}/${id}`);
    return res.data;
  },

  // Admin: send reset email to student
  sendResetEmail: async (id) => {
    const res = await api.post(`/manage-users/${id}/send-reset`);
    return res.data;
  },

  // Admin: set student's password directly
  adminSetPassword: async (id, password) => {
    const res = await api.put(`/manage-users/${id}/reset-password`, { password });
    return res.data;
  },

  // Update a user's information (optional)
  updateUser: async (type, id, data) => {
    const res = await api.put(`/manage-users/${type}/${id}`, data);
    return res.data;
  },
};

export default manageUserService;
