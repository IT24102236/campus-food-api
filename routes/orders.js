const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Student = require('../models/Student');
const router = express.Router();

// Helper: calculate totalPrice from items
async function calculateTotalPrice(items) {
  const menuItemIds = items.map(item => item.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
  
  const priceMap = {};
  menuItems.forEach(item => {
    priceMap[item._id.toString()] = item.price;
  });
  
  let total = 0;
  for (const item of items) {
    const price = priceMap[item.menuItem.toString()];
    if (!price) {
      throw new Error(`Invalid menu item ID: ${item.menuItem}`);
    }
    total += price * item.quantity;
  }
  return total;
}

// POST /orders - place order
router.post('/', async (req, res) => {
  try {
    const { student, items } = req.body;
    
    // Validate student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }
    
    // Calculate total price
    const totalPrice = await calculateTotalPrice(items);
    
    // Create order
    const order = new Order({
      student,
      items,
      totalPrice,
      status: 'PLACED'
    });
    
    const savedOrder = await order.save();
    
    // Fetch populated order
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('student')
      .populate('items.menuItem');
    
    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /orders - list orders with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('student')
      .populate('items.menuItem')
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments();
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /orders/:id – get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student')
      .populate('items.menuItem');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

// PATCH /orders/:id/status – update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['PLACED', 'PREPARING', 'DELIVERED', 'CANCELLED'];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('student')
      .populate('items.menuItem');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /orders/:id – delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err.message);
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

module.exports = router;