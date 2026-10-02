const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { submitFeedback, getFeedback } = require('../controllers/feedback');

router.post('/', protect, authorize('student'), submitFeedback);
router.get('/', protect, getFeedback);

module.exports = router;
