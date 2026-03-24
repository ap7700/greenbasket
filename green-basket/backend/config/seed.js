const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/greenbasket');
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  // Create users
  const hashedPw = await bcrypt.hash('password123', 10);

  const admin = await User.create({ name: 'Admin User', email: 'admin@greenbasket.com', password: hashedPw, role: 'admin' });
  const farmer1 = await User.create({ name: 'Ramesh Patel', email: 'farmer@greenbasket.com', password: hashedPw, role: 'farmer', phone: '9876543210', address: 'Village Kheda, Gujarat' });
  const farmer2 = await User.create({ name: 'Sunita Devi', email: 'sunita@greenbasket.com', password: hashedPw, role: 'farmer', phone: '9876543211', address: 'Nashik, Maharashtra' });
  const customer = await User.create({ name: 'Priya Sharma', email: 'customer@greenbasket.com', password: hashedPw, role: 'customer', phone: '9876543212', address: '42 MG Road, Bhubaneswar' });
  const delivery = await User.create({ name: 'Arjun Singh', email: 'delivery@greenbasket.com', password: hashedPw, role: 'delivery', phone: '9876543213', isAvailable: true });

  // Create products
  const products = await Product.insertMany([
    { name: 'Fresh Tomatoes', description: 'Organically grown red tomatoes, rich in lycopene', price: 40, quantity: 100, unit: 'kg', category: 'vegetables', farmerId: farmer1._id, farmerName: farmer1.name, image: '' },
    { name: 'Alphonso Mangoes', description: 'Premium Alphonso mangoes from Ratnagiri', price: 350, quantity: 50, unit: 'dozen', category: 'fruits', farmerId: farmer2._id, farmerName: farmer2.name, image: '' },
    { name: 'Basmati Rice', description: 'Long-grain aromatic basmati rice', price: 85, quantity: 200, unit: 'kg', category: 'grains', farmerId: farmer1._id, farmerName: farmer1.name, image: '' },
    { name: 'Spinach', description: 'Fresh green spinach, harvested today', price: 25, quantity: 80, unit: 'bundle', category: 'vegetables', farmerId: farmer2._id, farmerName: farmer2.name, image: '' },
    { name: 'Fresh Milk', description: 'Pure cow milk, delivered fresh daily', price: 60, quantity: 150, unit: 'litre', category: 'dairy', farmerId: farmer1._id, farmerName: farmer1.name, image: '' },
    { name: 'Green Peas', description: 'Fresh green peas, seasonal and sweet', price: 55, quantity: 60, unit: 'kg', category: 'vegetables', farmerId: farmer2._id, farmerName: farmer2.name, image: '' },
    { name: 'Turmeric Powder', description: 'Pure organic turmeric from local farms', price: 120, quantity: 40, unit: 'kg', category: 'herbs', farmerId: farmer1._id, farmerName: farmer1.name, image: '' },
    { name: 'Banana', description: 'Ripe yellow bananas, sweet and nutritious', price: 45, quantity: 120, unit: 'dozen', category: 'fruits', farmerId: farmer2._id, farmerName: farmer2.name, image: '' }
  ]);

  // Create a sample order
  await Order.create({
    customerId: customer._id,
    customerName: customer.name,
    products: [
      { productId: products[0]._id, productName: products[0].name, price: 40, quantity: 2, unit: 'kg', farmerName: farmer1.name, farmerId: farmer1._id },
      { productId: products[3]._id, productName: products[3].name, price: 25, quantity: 3, unit: 'bundle', farmerName: farmer2.name, farmerId: farmer2._id }
    ],
    totalPrice: 155,
    address: '42 MG Road, Bhubaneswar, Odisha',
    phone: '9876543212',
    paymentMethod: 'COD',
    paymentStatus: 'Completed',
    deliveryBoyId: delivery._id,
    deliveryBoyName: delivery.name,
    orderStatus: 'Delivered'
  });

  console.log('✅ Seed data inserted successfully!');
  console.log('\n📋 Demo Accounts (password: password123):');
  console.log('  Admin:    admin@greenbasket.com');
  console.log('  Farmer:   farmer@greenbasket.com');
  console.log('  Customer: customer@greenbasket.com');
  console.log('  Delivery: delivery@greenbasket.com');
  
  await mongoose.disconnect();
}

seed().catch(console.error);
