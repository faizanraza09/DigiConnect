const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Pickup = require('../models/Pickup');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.patch('/profile', [
    auth,
    body('name').optional().notEmpty(),
    body('location.coordinates').optional().isArray(),
    body('location.address').optional().notEmpty(),
    body('language').optional().isIn(['en', 'ur'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'location', 'language'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.json(req.user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get top recyclers
router.get('/top-recyclers', auth, async (req, res) => {
    try {
        const recyclers = await User.find({ userType: 'recycler' })
            .select('name rating totalRatings')
            .sort({ rating: -1 })
            .limit(10);

        res.json(recyclers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const pickups = await Pickup.find(
            req.user.userType === 'household' 
                ? { userId: req.user._id }
                : { recyclerId: req.user._id }
        ).populate('materials.materialId');

        // Calculate total value from pickups
        const totalValue = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * material.priceAtPickup || 0);
            }, 0);
        }, 0);

        const stats = {
            totalPickups: pickups.length,
            totalWeight: pickups.reduce((sum, p) => sum + (p.totalWeight || 0), 0),
            totalValue,
            rating: user.rating || 0,
            totalRatings: user.totalRatings || 0,
            recentActivity: pickups
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
                .map(pickup => ({
                    description: `${pickup.status} pickup of ${pickup.totalWeight}kg`,
                    date: pickup.createdAt,
                    materials: pickup.materials.map(m => ({
                        name: m.materialId?.name || 'Unknown',
                        quantity: m.quantity
                    }))
                }))
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 