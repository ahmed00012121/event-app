const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { recommendEvents } = require('../controllers/recommend');

router.post('/', protect, recommendEvents);

module.exports = router;
