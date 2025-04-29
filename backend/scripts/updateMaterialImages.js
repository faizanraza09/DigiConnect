const { createApi } = require('unsplash-js');
const mongoose = require('mongoose');
const Material = require('../models/Material');
require('dotenv').config();

// Initialize Unsplash API
const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY
});

// Map of material names to search queries
const materialSearchQueries = {
    'Plastic Bottles': 'recycling plastic bottles',
    'Cardboard': 'recycling cardboard boxes',
    'Newspaper': 'recycling newspaper stack',
    'Glass Bottles': 'recycling glass bottles',
    'Aluminum Cans': 'recycling aluminum cans',
    'Steel Cans': 'recycling steel cans',
    'Electronics': 'electronic waste recycling',
    'Food Waste': 'compost food waste',
    'Plastic Bags': 'recycling plastic bags',
    'Paper': 'recycling paper stack',
    'Metal Scrap': 'metal scrap recycling',
    'Batteries': 'battery recycling',
    'Clothing': 'textile recycling',
    'Wood': 'wood recycling',
    'Tires': 'tire recycling'
};

async function updateMaterialImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all materials
        const materials = await Material.find();
        console.log(`Found ${materials.length} materials to update`);

        // Update each material with an image
        for (const material of materials) {
            const searchQuery = materialSearchQueries[material.name] || `recycling ${material.name.toLowerCase()}`;
            
            try {
                // Search for relevant image
                const result = await unsplash.search.getPhotos({
                    query: searchQuery,
                    perPage: 1,
                    orientation: 'landscape'
                });

                if (result.response && result.response.results.length > 0) {
                    const imageUrl = result.response.results[0].urls.regular;
                    
                    // Update material with image URL
                    await Material.findByIdAndUpdate(material._id, {
                        image: imageUrl
                    });
                    
                    console.log(`Updated image for ${material.name}`);
                } else {
                    console.log(`No image found for ${material.name}`);
                }
            } catch (error) {
                console.error(`Error updating ${material.name}:`, error);
            }
        }

        console.log('Finished updating material images');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the script
updateMaterialImages(); 