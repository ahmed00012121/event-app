// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { chatWithBot, getChatLogs, getChatStats } = require('../controllers/chatbot');

/**
 * Public chatbot endpoint - allows guests and authenticated users
 * POST /api/chatbot
 * Body: { message: string }
 * Returns: { reply: string, navigate?: string, action?: string }
 * Auth: Optional - works with or without token
 */
router.post('/', optionalAuth, chatWithBot);

/**
 * Admin-only: Get chatbot conversation logs for analytics
 * GET /api/chatbot/logs
 * Query params: page, limit, userId
 * Returns: { logs: [...], pagination: {...} }
 */
router.get('/logs', protect, authorize('admin'), getChatLogs);

/**
 * Admin-only: Get chatbot usage statistics
 * GET /api/chatbot/stats
 * Returns: { overall: {...}, byRole: [...] }
 */
router.get('/stats', protect, authorize('admin'), getChatStats);

module.exports = router;
