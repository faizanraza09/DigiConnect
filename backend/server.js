const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
  }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection and index creation
async function initializeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');

        // Create indexes
        const Pickup = require('./models/Pickup');
        await Pickup.collection.createIndex({ location: '2dsphere' });
        console.log('Created 2dsphere index on location field');

        // Verify the index was created
        const indexes = await Pickup.collection.indexes();
        console.log('Current indexes:', indexes);

        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pickups', require('./routes/pickups'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/claim-requests', require('./routes/claimRequests'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server only after database initialization
const PORT = process.env.PORT || 5001;
initializeDatabase().then(success => {
    if (success) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } else {
        console.error('Failed to initialize database. Server not started.');
        process.exit(1);
    }
}); 