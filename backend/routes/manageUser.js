const express = require('express');
const router = express.Router();

const { getAllUsers, deleteUser, adminSendReset, adminSetPassword } = require('../controllers/manageUser');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// 🧩 Route endpoints (admin only)
router.get('/', protect, authorize('admin'), getAllUsers);
router.delete('/:type/:id', protect, authorize('admin'), deleteUser);

// Send reset link to a student (admin)
router.post('/:id/send-reset', protect, authorize('admin'), adminSendReset);

// Admin set password for student
router.put('/:id/reset-password', protect, authorize('admin'), adminSetPassword);

module.exports = router;
