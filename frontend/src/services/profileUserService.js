import api from './api';

const profileUserService = {
	// Get student profile
	getProfile: async () => {
		try {
			const res = await api.get('/profile');
			return res.data;
		} catch (error) {
			console.error('Error fetching student profile:', error);
			throw error;
		}
	},

	// Change password
	changePassword: async ({ currentPassword, newPassword }) => {
		try {
			const res = await api.post('/profile/change-password', { currentPassword, newPassword });
			return res.data;
		} catch (error) {
			console.error('Error changing password:', error);
			throw error;
		}
	},

	// Delete account
	deleteAccount: async () => {
		try {
			const res = await api.delete('/profile');
			return res.data;
		} catch (error) {
			console.error('Error deleting account:', error);
			throw error;
		}
	},

	// Update student profile
	updateProfile: async (profileData) => {
		try {
			const res = await api.put('/profile', profileData);
			return res.data;
		} catch (error) {
			console.error('Error updating student profile:', error);
			throw error;
		}
	},
};

export default profileUserService;
