const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// Multer setup
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isAvailable: true, quantity: { $gt: 0 } };
    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get farmer's products
router.get('/my', auth, requireRole('farmer'), async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create product (farmer only)
router.post('/', auth, requireRole('farmer'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, quantity, unit, category } = req.body;
    if (!name || !price || !quantity) return res.status(400).json({ message: 'Name, price, quantity required' });
    
    const product = await Product.create({
      name, description, price: Number(price), quantity: Number(quantity),
      unit: unit || 'kg', category: category || 'vegetables',
      image: req.file ? `/uploads/${req.file.filename}` : '',
      farmerId: req.user._id, farmerName: req.user.name
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update product
router.put('/:id', auth, requireRole('farmer'), upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, quantity, unit, category, isAvailable } = req.body;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (unit) product.unit = unit;
    if (category) product.category = category;
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product
router.delete('/:id', auth, requireRole('farmer'), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, farmerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
