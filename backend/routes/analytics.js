const express = require('express');
const router = express.Router();
const { getDashboardData, updateAnalytics, getMarketPrices, getEnvironmentalImpact } = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// Get dashboard data
router.get('/dashboard', auth, getDashboardData);

// Update analytics (admin only)
router.post('/update', [auth, admin], updateAnalytics);

// Get market prices
router.get('/market-prices', auth, getMarketPrices);

// Get environmental impact
router.get('/environmental-impact', auth, getEnvironmentalImpact);

// Network analysis endpoint
router.get('/network', async (req, res) => {
    try {
        // Get all completed pickups
        const pickups = await Pickup.find({ status: 'completed' })
            .populate('userId', 'name userType')
            .populate('recyclerId', 'name userType');

        // Create nodes and edges for the network
        const nodesMap = new Map(); // Use Map to store unique nodes by ID
        const edges = [];

        pickups.forEach(pickup => {
            if (pickup.userId && pickup.recyclerId) {
                // Add or update household node
                if (!nodesMap.has(pickup.userId._id.toString())) {
                    nodesMap.set(pickup.userId._id.toString(), {
                        id: pickup.userId._id.toString(),
                        name: pickup.userId.name,
                        type: pickup.userId.userType,
                        weight: 0,
                        value: 0
                    });
                }
                const householdNode = nodesMap.get(pickup.userId._id.toString());
                householdNode.weight += pickup.totalWeight;
                householdNode.value += pickup.totalValue;

                // Add or update recycler node
                if (!nodesMap.has(pickup.recyclerId._id.toString())) {
                    nodesMap.set(pickup.recyclerId._id.toString(), {
                        id: pickup.recyclerId._id.toString(),
                        name: pickup.recyclerId.name,
                        type: pickup.recyclerId.userType,
                        weight: 0,
                        value: 0
                    });
                }
                const recyclerNode = nodesMap.get(pickup.recyclerId._id.toString());
                recyclerNode.weight += pickup.totalWeight;
                recyclerNode.value += pickup.totalValue;

                // Add edge
                edges.push({
                    source: pickup.userId._id.toString(),
                    target: pickup.recyclerId._id.toString(),
                    weight: pickup.totalWeight,
                    value: pickup.totalValue
                });
            }
        });

        // Convert nodes Map to array
        const nodes = Array.from(nodesMap.values());

        // Calculate network metrics
        const metrics = {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            averageDegree: edges.length / nodes.length,
            density: edges.length / (nodes.length * (nodes.length - 1)),
            averageWeight: edges.reduce((sum, edge) => sum + edge.weight, 0) / edges.length,
            averageValue: edges.reduce((sum, edge) => sum + edge.value, 0) / edges.length
        };

        res.json({
            nodes,
            edges,
            metrics
        });
    } catch (error) {
        console.error('Error in network analysis:', error);
        res.status(500).json({ message: 'Error performing network analysis' });
    }
});

// Admin analytics endpoint
router.get('/admin', [auth, admin], async (req, res) => {
    try {
        // Get total pickups and weight
        const pickups = await Pickup.find({ status: 'completed' });
        const totalPickups = pickups.length;
        const totalWeight = pickups.reduce((sum, pickup) => sum + pickup.totalWeight, 0);
        const totalValue = pickups.reduce((sum, pickup) => sum + pickup.totalValue, 0);

        // Get user counts
        const totalUsers = await User.countDocuments();
        const activeRecyclers = await User.countDocuments({ 
            userType: 'recycler',
            lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        });

        // Get pickup trends (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const pickupTrends = await Pickup.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    value: { $sum: "$totalValue" }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    value: 1,
                    _id: 0
                }
            }
        ]);

        // Get material distribution
        const materialDistribution = await Pickup.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $unwind: "$materials"
            },
            {
                $lookup: {
                    from: "materials",
                    localField: "materials.materialId",
                    foreignField: "_id",
                    as: "materialDetails"
                }
            },
            {
                $unwind: "$materialDetails"
            },
            {
                $group: {
                    _id: "$materialDetails.name",
                    weight: { $sum: "$materials.quantity" },
                    value: { $sum: { $multiply: ["$materials.quantity", "$materials.priceAtPickup"] } }
                }
            },
            {
                $project: {
                    name: "$_id",
                    weight: 1,
                    value: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            totalPickups,
            totalWeight,
            totalValue,
            totalUsers,
            activeRecyclers,
            pickupTrends,
            materialDistribution
        });
    } catch (error) {
        console.error('Error in admin analytics:', error);
        res.status(500).json({ message: 'Error fetching admin analytics' });
    }
});

module.exports = router; 