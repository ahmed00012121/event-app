const express = require('express');
const router = express.Router();
const { signupStudent, loginStudent, requestPasswordReset, resetPassword } = require('../controllers/student');

router.post('/signup', signupStudent);
router.post('/login', loginStudent);

// Forgot password (request reset link)
router.post('/forgot-password', requestPasswordReset);

// Reset password (submit new password)
router.post('/reset-password/:token', resetPassword);

module.exports = router;
