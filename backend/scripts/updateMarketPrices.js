const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const Material = require('../models/Material');
const Pickup = require('../models/Pickup');
require('dotenv').config();

async function updateMarketPrices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all materials
        const materials = await Material.find();
        console.log(`Found ${materials.length} materials to update`);

        // Update prices for each material
        for (const material of materials) {
            let marketPrice = await MarketPrice.findOne({ materialId: material._id });
            
            // Create new market price if doesn't exist
            if (!marketPrice) {
                marketPrice = new MarketPrice({
                    materialId: material._id,
                    basePrice: material.pricePerKg,
                    currentPrice: material.pricePerKg
                });
            }

            // Update market factors
            await marketPrice.updateSupplyLevel();
            await marketPrice.updateDemandLevel();
            marketPrice.updateSeasonalFactor();

            // Calculate new price
            const newPrice = marketPrice.calculateNewPrice();
            console.log(`Updated price for ${material.name}: $${newPrice.toFixed(2)}`);
            console.log(`Factors: Supply=${marketPrice.supplyLevel}, Demand=${marketPrice.demandLevel}, Seasonal=${marketPrice.seasonalFactor}`);

            // Update material's price
            material.pricePerKg = newPrice;
            await material.save();
        }

        console.log('Finished updating market prices');
    } catch (error) {
        console.error('Error updating market prices:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the script
updateMarketPrices(); 