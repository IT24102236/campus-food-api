const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import route modules
const studentRoutes = require('./routes/student');
const menuItemRoutes = require('./routes/menuItems');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Check if MONGODB_URI is defined
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Food Ordering API is running',
    endpoints: {
      students: 'POST /students, GET /students, GET /students/:id',
      menuItems: 'POST /menu-items, GET /menu-items, GET /menu-items/search',
      orders: 'POST /orders, GET /orders, GET /orders/:id, PATCH /orders/:id/status, DELETE /orders/:id',
      analytics: 'GET /analytics/total-spent/:studentId, GET /analytics/top-menu-items, GET /analytics/daily-orders'
    }
  });
});

// Attach routes
app.use('/students', studentRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);

// Database connection
console.log('🔄 Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully');
  console.log('📊 Database: campus-food');
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB Atlas connection error:', err.message);
  process.exit(1);
});