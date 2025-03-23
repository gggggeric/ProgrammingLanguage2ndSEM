const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Import the Product model

// Route to fetch all products
router.get('/products', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();

    // Send the products as a response
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

module.exports = router;