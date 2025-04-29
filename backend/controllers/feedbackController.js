const Feedback = require('../models/Feedback');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const {
      type,
      rating,
      content,
      category,
      userBehavior
    } = req.body;
    
    const feedback = new Feedback({
      userId: req.user._id,
      type,
      rating,
      content,
      category,
      userBehavior
    });
    
    await feedback.save();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user feedback
const getUserFeedback = async (req, res) => {
  try {
    console.log('User from request:', req.user);
    console.log('User ID:', req.user._id);
    
    const feedback = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback (admin only)
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getUserFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  getFeedbackStats
}; 