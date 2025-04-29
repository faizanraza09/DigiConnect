const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// Rate a pickup (household only)
router.post('/:pickupId', [
    auth,
    body('rating').isInt({ min: 1, max: 5 }),
    body('feedback').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const pickup = await Pickup.findById(req.params.pickupId);
        
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        if (pickup.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (pickup.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed pickups' });
        }

        if (pickup.rating) {
            return res.status(400).json({ message: 'Pickup already rated' });
        }

        const { rating, feedback } = req.body;
        pickup.rating = rating;
        pickup.feedback = feedback;
        await pickup.save();

        // Update recycler's average rating
        const recycler = await User.findById(pickup.recyclerId);
        const recyclerPickups = await Pickup.find({
            recyclerId: pickup.recyclerId,
            rating: { $exists: true }
        });

        const totalRating = recyclerPickups.reduce((sum, p) => sum + p.rating, 0);
        recycler.rating = totalRating / recyclerPickups.length;
        recycler.totalRatings = recyclerPickups.length;
        await recycler.save();

        res.json(pickup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recycler's ratings
router.get('/recycler/:recyclerId', auth, async (req, res) => {
    try {
        const pickups = await Pickup.find({
            recyclerId: req.params.recyclerId,
            rating: { $exists: true }
        }).select('rating feedback createdAt');

        res.json(pickups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 