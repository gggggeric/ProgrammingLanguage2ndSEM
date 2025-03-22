const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User', // The model to which this ObjectId refers
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true, // Remove extra spaces
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Ensure the price is not negative
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetarian', 'non-vegetarian'], // Only allow specific categories
  },
  crust: {
    type: String,
    required: true,
    enum: ['thin', 'thick'], // Only allow specific crust types
  },
  size: {
    type: String,
    required: true,
    enum: ['solo', 'party', 'family'], // Only allow specific sizes
  },
  photo: {
    type: String, // Store the URL or file path of the product photo
    required: true, // Make it required if every product must have a photo
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
});

module.exports = mongoose.model('Product', ProductSchema);