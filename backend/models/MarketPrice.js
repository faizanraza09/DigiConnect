const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    supplyLevel: {
        type: Number,
        default: 50, // 0-100, where 0 is oversupply and 100 is undersupply
    },
    demandLevel: {
        type: Number,
        default: 50, // 0-100, where 0 is low demand and 100 is high demand
    },
    priceHistory: [{
        price: Number,
        date: {
            type: Date,
            default: Date.now
        },
        factors: {
            supply: Number,
            demand: Number,
            seasonal: Number
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Calculate new price based on market forces
marketPriceSchema.methods.calculateNewPrice = async function() {
    // Get material to access its market factors
    const material = await mongoose.model('Material').findById(this.materialId);
    if (!material) {
        throw new Error('Material not found');
    }

    // Supply and demand impact with material-specific sensitivity
    const supplyDemandFactor = 1 + (
        ((this.demandLevel - this.supplyLevel) / 100) * 
        ((material.marketFactors.demandSensitivity + material.marketFactors.supplySensitivity) / 2)
    );
    
    // Get seasonal factor from material's seasonal adjustments
    const month = new Date().getMonth().toString();
    const seasonalFactor = material.marketFactors.seasonalAdjustments.get(month) || 1.0;
    
    // Calculate new price with all factors
    const newPrice = this.basePrice * supplyDemandFactor * seasonalFactor;
    
    // Add to price history with all factors
    this.priceHistory.push({
        price: newPrice,
        date: new Date(),
        factors: {
            supply: this.supplyLevel,
            demand: this.demandLevel,
            seasonal: seasonalFactor
        }
    });
    
    // Keep only last 30 days of history
    if (this.priceHistory.length > 30) {
        this.priceHistory.shift();
    }
    
    // Update current price and last updated timestamp
    this.currentPrice = newPrice;
    this.lastUpdated = new Date();
    
    return newPrice;
};

// Update supply level based on recent pickups
marketPriceSchema.methods.updateSupplyLevel = async function() {
    const Pickup = mongoose.model('Pickup');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all pickups in last 30 days (not just completed)
    const allPickups = await Pickup.find({
        'materials.materialId': this.materialId,
        createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Calculate total quantity with status weights
    let totalWeightedQuantity = 0;
    for (const pickup of allPickups) {
        const material = pickup.materials.find(m => m.materialId.toString() === this.materialId.toString());
        if (material) {
            // Weight based on pickup status
            const statusWeights = {
                'completed': 1.0,    // Full weight for completed
                'claimed': 0.8,      // High weight for claimed
                'claim_requested': 0.6, // Medium weight for requested
                'pending': 0.4       // Lower weight for pending
            };
            
            const statusWeight = statusWeights[pickup.status] || 0;
            totalWeightedQuantity += material.quantity * statusWeight;
        }
    }
    
    // Calculate supply level based on weighted quantity
    // Use a scale where 10kg = 50% supply level
    const supplyLevel = totalWeightedQuantity > 0
        ? Math.min(100, (totalWeightedQuantity / 10) * 50) // 10kg = 50% supply
        : 0;
    
    this.supplyLevel = supplyLevel;
};

// Update demand level based on market activity
marketPriceSchema.methods.updateDemandLevel = async function() {
    const Pickup = mongoose.model('Pickup');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all pickups with this material in the last 30 days
    const recentPickups = await Pickup.find({
        'materials.materialId': this.materialId,
        createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Calculate total demand from both claims and completed orders
    let totalWeightedDemand = 0;
    for (const pickup of recentPickups) {
        const material = pickup.materials.find(m => m.materialId.toString() === this.materialId.toString());
        if (material) {
            // Weight based on pickup status
            const statusWeights = {
                'completed': 1.0,    // Full weight for completed (shows actual demand)
                'claimed': 0.8,      // High weight for claimed
                'claim_requested': 0.6, // Medium weight for requested
                'pending': 0       // Lower weight for pending
            };
            
            const statusWeight = statusWeights[pickup.status] || 0;
            totalWeightedDemand += material.quantity * statusWeight;
            
            // Add weight for claim requests
            if (pickup.claimRequests.length > 0) {
                totalWeightedDemand += (material.quantity * 0.2); // Each claim request adds 20% of quantity
            }
        }
    }
    
    // Calculate demand level based on weighted demand
    // Use same scale as supply where 10kg = 50% demand level
    const demandLevel = totalWeightedDemand > 0
        ? Math.min(100, (totalWeightedDemand / 10) * 50) // 10kg = 50% demand
        : 10; // Minimum baseline demand
    
    this.demandLevel = demandLevel;
};

// Update price automatically when pickup is created or completed
marketPriceSchema.statics.updatePriceForPickup = async function(pickup) {
    for (const material of pickup.materials) {
        let marketPrice = await this.findOne({ materialId: material.materialId });
        
        if (!marketPrice) {
            const materialDoc = await mongoose.model('Material').findById(material.materialId);
            marketPrice = new this({
                materialId: material.materialId,
                basePrice: materialDoc.pricePerKg,
                currentPrice: materialDoc.pricePerKg
            });
        }
        
        await marketPrice.updateSupplyLevel();
        await marketPrice.updateDemandLevel();
        await marketPrice.calculateNewPrice();
        await marketPrice.save();
        
        // Update material's current price
        const materialDoc = await mongoose.model('Material').findById(material.materialId);
        materialDoc.pricePerKg = marketPrice.currentPrice;
        await materialDoc.save();
    }
};

module.exports = mongoose.model('MarketPrice', marketPriceSchema); 