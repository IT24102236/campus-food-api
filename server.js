const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use MONGO_URI from .env file
const MONGO_URI = process.env.MONGO_URI;

// Check if connection string exists
if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  console.error('Please add: MONGO_URI=mongodb://localhost:27017/campus-food-db');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Food API is running with Local MongoDB!',
    mongodb_status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Import routes
const studentRoutes = require('./routes/student');
const menuItemRoutes = require('./routes/menuItems');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Use routes
app.use('/students', studentRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);

// Connect to MongoDB
console.log('Connecting to Local MongoDB...');
console.log('Connection:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to Local MongoDB successfully!');
    console.log('Database Name:', mongoose.connection.name);
    console.log(`Server running on http://localhost:${PORT}`);
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check MongoDB Compass can connect');
    console.log('3. Verify MONGO_URI in .env file');
    process.exit(1);
  });
