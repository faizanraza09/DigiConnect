const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const Material = require('../models/Material');

// Get all materials (public)
router.get('/', async (req, res) => {
    try {
        const materials = await Material.find({ isActive: true });
        res.json(materials);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get material by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        res.json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new material (admin only)
router.post('/', [
    auth,
    admin,
    body('name').notEmpty().withMessage('Name is required'),
    body('category').isIn(['plastic', 'paper', 'glass', 'metal', 'electronics', 'organic'])
        .withMessage('Invalid category'),
    body('pricePerKg').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('environmentalImpact.co2Reduced').isFloat({ min: 0 })
        .withMessage('CO2 reduction must be a positive number'),
    body('environmentalImpact.waterSaved').isFloat({ min: 0 })
        .withMessage('Water saved must be a positive number'),
    body('environmentalImpact.treesSaved').isFloat({ min: 0 })
        .withMessage('Trees saved must be a positive number'),
    body('environmentalImpact.energySaved').isFloat({ min: 0 })
        .withMessage('Energy saved must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const material = new Material(req.body);
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update material (admin only)
router.put('/:id', [
    auth,
    admin,
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('category').optional()
        .isIn(['plastic', 'paper', 'glass', 'metal', 'electronics', 'organic'])
        .withMessage('Invalid category'),
    body('pricePerKg').optional().isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('environmentalImpact.co2Reduced').optional().isFloat({ min: 0 })
        .withMessage('CO2 reduction must be a positive number'),
    body('environmentalImpact.waterSaved').optional().isFloat({ min: 0 })
        .withMessage('Water saved must be a positive number'),
    body('environmentalImpact.treesSaved').optional().isFloat({ min: 0 })
        .withMessage('Trees saved must be a positive number'),
    body('environmentalImpact.energySaved').optional().isFloat({ min: 0 })
        .withMessage('Energy saved must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const material = await Material.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        res.json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete material (admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 