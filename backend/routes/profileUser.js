// backend/routes/profileUser.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../controllers/profileUser');

// GET /api/profile
router.get('/', protect, getProfile);

// PUT /api/profile
router.put('/', protect, updateProfile);

// POST /api/profile/change-password
router.post('/change-password', protect, changePassword);

// DELETE /api/profile
router.delete('/', protect, deleteAccount);

module.exports = router;
