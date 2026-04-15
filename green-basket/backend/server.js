const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// app.post("/login", (req, res) => {
//   const { email, password } = req.body;

//   if (email === "admin@greenbasket.com" && password === "admin123") {
//     return res.json({ message: "Admin login successful" });
//   }

//   res.status(401).json({ message: "Invalid email or password" });
// });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/delivery', require('./routes/delivery'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Green Basket API Running' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/greenbasket')
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB Error:', err));
