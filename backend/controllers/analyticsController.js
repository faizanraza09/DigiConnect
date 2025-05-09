const Analytics = require('../models/Analytics');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Material = require('../models/Material');
const MarketPrice = require('../models/MarketPrice');

// Get analytics dashboard data
const getDashboardData = async (req, res) => {
  try {
    // Base query for pickups
    let pickupQuery = {};
    
    // If user is not admin, only show their data
    if (req.user.role !== 'admin') {
      pickupQuery = req.user.userType === 'household' 
        ? { userId: req.user._id }
        : { recyclerId: req.user._id };
    }

    // Get pickups with populated materials
    const pickups = await Pickup.find(pickupQuery)
      .populate('materials.materialId')
      .sort({ createdAt: -1 });

    // Calculate total recycling volume
    const totalRecyclingVolume = pickups.reduce((sum, pickup) => 
      sum + (pickup.totalWeight || 0), 0);

    // Calculate environmental impact
    const environmentalImpact = pickups.reduce((impact, pickup) => {
      pickup.materials.forEach(material => {
        const quantity = material.quantity || 0;
        const materialData = material.materialId;
        if (materialData) {
          impact.co2Reduced += quantity * materialData.environmentalImpact.co2Reduced;
          impact.treesSaved += quantity * materialData.environmentalImpact.treesSaved;
          impact.waterSaved += quantity * materialData.environmentalImpact.waterSaved;
          impact.energySaved += quantity * materialData.environmentalImpact.energySaved;
        }
      });
      return impact;
    }, { co2Reduced: 0, treesSaved: 0, waterSaved: 0, energySaved: 0 });

    // Get market prices with history
    const materials = await Material.find();
    const marketPrices = {};
    
    for (const material of materials) {
      const marketPrice = await MarketPrice.findOne({ materialId: material._id });
      if (marketPrice) {
        marketPrices[material.name] = {
          currentPrice: marketPrice.currentPrice,
          history: marketPrice.priceHistory.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            price: entry.price,
            factors: {
              supply: entry.factors.supply,
              demand: entry.factors.demand,
              seasonal: entry.factors.seasonal
            }
          }))
        };
      } else {
        marketPrices[material.name] = {
          currentPrice: material.pricePerKg,
          history: [{
            date: new Date().toISOString().split('T')[0],
            price: material.pricePerKg,
            factors: {
              supply: 50,
              demand: 50,
              seasonal: 1.0
            }
          }]
        };
      }
    }

    // Calculate daily recycling volume for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Create a map of all dates in the last 30 days
    const dateMap = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        count: 0,
        value: 0,
        recyclingVolume: 0,
        environmentalImpact: {
          co2Reduced: 0,
          treesSaved: 0,
          waterSaved: 0,
          energySaved: 0
        }
      };
    }

    // Fill in the data for days with pickups
    pickups
      .filter(pickup => pickup.createdAt >= thirtyDaysAgo)
      .forEach(pickup => {
        const date = pickup.createdAt.toISOString().split('T')[0];
        if (dateMap[date]) {
          dateMap[date].count += 1;
          dateMap[date].value += pickup.totalValue || 0;
          dateMap[date].recyclingVolume += pickup.totalWeight || 0;
          
          // Add environmental impact for this pickup
          pickup.materials.forEach(material => {
            const quantity = material.quantity || 0;
            const materialData = material.materialId;
            if (materialData) {
              dateMap[date].environmentalImpact.co2Reduced += quantity * materialData.environmentalImpact.co2Reduced;
              dateMap[date].environmentalImpact.treesSaved += quantity * materialData.environmentalImpact.treesSaved;
              dateMap[date].environmentalImpact.waterSaved += quantity * materialData.environmentalImpact.waterSaved;
              dateMap[date].environmentalImpact.energySaved += quantity * materialData.environmentalImpact.energySaved;
            }
          });
        }
      });

    const analytics = Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Get active users count (only for admin)
    const activeUsers = req.user.role === 'admin' 
      ? await User.countDocuments({ isVerified: true })
      : 1; // For regular users, just show 1 (themselves)

    // Get user growth data for the last 30 days
    const userGrowth = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Calculating user growth from:', today.toISOString());

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      console.log(`Users created on ${startOfDay.toISOString()}: ${count}`);
      
      userGrowth.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Get top recyclers with proper aggregation
    console.log('Fetching top recyclers...');
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

    console.log('Top Recyclers found:', topRecyclers.length);
    console.log('Top Recyclers data:', JSON.stringify(topRecyclers, null, 2));

    // Get top households with proper aggregation
    console.log('Fetching top households...');
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

    console.log('Top Households found:', topHouseholds.length);
    console.log('Top Households data:', JSON.stringify(topHouseholds, null, 2));

    // Verify data before sending response
    const response = {
      analytics,
      totalPickups: pickups.length,
      activeUsers,
      totalRecyclingVolume,
      environmentalImpact,
      marketPrices,
      isAdmin: req.user.role === 'admin',
      userGrowth: userGrowth || [],
      topRecyclers: topRecyclers || [],
      topHouseholds: topHouseholds || []
    };

    console.log('Response data summary:', {
      userGrowthLength: response.userGrowth.length,
      topRecyclersLength: response.topRecyclers.length,
      topHouseholdsLength: response.topHouseholds.length
    });

    res.json(response);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update analytics data
