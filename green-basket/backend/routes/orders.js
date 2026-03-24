const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Auto-assign delivery boy
async function assignDeliveryBoy(orderId) {
  try {
    const deliveryBoy = await User.findOne({ role: 'delivery', isAvailable: true });
    if (deliveryBoy) {
      await Order.findByIdAndUpdate(orderId, {
        deliveryBoyId: deliveryBoy._id,
        deliveryBoyName: deliveryBoy.name,
        orderStatus: 'Assigned'
      });
    }
  } catch (err) {
    console.error('Auto-assign error:', err);
  }
}

// Place order (customer)
router.post('/', auth, requireRole('customer'), async (req, res) => {
  try {
    const { products, address, phone, notes } = req.body;
    if (!products?.length || !address || !phone) {
      return res.status(400).json({ message: 'Products, address and phone required' });
    }

    let totalPrice = 0;
    const orderItems = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        farmerName: product.farmerName,
        farmerId: product.farmerId
      });

      totalPrice += product.price * item.quantity;
      product.quantity -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      customerId: req.user._id,
      customerName: req.user.name,
      products: orderItems,
      totalPrice,
      address,
      phone,
      notes: notes || '',
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending'
    });

    // Auto-assign delivery boy
    await assignDeliveryBoy(order._id);
    
    const updatedOrder = await Order.findById(order._id);
    res.status(201).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customer orders
router.get('/my', auth, requireRole('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get farmer orders (orders containing their products)
router.get('/farmer', auth, requireRole('farmer'), async (req, res) => {
  try {
    const orders = await Order.find({ 'products.farmerId': req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel order (customer)
router.put('/:id/cancel', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.orderStatus === 'Delivered') return res.status(400).json({ message: 'Cannot cancel delivered order' });

    // Restore product quantities
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
    }

    order.orderStatus = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
