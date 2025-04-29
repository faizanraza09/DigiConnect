const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    userType: {
        type: String,
        enum: ['household', 'recycler', 'admin'],
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    rating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    referrals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    totalPickups: {
        type: Number,
        default: 0
    },
    totalWeight: {
        type: Number,
        default: 0
    },
    recyclingHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pickup'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        enum: ['en', 'ur'],
        default: 'en'
    },
    achievements: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String,
        unique: true
    }
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Generate referral code before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') && !this.isNew) return next();
    
    try {
        if (this.isNew) {
            // Generate referral code
            this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 