const express = require('express');
const router = express.Router();
const claimRequestController = require('../controllers/claimRequestController');
const { auth } = require('../middleware/auth');

// Request to claim a pickup
router.post('/:pickupId', auth, async (req, res) => {
    await claimRequestController.requestClaim(req, res);
});

// Approve a claim request
router.post('/:pickupId/:requestId/approve', auth, async (req, res) => {
    await claimRequestController.approveClaim(req, res);
});

// Reject a claim request
router.post('/:pickupId/:requestId/reject', auth, async (req, res) => {
    await claimRequestController.rejectClaim(req, res);
});

// Get claim requests for a pickup
router.get('/:pickupId', auth, async (req, res) => {
    await claimRequestController.getClaimRequests(req, res);
});

module.exports = router;