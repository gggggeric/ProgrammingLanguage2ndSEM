const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: false // Optional field
  },
  comment: {
    type: String,
    required: [true, 'Comment is required']
  },
  photos: {  // Changed from 'photo' to 'photos' as array
    type: [String],
    default: []
  },
  verifiedPurchase: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
reviewSchema.index({ userId: 1 });
reviewSchema.index({ orderId: 1 }, { unique: true }); // One review per order

module.exports = mongoose.model('Review', reviewSchema);