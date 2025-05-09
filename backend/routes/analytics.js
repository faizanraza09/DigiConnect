const express = require('express');
const router = express.Router();
const { getDashboardData, updateAnalytics, getMarketPrices, getEnvironmentalImpact } = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Material = require('../models/Material');
const Analytics = require('../models/Analytics');
const MarketPrice = require('../models/MarketPrice');

// Get dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        // Get timeframe from query parameter, default to 30 days
        const days = parseInt(req.query.days || '30');
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get user's pickups with populated materials
        const pickups = await Pickup.find({
            $or: [
                { userId: req.user._id },
                { recyclerId: req.user._id }
            ],
            status: 'completed',
            createdAt: { $gte: sinceDate }
        }).populate('materials.materialId');

        // Calculate total recycling volume and revenue
        const totalRecyclingVolume = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity || 0);
            }, 0);
        }, 0);

        const totalRevenue = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * material.priceAtPickup || 0);
            }, 0);
        }, 0);

        // Calculate total environmental impact
        const totalCO2Reduced = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * (material.materialId?.environmentalImpact?.co2Reduced || 0));
            }, 0);
        }, 0);

        const totalTreesSaved = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * (material.materialId?.environmentalImpact?.treesSaved || 0));
            }, 0);
        }, 0);

        const totalWaterSaved = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * (material.materialId?.environmentalImpact?.waterSaved || 0));
            }, 0);
        }, 0);

        const totalEnergySaved = pickups.reduce((sum, pickup) => {
            return sum + pickup.materials.reduce((materialSum, material) => {
                return materialSum + (material.quantity * (material.materialId?.environmentalImpact?.energySaved || 0));
            }, 0);
        }, 0);

        // Get analytics data based on user role
        let analytics;
        if (req.user.role === 'admin') {
            // For admin, get total platform analytics
            analytics = await Analytics.find({
                date: { $gte: sinceDate }
            }).sort({ date: 1 });
        } else {
            // For regular users (both household and recycler), get their personal analytics
            analytics = await Pickup.aggregate([
                {
                    $match: {
                        $or: [
                            { userId: req.user._id },
                            { recyclerId: req.user._id }
                        ],
                        status: 'completed',
                        createdAt: { $gte: sinceDate }
                    }
                },
                {
                    $unwind: '$materials'
                },
                {
                    $lookup: {
                        from: 'materials',
                        localField: 'materials.materialId',
                        foreignField: '_id',
                        as: 'materialDetails'
                    }
                },
                {
                    $unwind: '$materialDetails'
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        recyclingVolume: { $sum: "$materials.quantity" },
                        co2Reduced: { $sum: { $multiply: ["$materials.quantity", "$materialDetails.environmentalImpact.co2Reduced"] } },
                        treesSaved: { $sum: { $multiply: ["$materials.quantity", "$materialDetails.environmentalImpact.treesSaved"] } },
                        waterSaved: { $sum: { $multiply: ["$materials.quantity", "$materialDetails.environmentalImpact.waterSaved"] } },
                        energySaved: { $sum: { $multiply: ["$materials.quantity", "$materialDetails.environmentalImpact.energySaved"] } }
                    }
                },
                {
                    $project: {
                        date: "$_id",
                        recyclingVolume: 1,
                        co2Reduced: 1,
                        treesSaved: 1,
                        waterSaved: 1,
                        energySaved: 1
                    }
                },
                {
                    $sort: { date: 1 }
                }
            ]);

            // Fill in missing dates with zero values
            const filledAnalytics = [];
            const dateMap = new Map(analytics.map(a => [a.date, a]));
            const today = new Date();
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                if (dateMap.has(dateStr)) {
                    filledAnalytics.push(dateMap.get(dateStr));
                } else {
                    filledAnalytics.push({
                        date: dateStr,
                        recyclingVolume: 0,
                        co2Reduced: 0,
                        treesSaved: 0,
                        waterSaved: 0,
                        energySaved: 0
                    });
                }
            }
            analytics = filledAnalytics;
        }

        // Get market prices
        const materials = await Material.find();
        const marketPrices = {};
        
        for (const material of materials) {
            const marketPrice = await MarketPrice.findOne({ materialId: material._id });
            if (marketPrice) {
                marketPrices[material.name] = {
                    currentPrice: marketPrice.currentPrice,
                    history: marketPrice.priceHistory
                        .filter(entry => entry.date >= sinceDate)
                        .map(entry => ({
                            date: entry.date.toISOString().split('T')[0],
                            price: entry.price,
                            factors: entry.factors
                        }))
                };
            }
        }

        // Get active users count (only for admin)
        const activeUsers = req.user.role === 'admin' 
            ? await User.countDocuments({ isVerified: true })
            : 1;

        res.json({
            analytics,
            totalPickups: pickups.length,
            activeUsers,
            totalRecyclingVolume,
            totalRevenue,
            totalCO2Reduced,
            totalTreesSaved,
            totalWaterSaved,
            totalEnergySaved,
            marketPrices,
            isAdmin: req.user.role === 'admin'
        });
    } catch (error) {
        console.error('Error in dashboard endpoint:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update analytics (admin only)
router.post('/update', [auth, admin], updateAnalytics);

// Get market prices
router.get('/market-prices', auth, getMarketPrices);

// Get environmental impact
router.get('/environmental-impact', auth, getEnvironmentalImpact);

// Network analysis endpoint
router.get('/network', auth, async (req, res) => {
    try {
        // Get all completed pickups
        const pickups = await Pickup.find({ status: 'completed' })
            .populate('userId', 'name userType location')
            .populate('recyclerId', 'name userType location');

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
                        position: {
                            lat: pickup.userId.location.coordinates[1],
                            lng: pickup.userId.location.coordinates[0]
                        },
                        address: pickup.userId.location.address,
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
                        position: {
                            lat: pickup.recyclerId.location.coordinates[1],
                            lng: pickup.recyclerId.location.coordinates[0]
                        },
                        address: pickup.recyclerId.location.address,
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

        console.log('Network data:', {
            nodesCount: nodes.length,
            edgesCount: edges.length,
            sampleNode: nodes[0],
            sampleEdge: edges[0]
        });

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
        console.log('Admin analytics request received');
        
        // Get timeframe from query parameter, default to 30 days
        const days = parseInt(req.query.days || '30');
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        // Get total pickups and weight
        const pickups = await Pickup.find({ status: 'completed' });
        const totalPickups = pickups.length;
        const totalWeight = pickups.reduce((sum, pickup) => sum + (pickup.totalWeight || 0), 0);
        const totalValue = pickups.reduce((sum, pickup) => sum + (pickup.totalValue || 0), 0);

        // Get user counts
        const totalUsers = await User.countDocuments();
        const activeRecyclers = await User.countDocuments({ 
            userType: 'recycler',
            lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Get user growth data for the specified period
        const userGrowth = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            const count = await User.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            userGrowth.push({
                date: startOfDay.toISOString().split('T')[0],
                count
            });
        }

        // Get top recyclers
        const topRecyclers = await User.aggregate([
            { 
                $match: { 
                    userType: 'recycler',
                    isVerified: true 
                } 
            },
            {
                $lookup: {
                    from: 'pickups',
                    localField: '_id',
                    foreignField: 'recyclerId',
                    as: 'pickups'
                }
            },
            {
                $addFields: {
                    pickupCount: { $size: '$pickups' },
                    totalWeight: {
                        $reduce: {
                            input: '$pickups',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.totalWeight', 0] }] }
                        }
                    },
                    totalValue: {
                        $reduce: {
                            input: '$pickups',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.totalValue', 0] }] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    pickupCount: 1,
                    totalWeight: 1,
                    totalValue: 1
                }
            },
            { $match: { pickupCount: { $gt: 0 } } },
            { $sort: { totalWeight: -1 } },
            { $limit: 5 }
        ]);

        // Get top households
        const topHouseholds = await User.aggregate([
            { 
                $match: { 
                    userType: 'household',
                    isVerified: true 
                } 
            },
            {
                $lookup: {
                    from: 'pickups',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'pickups'
                }
            },
            {
                $addFields: {
                    pickupCount: { $size: '$pickups' },
                    totalWeight: {
                        $reduce: {
                            input: '$pickups',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.totalWeight', 0] }] }
                        }
                    },
                    totalValue: {
                        $reduce: {
                            input: '$pickups',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.totalValue', 0] }] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    pickupCount: 1,
                    totalWeight: 1,
                    totalValue: 1
                }
            },
            { $match: { pickupCount: { $gt: 0 } } },
            { $sort: { totalWeight: -1 } },
            { $limit: 5 }
        ]);

        // Get pickup trends for the specified period
        const pickupTrends = await Pickup.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: sinceDate }
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

        // Get material trends for the specified period
        const materialTrends = {};
        const materials = await Material.find();
        
        for (const material of materials) {
            const trends = await Pickup.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: { $gte: sinceDate },
                        'materials.materialId': material._id
                    }
                },
                {
                    $unwind: '$materials'
                },
                {
                    $match: {
                        'materials.materialId': material._id
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        weight: { $sum: "$materials.quantity" },
                        value: { $sum: { $multiply: ["$materials.quantity", "$materials.priceAtPickup"] } },
                        price: { $avg: "$materials.priceAtPickup" }
                    }
                },
                {
                    $sort: { "_id": 1 }
                },
                {
                    $project: {
                        date: "$_id",
                        weight: 1,
                        value: 1,
                        price: 1,
                        _id: 0
                    }
                }
            ]);

            // Calculate cumulative values
            let cumulativeWeight = 0;
            let cumulativeValue = 0;
            const processedTrends = trends.map(point => {
                cumulativeWeight += point.weight;
                cumulativeValue += point.value;
                return {
                    ...point,
                    cumulativeWeight,
                    cumulativeValue
                };
            });

            // Fill in missing dates with zero values
            const filledTrends = [];
            const dateMap = new Map(processedTrends.map(t => [t.date, t]));
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                if (dateMap.has(dateStr)) {
                    filledTrends.push(dateMap.get(dateStr));
                } else {
                    // For missing dates, use the last known cumulative values
                    const lastPoint = filledTrends[filledTrends.length - 1] || {
                        cumulativeWeight: 0,
                        cumulativeValue: 0,
                        price: material.pricePerKg
                    };
                    
                    filledTrends.push({
                        date: dateStr,
                        weight: 0,
                        value: 0,
                        price: material.pricePerKg,
                        cumulativeWeight: lastPoint.cumulativeWeight,
                        cumulativeValue: lastPoint.cumulativeValue
                    });
                }
            }

            materialTrends[material.name] = filledTrends;
        }

        console.log('Sending admin analytics response with:', {
            userGrowthLength: userGrowth.length,
            topRecyclersLength: topRecyclers.length,
            topHouseholdsLength: topHouseholds.length,
            materialTrendsCount: Object.keys(materialTrends).length,
            timeframe: days
        });

        res.json({
            totalPickups,
            totalWeight,
            totalValue,
            totalUsers,
            activeRecyclers,
            pickupTrends,
            materialDistribution,
            userGrowth,
            topRecyclers,
            topHouseholds,
            materialTrends
        });
    } catch (error) {
        console.error('Error in admin analytics:', error);
        res.status(500).json({ message: 'Error fetching admin analytics' });
    }
});

module.exports = router; 