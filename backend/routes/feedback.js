const express = require('express');
const router = express.Router();
const { submitFeedback, getUserFeedback, getAllFeedback, updateFeedbackStatus, getFeedbackStats } = require('../controllers/feedbackController');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Submit feedback
router.post('/', auth, submitFeedback);

// Get user feedback
router.get('/user', auth, getUserFeedback);

// Get all feedback (admin only)
router.get('/all', [auth, admin], getAllFeedback);

// Update feedback status (admin only)
router.patch('/:id/status', [auth, admin], updateFeedbackStatus);

// Get feedback statistics (admin only)
router.get('/stats', [auth, admin], getFeedbackStats);

module.exports = router; 