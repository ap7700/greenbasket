const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  price: Number,
  quantity: Number,
  unit: String,
  farmerName: String,
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: String,
  products: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryBoyName: { type: String, default: null },
  orderStatus: { type: String, enum: ['Pending', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);
