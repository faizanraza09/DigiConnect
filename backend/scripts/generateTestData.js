const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { createApi } = require('unsplash-js');
const User = require('../models/User');
const Material = require('../models/Material');
const Pickup = require('../models/Pickup');
const MarketPrice = require('../models/MarketPrice');
const Analytics = require('../models/Analytics');
const Feedback = require('../models/Feedback');
require('dotenv').config();

// Initialize Unsplash API
const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY
});

// Map of material names to search queries
const materialSearchQueries = {
    'Plastic Bottles': 'recycling plastic bottles',
    'Cardboard': 'recycling cardboard boxes',
    'Glass Bottles': 'recycling glass bottles',
    'Aluminum Cans': 'recycling aluminum cans'
};

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
});

// Helper function to generate random coordinates within a radius
function generateRandomCoordinates(centerLat, centerLng, radiusKm) {
    const radiusInDegrees = radiusKm / 111.32;
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * radiusInDegrees;
    
    const lat = centerLat + (randomRadius * Math.cos(randomAngle));
    const lng = centerLng + (randomRadius * Math.sin(randomAngle));
    
    return [lng, lat];
}

// Helper function to generate random date within range
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get seasonal factor for a date
function getSeasonalFactor(date) {
    const month = date.getMonth();
    const seasonalFactors = {
        0: 1.2,   // January
        1: 1.1,   // February
        2: 1.0,   // March
        3: 0.9,   // April
        4: 0.8,   // May
        5: 0.9,   // June
        6: 1.0,   // July
        7: 1.1,   // August
        8: 1.2,   // September
        9: 1.3,   // October
        10: 1.2,  // November
        11: 1.1   // December
    };
    return seasonalFactors[month] || 1.0;
}

