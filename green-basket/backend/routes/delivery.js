const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth, requireRole } = require('../middleware/auth');

// Get assigned orders
router.get('/orders', auth, requireRole('delivery'), async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoyId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.put('/orders/:id/status', auth, requireRole('delivery'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, deliveryBoyId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    if (status === 'Delivered') {
      order.paymentStatus = 'Completed';
      order.deliveredAt = new Date();
    }
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