const updateAnalytics = async (req, res) => {
  try {
    const {
      recyclingVolume,
      carbonCredits,
      wasteReduction,
      marketPrices,
      environmentalImpact,
      economicBenefits
    } = req.body;
    
    const analytics = new Analytics({
      recyclingVolume,
      carbonCredits,
      wasteReduction,
      marketPrices,
      environmentalImpact,
      economicBenefits
    });
    
    await analytics.save();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get market prices
const getMarketPrices = async (req, res) => {
    try {
        // Get all materials
        const materials = await Material.find();
        const marketPrices = [];

        // For each material, get or create its market price record
        for (const material of materials) {
            let marketPrice = await MarketPrice.findOne({ materialId: material._id });
            
            if (!marketPrice) {
                // Create new market price record if it doesn't exist
                marketPrice = new MarketPrice({
                    materialId: material._id,
                    basePrice: material.pricePerKg,
                    currentPrice: material.pricePerKg,
                    supplyLevel: 50,
                    demandLevel: 50
                });
                await marketPrice.save();
            }

            // Calculate new price
            const currentPrice = await marketPrice.calculateNewPrice();
            await marketPrice.save();

            marketPrices.push({
                materialId: material._id,
                materialName: material.name,
                basePrice: material.pricePerKg,
                currentPrice: currentPrice,
                supplyLevel: marketPrice.supplyLevel,
                demandLevel: marketPrice.demandLevel,
                lastUpdated: marketPrice.lastUpdated,
                priceHistory: marketPrice.priceHistory.map(entry => ({
                    date: entry.date,
                    price: entry.price,
                    factors: {
                        supply: entry.factors.supply,
                        demand: entry.factors.demand,
                        seasonal: entry.factors.seasonal
                    }
                }))
            });
        }

        res.json(marketPrices);
    } catch (error) {
        console.error('Error fetching market prices:', error);
        res.status(500).json({ message: 'Error fetching market prices' });
    }
};

// Get environmental impact
const getEnvironmentalImpact = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate('materials.materialId');

    const totalImpact = pickups.reduce((impact, pickup) => {
      pickup.materials.forEach(material => {
        const quantity = material.quantity || 0;
        const materialData = material.materialId;
        if (materialData) {
          impact.co2Reduced += quantity * materialData.environmentalImpact.co2Reduced;
          impact.treesSaved += quantity * materialData.environmentalImpact.treesSaved;
          impact.waterSaved += quantity * materialData.environmentalImpact.waterSaved;
          impact.energySaved += quantity * materialData.environmentalImpact.energySaved;
        }
      });
      return impact;
    }, { co2Reduced: 0, treesSaved: 0, waterSaved: 0, energySaved: 0 });
    
    res.json(totalImpact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData,
  updateAnalytics,
  getMarketPrices,
  getEnvironmentalImpact
}; 