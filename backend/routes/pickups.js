const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const checkUserType = require('../middleware/checkUserType');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Material = require('../models/Material');
const MarketPrice = require('../models/MarketPrice');

// Get user's pickups
router.get('/my-pickups', auth, async (req, res) => {
    try {
        const query = req.user.userType === 'household' 
            ? { userId: req.user._id }
            : { recyclerId: req.user._id };

        const pickups = await Pickup.find(query)
            .populate('userId', 'name location')
            .populate('recyclerId', 'name location')
            .populate('materials.materialId', 'name pricePerKg environmentalImpact');

        res.json(pickups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get nearby pickups (recycler only)
router.get('/nearby', [
    auth,
    checkUserType(['recycler'])
], async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 5000 } = req.query;

        const pickups = await Pickup.find({
            status: 'pending',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        })
        .populate('userId', 'name location')
        .populate('materials.materialId', 'name pricePerKg environmentalImpact');

        res.json(pickups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pickup by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate('userId', 'name location')
            .populate('recyclerId', 'name location')
            .populate('materials.materialId', 'name pricePerKg environmentalImpact');

        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        res.json(pickup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create pickup request (household only)
router.post('/', [
    auth,
    checkUserType(['household']),
    body('materials').isArray(),
    body('materials.*.materialId').isMongoId(),
    body('materials.*.quantity').isFloat({ min: 0 }),
    body('location.coordinates').isArray(),
    body('location.address').notEmpty(),
    body('pickupTime').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Calculate market prices for each material
        const materialsWithPrices = await Promise.all(req.body.materials.map(async (material) => {
            const materialDoc = await Material.findById(material.materialId);
            if (!materialDoc) {
                throw new Error(`Material ${material.materialId} not found`);
            }

            // Get or create market price record
            let marketPrice = await MarketPrice.findOne({ materialId: material.materialId });
            if (!marketPrice) {
                marketPrice = new MarketPrice({
                    materialId: material.materialId,
                    basePrice: materialDoc.pricePerKg,
                    currentPrice: materialDoc.pricePerKg
                });
                await marketPrice.save();
            }

            // Calculate current market price
            const currentPrice = await marketPrice.calculateNewPrice();
            await marketPrice.save();

            return {
                ...material,
                priceAtPickup: Number(currentPrice.toFixed(2))
            };
        }));

        const pickup = new Pickup({
            ...req.body,
            materials: materialsWithPrices,
            userId: req.user._id
        });

        await pickup.save();
        res.status(201).json(pickup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Claim pickup (recycler only)
router.patch('/:id/claim', [
    auth,
    checkUserType(['recycler'])
], async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id);
        
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        if (pickup.status !== 'pending') {
            return res.status(400).json({ message: 'Pickup already claimed' });
        }

        // Update both recyclerId and status
        pickup.recyclerId = req.user._id;
        pickup.status = 'claimed';
        
        // Save the changes
        await pickup.save();

        // Populate the updated pickup before sending response
        const updatedPickup = await Pickup.findById(pickup._id)
            .populate('userId', 'name location')
            .populate('recyclerId', 'name location')
            .populate('materials.materialId', 'name pricePerKg environmentalImpact');

        res.json(updatedPickup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Complete pickup (recycler only)
router.patch('/:id/complete', [
    auth,
    checkUserType(['recycler'])
], async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id);
        
        if (!pickup) {
            return res.status(404).json({ message: 'Pickup not found' });
        }

        if (pickup.recyclerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (pickup.status !== 'claimed') {
            return res.status(400).json({ message: 'Invalid pickup status' });
        }

        pickup.status = 'completed';
        pickup.completedAt = new Date();
        await pickup.save();

        // Update recycler's points using totalValue
        const recycler = await User.findById(req.user._id);
        recycler.points += pickup.totalValue;
        await recycler.save();

        res.json(pickup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 