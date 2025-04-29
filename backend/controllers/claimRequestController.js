const Pickup = require('../models/Pickup');
const User = require('../models/User');

// Request to claim a pickup
exports.requestClaim = async (req, res) => {
    try {
        const { pickupId } = req.params;
        const { message } = req.body;
        const recyclerId = req.user._id;

        const pickup = await Pickup.findById(pickupId);
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        // Check if pickup is available for claiming
        if (pickup.status !== 'pending') {
            return res.status(400).json({ message: 'Pickup is not available for claiming' });
        }

        // Check if recycler has already requested
        const existingRequest = pickup.claimRequests.find(
            request => request.recyclerId.toString() === recyclerId.toString()
        );
        if (existingRequest) {
            return res.status(400).json({ message: 'You have already requested this pickup' });
        }

        // Add claim request
        pickup.claimRequests.push({
            recyclerId,
            message,
            status: 'pending'
        });

        // Update pickup status
        pickup.status = 'claim_requested';
        await pickup.save();

        res.json(pickup);
    } catch (error) {
        console.error('Error requesting claim:', error);
        res.status(500).json({ message: error.message });
    }
};

// Approve a claim request
exports.approveClaim = async (req, res) => {
    try {
        const { pickupId, requestId } = req.params;
        const userId = req.user._id;

        const pickup = await Pickup.findById(pickupId);
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        // Verify user owns the pickup
        if (pickup.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to approve this request' });
        }

        // Find the claim request
        const claimRequest = pickup.claimRequests.id(requestId);
        if (!claimRequest) {
            return res.status(404).json({ message: 'Claim request not found' });
        }

        // Update claim request status
        claimRequest.status = 'approved';

        // Update pickup status and assign recycler
        pickup.status = 'claimed';
        pickup.recyclerId = claimRequest.recyclerId;

        // Reject all other pending requests
        pickup.claimRequests.forEach(request => {
            if (request._id.toString() !== requestId && request.status === 'pending') {
                request.status = 'rejected';
            }
        });

        await pickup.save();
        res.json(pickup);
    } catch (error) {
        console.error('Error approving claim:', error);
        res.status(500).json({ message: error.message });
    }
};

// Reject a claim request
exports.rejectClaim = async (req, res) => {
    try {
        const { pickupId, requestId } = req.params;
        const userId = req.user._id;

        const pickup = await Pickup.findById(pickupId);
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        // Verify user owns the pickup
        if (pickup.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to reject this request' });
        }

        // Find the claim request
        const claimRequest = pickup.claimRequests.id(requestId);
        if (!claimRequest) {
            return res.status(404).json({ message: 'Claim request not found' });
        }

        // Update claim request status
        claimRequest.status = 'rejected';

        // If this was the only pending request, set pickup back to pending
        const hasPendingRequests = pickup.claimRequests.some(
            request => request.status === 'pending'
        );
        if (!hasPendingRequests) {
            pickup.status = 'pending';
        }

        await pickup.save();
        res.json(pickup);
    } catch (error) {
        console.error('Error rejecting claim:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get claim requests for a pickup
exports.getClaimRequests = async (req, res) => {
    try {
        const { pickupId } = req.params;
        const userId = req.user._id;

        const pickup = await Pickup.findById(pickupId)
            .populate('claimRequests.recyclerId', 'name rating totalRatings');

        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        // Verify user owns the pickup
        if (pickup.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these requests' });
        }

        res.json(pickup.claimRequests);
    } catch (error) {
        console.error('Error getting claim requests:', error);
        res.status(500).json({ message: error.message });
    }
}; 