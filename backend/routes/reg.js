const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const {
    registerEvent,
    getRegistrations,
    verifyAttendanceCode,
    updateRegistrationStatus,
    deleteRegistration
} = require('../controllers/reg');

// Register for Event (Student)
router.post('/register', protect, authorize('student'), registerEvent);

// Get Registrations (Admin + Student)
router.get('/', protect, getRegistrations);

// Verify Attendance Code
router.post('/verify-code', protect, verifyAttendanceCode);

// Update Registration Status (Admin only)
router.put('/update/:id', protect, authorize('admin'), updateRegistrationStatus);

// Delete Registration (Admin only)
router.delete('/delete/:id', protect, authorize('admin'), deleteRegistration);

module.exports = router;
