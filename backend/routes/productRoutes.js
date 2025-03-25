const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Import the Product model

// Route to fetch all products
router.get('/products', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();

    // Map the products to include the _id field as a plain string
    const formattedProducts = products.map(product => ({
      ...product.toObject(), // Convert Mongoose document to a plain JavaScript object
      _id: product._id.toString(), // Return _id as a plain string
    }));

    // Send the formatted products as a response
    res.status(200).json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});


// Enhanced filter endpoint with dynamic price range and better search
router.get('/filter', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    
    // Build the filter object
    const filter = {};
    
    // Improved text search (name OR description with better matching)
    if (search) {
      // Split search terms and create regex patterns for each word
      const searchTerms = search.split(' ').filter(term => term.length > 0);
      const searchPatterns = searchTerms.map(term => ({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } }
        ]
      }));
      
      // Combine patterns with $and to require all terms to match
      filter.$and = searchPatterns;
    }
    
    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    // Get dynamic price range if not specified
    let actualMinPrice = minPrice ? Number(minPrice) : 0;
    let actualMaxPrice = maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER;
    
    // If no price range specified, get min/max from database
    if (!minPrice && !maxPrice) {
      const priceStats = await Product.aggregate([
        { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }
      ]);
      
      if (priceStats.length > 0) {
        actualMinPrice = priceStats[0].min;
        actualMaxPrice = priceStats[0].max;
      }
    }
    
    // Apply price filter
    filter.price = {
      $gte: actualMinPrice,
      $lte: actualMaxPrice
    };
    
    // Execute the query
    const products = await Product.find(filter)
      .select('name description price category photo crust size')
      .sort({ price: 1 });
    
    res.json({
      success: true,
      count: products.length,
      products,
      priceRange: {
        min: actualMinPrice,
        max: actualMaxPrice
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Get categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);
    
    // Add "All" category with total count
    const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);
    categories.unshift({ name: "All", count: totalCount });
    
    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});
module.exports = router;