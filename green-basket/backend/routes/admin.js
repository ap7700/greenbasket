const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(auth, requireRole('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, orders, products, revenue] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);
    res.json({
      totalUsers: users,
      totalOrders: orders,
      totalProducts: products,
      totalRevenue: revenue[0]?.total || 0,
      farmers: await User.countDocuments({ role: 'farmer' }),
      customers: await User.countDocuments({ role: 'customer' }),
      deliveryBoys: await User.countDocuments({ role: 'delivery' }),
      pendingOrders: await Order.countDocuments({ orderStatus: 'Pending' }),
      deliveredOrders: await Order.countDocuments({ orderStatus: 'Delivered' })
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) query.role = role;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manually assign delivery boy
router.put('/orders/:id/assign', async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const deliveryBoy = await User.findOne({ _id: deliveryBoyId, role: 'delivery' });
    if (!deliveryBoy) return res.status(404).json({ message: 'Delivery boy not found' });

    const order = await Order.findByIdAndUpdate(req.params.id, {
      deliveryBoyId: deliveryBoy._id,
      deliveryBoyName: deliveryBoy.name,
      orderStatus: 'Assigned'
    }, { new: true });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle delivery boy availability
router.put('/delivery/:id/availability', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'delivery' });
    if (!user) return res.status(404).json({ message: 'Delivery boy not found' });
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
