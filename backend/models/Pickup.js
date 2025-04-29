const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    materials: [{
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        priceAtPickup: {
            type: Number,
            required: true
        }
    }],
    totalWeight: {
        type: Number,
        default: 0
    },
    totalValue: {
        type: Number,
        default: 0
    },
    environmentalImpact: {
        co2Reduced: {
            type: Number,
            default: 0
        },
        waterSaved: {
            type: Number,
            default: 0
        },
        treesSaved: {
            type: Number,
            default: 0
        },
        energySaved: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['pending', 'claim_requested', 'claimed', 'completed', 'cancelled'],
        default: 'pending'
    },
    claimRequests: [{
        recyclerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        message: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    pickupDate: {
        type: Date,
        required: true
    },
    pickupTime: {
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
    notes: String,
    recyclerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate totals before saving
pickupSchema.pre('save', async function (next) {
    try {
        let totalWeight = 0;
        let totalValue = 0;
        let co2Reduced = 0;
        let waterSaved = 0;
        let treesSaved = 0;
        let energySaved = 0;

        // Populate materials to get their details
        await this.populate('materials.materialId');

        // Calculate totals
        for (const item of this.materials) {
            const material = item.materialId;
            const quantity = item.quantity;
            const price = item.priceAtPickup || material.pricePerKg;

            totalWeight += quantity;
            totalValue += quantity * price;
            co2Reduced += quantity * material.environmentalImpact.co2Reduced;
            waterSaved += quantity * material.environmentalImpact.waterSaved;
            treesSaved += quantity * material.environmentalImpact.treesSaved;
            energySaved += quantity * material.environmentalImpact.energySaved;
        }

        // Update totals
        this.totalWeight = totalWeight;
        this.totalValue = totalValue;
        this.environmentalImpact = {
            co2Reduced,
            waterSaved,
            treesSaved,
            energySaved
        };

        next();
    } catch (error) {
        next(error);
    }
});

// Update market prices when pickup is created or completed
pickupSchema.post('save', async function(doc) {
    try {
        const MarketPrice = mongoose.model('MarketPrice');
        await MarketPrice.updatePriceForPickup(doc);
    } catch (error) {
        console.error('Error updating market prices:', error);
    }
});

// Index for geospatial queries
pickupSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pickup', pickupSchema);