// Generate test data
async function generateTestData() {
    try {
        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Material.deleteMany({}),
            Pickup.deleteMany({}),
            MarketPrice.deleteMany({}),
            Analytics.deleteMany({}),
            Feedback.deleteMany({})
        ]);

        // Create admin user
        await User.create({
            email: 'admin@recycleconnect.com',
            phoneNumber: '+923001234567',
            userType: 'admin',
            role: 'admin',
            name: 'Admin User',
            password: 'admin123',
            location: {
                type: 'Point',
                coordinates: [67.0822, 24.9056], // Karachi coordinates
                address: 'Gulshan-e-Iqbal, Karachi, Pakistan'
            },
            isVerified: true,
            language: 'en',
            referralCode: 'ADMIN123'
        });

        // Create materials with images
        const materials = [];
        for (const [name, searchQuery] of Object.entries(materialSearchQueries)) {
            try {
                // Search for relevant image
                const result = await unsplash.search.getPhotos({
                    query: searchQuery,
                    perPage: 1,
                    orientation: 'landscape'
                });

                let imageUrl = '';
                if (result.response && result.response.results.length > 0) {
                    imageUrl = result.response.results[0].urls.regular;
                }

                const material = await Material.create({
                    name,
                    category: name.toLowerCase().includes('plastic') ? 'plastic' :
                             name.toLowerCase().includes('cardboard') ? 'paper' :
                             name.toLowerCase().includes('glass') ? 'glass' :
                             name.toLowerCase().includes('aluminum') ? 'metal' : 'other',
                    pricePerKg: name.toLowerCase().includes('plastic') ? 50 :  // Fixed base price PKR 50/kg for plastic
                               name.toLowerCase().includes('cardboard') ? 25 :  // Fixed base price PKR 25/kg for cardboard
                               name.toLowerCase().includes('glass') ? 15 :      // Fixed base price PKR 15/kg for glass
                               name.toLowerCase().includes('aluminum') ? 200 :  // Fixed base price PKR 200/kg for aluminum
                               30,                                             // Fixed default base price PKR 30/kg
                    environmentalImpact: {
                        co2Reduced: name.toLowerCase().includes('plastic') ? 2.1 :
                                  name.toLowerCase().includes('cardboard') ? 1.8 :
                                  name.toLowerCase().includes('glass') ? 1.2 :
                                  name.toLowerCase().includes('aluminum') ? 2.5 : 1.5,
                        waterSaved: name.toLowerCase().includes('plastic') ? 100 :
                                  name.toLowerCase().includes('cardboard') ? 80 :
                                  name.toLowerCase().includes('glass') ? 60 :
                                  name.toLowerCase().includes('aluminum') ? 120 : 70,
                        treesSaved: name.toLowerCase().includes('plastic') ? 0.1 :
                                  name.toLowerCase().includes('cardboard') ? 0.2 :
                                  name.toLowerCase().includes('glass') ? 0.05 :
                                  name.toLowerCase().includes('aluminum') ? 0.15 : 0.1,
                        energySaved: name.toLowerCase().includes('plastic') ? 5.2 :
                                   name.toLowerCase().includes('cardboard') ? 4.5 :
                                   name.toLowerCase().includes('glass') ? 3.8 :
                                   name.toLowerCase().includes('aluminum') ? 6.0 : 4.0
                    },
                    description: `Clean ${name.toLowerCase()}`,
                    image: imageUrl,
                    marketFactors: {
                        seasonalAdjustments: {
                            '0': 1.2,   // January - Higher prices due to winter demand
                            '1': 1.1,   // February
                            '2': 1.0,   // March
                            '3': 0.9,   // April
                            '4': 0.8,   // May - Lower prices due to less demand
                            '5': 0.9,   // June
                            '6': 1.0,   // July
                            '7': 1.1,   // August
                            '8': 1.2,   // September
                            '9': 1.3,   // October - Higher prices due to post-monsoon collection
                            '10': 1.2,  // November
                            '11': 1.1   // December
                        },
                        supplySensitivity: 1.0,
                        demandSensitivity: 1.0
                    }
                });
                materials.push(material);
            } catch (error) {
                console.error(`Error creating material ${name}:`, error);
            }
        }

        // Create users (households and recyclers)
        const users = [];
        const numHouseholds = 50;
        const numRecyclers = 10;

        // Separate households and recyclers for easier access
        let households = [];
        let recyclers = [];

        // Karachi areas for random address generation
        const karachiAreas = [
            { name: 'Gulshan-e-Iqbal', coords: [67.0822, 24.9056] },
            { name: 'Defence Housing Authority', coords: [67.0645, 24.8043] },
            { name: 'North Nazimabad', coords: [67.0529, 24.9359] },
            { name: 'Clifton', coords: [67.0354, 24.8120] },
            { name: 'PECHS', coords: [67.0645, 24.8721] },
            { name: 'Saddar', coords: [67.0288, 24.8608] },
            { name: 'Gulistan-e-Johar', coords: [67.1276, 24.9088] },
            { name: 'Federal B Area', coords: [67.0529, 24.9237] },
            { name: 'Malir', coords: [67.2076, 24.8937] },
            { name: 'Nazimabad', coords: [67.0354, 24.9237] }
        ];

        // Helper function to get random Karachi address
        function getRandomKarachiLocation() {
            const area = karachiAreas[Math.floor(Math.random() * karachiAreas.length)];
            const block = Math.floor(Math.random() * 15) + 1;
            const street = Math.floor(Math.random() * 30) + 1;
            return {
                coordinates: [
                    area.coords[0] + (Math.random() - 0.5) * 0.02,
                    area.coords[1] + (Math.random() - 0.5) * 0.02
                ],
                address: `Block ${block}, Street ${street}, ${area.name}, Karachi, Pakistan`
            };
        }

        // Create households
        for (let i = 0; i < numHouseholds; i++) {
            const location = getRandomKarachiLocation();
            const user = await User.create({
                email: `household${i}@test.com`,
                phoneNumber: `+92${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                userType: 'household',
                name: `Household User ${i}`,
                password: 'password123',
                location: {
                    type: 'Point',
                    coordinates: location.coordinates,
                    address: location.address
                },
                rating: Math.random() * 5,
                totalRatings: Math.floor(Math.random() * 20),
                totalPickups: Math.floor(Math.random() * 30),
                totalWeight: Math.floor(Math.random() * 100),
                isVerified: Math.random() > 0.2,
                language: Math.random() > 0.8 ? 'ur' : 'en'
            });
            users.push(user);
            households.push(user);
        }

        // Create recyclers
        for (let i = 0; i < numRecyclers; i++) {
            const location = getRandomKarachiLocation();
            const user = await User.create({
                email: `recycler${i}@test.com`,
                phoneNumber: `+92${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                userType: 'recycler',
                name: `Recycler ${i}`,
                password: 'password123',
                location: {
                    type: 'Point',
                    coordinates: location.coordinates,
                    address: location.address
                },
                rating: Math.random() * 5,
                totalRatings: Math.floor(Math.random() * 50),
                totalPickups: Math.floor(Math.random() * 100),
                totalWeight: Math.floor(Math.random() * 500),
                isVerified: true,
                language: Math.random() > 0.8 ? 'ur' : 'en'
            });
            users.push(user);
            recyclers.push(user);
        }

        // Initialize market prices for each material
        for (const material of materials) {
            try {
                // Create initial market price
                const marketPrice = await MarketPrice.create({
                    materialId: material._id,
                    basePrice: material.pricePerKg,
                    currentPrice: material.pricePerKg,
                    supplyLevel: 50,
                    demandLevel: 50,
                    priceHistory: [{
                        price: material.pricePerKg,
                        date: new Date(),
                        factors: {
                            supply: 50,
                            demand: 50,
                            seasonal: 1.0
                        }
                    }]
                });

                // Generate pickups to create realistic price history
                const startDate = new Date(2024, 0, 1); // January 1, 2024
                const endDate = new Date();
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                // Generate 2-3 pickups per week for this material
                const pickupsPerWeek = Math.floor(Math.random() * 2) + 2;
                const totalPickups = Math.floor((days / 7) * pickupsPerWeek);
                
                for (let i = 0; i < totalPickups; i++) {
                    const pickupDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                    
                    // Create a pickup with this material
                    const pickup = await Pickup.create({
                        userId: households[Math.floor(Math.random() * households.length)]._id,
                        materials: [{
                            materialId: material._id,
                            quantity: Math.random() * 10 + 1, // 1-11 kg
                            priceAtPickup: marketPrice.currentPrice
                        }],
                        status: Math.random() > 0.3 ? 'completed' : 
                               Math.random() > 0.5 ? 'claimed' : 
                               Math.random() > 0.7 ? 'claim_requested' : 'pending',
                        pickupDate,
                        createdAt: pickupDate,
                        pickupTime: `${Math.floor(Math.random() * 12) + 8}:00`,
                        location: getRandomKarachiLocation(),
                        recyclerId: Math.random() > 0.3 ? recyclers[Math.floor(Math.random() * recyclers.length)]._id : null,
                        rating: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : null,
                        review: Math.random() > 0.7 ? `Great service! ${i}` : null
                    });

                    // Update market price based on the pickup
                    await MarketPrice.updatePriceForPickup(pickup);
                }
            } catch (error) {
                console.error(`Error creating market price for material ${material.name}:`, error);
            }
        }

        // Create pickups
        const numPickups = 200;

        for (let i = 0; i < numPickups; i++) {
            const household = households[Math.floor(Math.random() * households.length)];
            const recycler = recyclers[Math.floor(Math.random() * recyclers.length)];
            
            // Generate a random date between Jan 1, 2024 and now
            const startDate = new Date(2024, 0, 1);
            const endDate = new Date();
            const pickupDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            
            const pickupMaterials = [];
            const numMaterials = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < numMaterials; j++) {
                const material = materials[Math.floor(Math.random() * materials.length)];
                const month = pickupDate.getMonth().toString();
                const seasonalFactor = material.marketFactors.seasonalAdjustments[month] || 1.0;
                pickupMaterials.push({
                    materialId: material._id,
                    quantity: Math.random() * 10 + 1,
                    priceAtPickup: material.pricePerKg * seasonalFactor
                });
            }

            const status = Math.random() > 0.3 ? 'completed' : 
                          Math.random() > 0.5 ? 'claimed' : 
                          Math.random() > 0.7 ? 'claim_requested' : 'pending';

            const location = getRandomKarachiLocation();

            const pickup = await Pickup.create({
                userId: household._id,
                materials: pickupMaterials,
                status,
                pickupDate,
                createdAt: pickupDate, // Set createdAt to match pickupDate
                pickupTime: `${Math.floor(Math.random() * 12) + 8}:00`,
                location: {
                    type: 'Point',
                    coordinates: location.coordinates,
                    address: location.address
                },
                recyclerId: status !== 'pending' ? recycler._id : null,
                rating: status === 'completed' ? Math.floor(Math.random() * 5) + 1 : null,
                review: status === 'completed' ? `Great service! ${i}` : null
            });

            // Update market prices based on the pickup
            if (status === 'completed') {
                for (const material of pickupMaterials) {
                    const marketPrice = await MarketPrice.findOne({ materialId: material.materialId });
                    if (marketPrice) {
                        // Update supply level (increase as more material is recycled)
                        marketPrice.supplyLevel = Math.min(100, marketPrice.supplyLevel + (material.quantity * 2));
                        
                        // Update demand level (slightly decrease as supply increases)
                        marketPrice.demandLevel = Math.max(10, marketPrice.demandLevel - (material.quantity * 0.5));
                        
                        // Get material to access its market factors
                        const materialDoc = await Material.findById(material.materialId);
                        const month = pickupDate.getMonth().toString();
                        const seasonalFactor = materialDoc.marketFactors.seasonalAdjustments[month] || 1.0;
                        
                        // Calculate new price with all factors
                        const supplyDemandFactor = 1 + (
                            (marketPrice.demandLevel - marketPrice.supplyLevel) / 200 * 
                            (materialDoc.marketFactors.demandSensitivity + materialDoc.marketFactors.supplySensitivity) / 2
                        );
                        
                        const newPrice = marketPrice.basePrice * supplyDemandFactor * seasonalFactor;
                        
                        // Add to price history with the pickup date
                        marketPrice.priceHistory.push({
                            price: newPrice,
                            date: pickupDate,
                            factors: {
                                supply: marketPrice.supplyLevel,
                                demand: marketPrice.demandLevel,
                                seasonal: seasonalFactor
                            }
                        });
                        
                        // Keep only last 30 days of history
                        if (marketPrice.priceHistory.length > 30) {
                            marketPrice.priceHistory.shift();
                        }
                        
                        marketPrice.currentPrice = newPrice;
                        marketPrice.lastUpdated = pickupDate;
                        await marketPrice.save();
                        
                        // Update material's current price
                        materialDoc.pricePerKg = newPrice;
                        await materialDoc.save();
                    }
                }
            }
        }

        // Create analytics data
        const startDate = new Date(2024, 0, 1);
        const endDate = new Date();
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const month = date.getMonth().toString();
            
            // Get seasonal factors for each material type
            const plasticMaterial = materials.find(m => m.name.toLowerCase().includes('plastic'));
            const paperMaterial = materials.find(m => m.name.toLowerCase().includes('cardboard'));
            const glassMaterial = materials.find(m => m.name.toLowerCase().includes('glass'));
            const metalMaterial = materials.find(m => m.name.toLowerCase().includes('aluminum'));
            
            const plasticSeasonalFactor = plasticMaterial ? plasticMaterial.marketFactors.seasonalAdjustments[month] || 1.0 : 1.0;
            const paperSeasonalFactor = paperMaterial ? paperMaterial.marketFactors.seasonalAdjustments[month] || 1.0 : 1.0;
            const glassSeasonalFactor = glassMaterial ? glassMaterial.marketFactors.seasonalAdjustments[month] || 1.0 : 1.0;
            const metalSeasonalFactor = metalMaterial ? metalMaterial.marketFactors.seasonalAdjustments[month] || 1.0 : 1.0;
            
            await Analytics.create({
                date,
                recyclingVolume: Math.random() * 1000 + 500,
                carbonCredits: Math.random() * 500 + 200,
                wasteReduction: Math.random() * 800 + 300,
                marketPrices: {
                    plastic: (50 * plasticSeasonalFactor),  // Base price * seasonal factor
                    paper: (25 * paperSeasonalFactor),
                    glass: (15 * glassSeasonalFactor),
                    metal: (200 * metalSeasonalFactor)
                },
                networkGrowth: {
                    newUsers: Math.floor(Math.random() * 10) + 1,
                    activeUsers: Math.floor(Math.random() * 50) + 20,
                    totalPickups: Math.floor(Math.random() * 30) + 10
                },
                environmentalImpact: {
                    co2Reduced: Math.random() * 1000 + 500,
                    treesSaved: Math.random() * 100 + 50,
                    waterSaved: Math.random() * 5000 + 2000
                },
                economicBenefits: {
                    totalValue: Math.random() * 5000 + 2000,
                    userEarnings: Math.random() * 2000 + 1000,
                    communityBenefits: Math.random() * 3000 + 1500
                }
            });
        }

        // Create feedback
        const feedbackTypes = ['survey', 'feedback', 'complaint', 'suggestion'];
        const categories = ['service', 'app', 'pickup', 'recycling', 'other'];
        const numFeedback = 100;

        for (let i = 0; i < numFeedback; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            await Feedback.create({
                userId: user._id,
                type: feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)],
                rating: Math.floor(Math.random() * 5) + 1,
                content: `Test feedback ${i} for the recycling platform.`,
                category: categories[Math.floor(Math.random() * categories.length)],
                userBehavior: {
                    recyclingFrequency: ['weekly', 'bi-weekly', 'monthly'][Math.floor(Math.random() * 3)],
                    preferredPickupTimes: ['morning', 'afternoon', 'evening'].slice(0, Math.floor(Math.random() * 3) + 1),
                    recyclingTypes: ['plastic', 'paper', 'glass', 'metal'].slice(0, Math.floor(Math.random() * 4) + 1)
                },
                status: ['pending', 'reviewed', 'resolved'][Math.floor(Math.random() * 3)]
            });
        }

        console.log('Test data generated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error generating test data:', error);
        process.exit(1);
    }
}

generateTestData(); 