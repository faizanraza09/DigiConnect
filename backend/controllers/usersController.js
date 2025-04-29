const User = require('../models/User');
const Pickup = require('../models/Pickup');
const Points = require('../models/Points');

// Get user stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user points and achievements
    const points = await Points.findOne({ userId });
    
    // Get user pickups
    const pickups = await Pickup.find({ userId });
    
    // Calculate total weight
    const totalWeight = pickups.reduce((sum, pickup) => sum + (pickup.weight || 0), 0);
    
    // Calculate average rating
    const ratings = pickups.filter(pickup => pickup.rating).map(pickup => pickup.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    // Get recycling history
    const recyclingHistory = pickups.map(pickup => ({
      type: pickup.type,
      weight: pickup.weight,
      date: pickup.createdAt,
      points: pickup.points || 0
    })).sort((a, b) => b.date - a.date);
    
    res.json({
      level: points?.level || 1,
      points: points?.points || 0,
      referrals: points?.referralCount || 0,
      totalPickups: pickups.length,
      totalWeight,
      rating: averageRating,
      badges: points?.badges || [],
      recyclingHistory
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
};

module.exports = {
  getStats
}; 