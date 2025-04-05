const express = require('express');
const router = express.Router();
const multer = require('multer');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a review for an order
router.post('/create', upload.array('photos', 5), async (req, res) => {
    const { userId, orderId, rating, title, comment } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid orderId' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        // Check if user exists
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the order belongs to this user and is delivered
        const order = await Order.findOne({ 
            _id: orderId,
            userId: userId,
            status: 'delivered' // Only allow reviews for delivered orders
        });
        
        if (!order) {
            return res.status(400).json({ 
                message: 'You can only review orders that have been delivered to you' 
            });
        }
        
        // Check if user already reviewed this order
        const existingReview = await Review.findOne({ orderId: orderId });
        
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this order' });
        }

        // Upload photos to Cloudinary if any
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'review-photos',
                });
                photoUrls.push(result.secure_url);
            }
        }

        // Create new review
        const review = new Review({
            userId,
            orderId,
            rating,
            title,
            comment,
            photos: photoUrls,
            verifiedPurchase: true // Always true for order reviews
        });

        // Save the review
        await review.save();

        // Send response with populated data
        const populatedReview = await Review.findById(review._id)
            .populate('userId', 'name profilePhoto')
            .populate({
                path: 'orderId',
                select: 'createdAt totalAmount items',
                populate: {
                    path: 'items.productId',
                    select: 'name photo'
                }
            });

        res.status(201).json({ 
            message: 'Review created successfully', 
            review: populatedReview 
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all reviews (paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const reviews = await Review.find()
            .populate('userId', 'name profilePhoto')
            .populate({
                path: 'orderId',
                select: 'createdAt totalAmount items',
                populate: {
                    path: 'items.productId',
                    select: 'name photo'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Review.countDocuments();
        
        res.status(200).json({
            reviews,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .populate({
                path: 'orderId',
                select: 'createdAt totalAmount items',
                populate: {
                    path: 'items.productId',
                    select: 'name photo'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get review for a specific order
router.get('/order/:orderId', async (req, res) => {
    try {
        const review = await Review.findOne({ orderId: req.params.orderId })
            .populate('userId', 'name profilePhoto')
            .populate({
                path: 'orderId',
                select: 'createdAt totalAmount items',
                populate: {
                    path: 'items.productId',
                    select: 'name photo'
                }
            });
        
        if (!review) {
            return res.status(404).json({ message: 'No review found for this order' });
        }
        
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a review
router.put('/:reviewId', upload.array('photos', 5), async (req, res) => {
    const { userId, rating, title, comment } = req.body;

    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the user is the author of the review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to update this review' });
        }

        // Handle photo updates
        let photoUrls = review.photos || [];
        if (req.files && req.files.length > 0) {
            // Upload new photos
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'review-photos',
                });
                photoUrls.push(result.secure_url);
            }
        }

        // Update review fields
        review.rating = rating || review.rating;
        review.title = title || review.title;
        review.comment = comment || review.comment;
        review.photos = photoUrls;
        review.updatedAt = new Date();

        await review.save();

        const updatedReview = await Review.findById(review._id)
            .populate('userId', 'name profilePhoto')
            .populate({
                path: 'orderId',
                select: 'createdAt totalAmount items',
                populate: {
                    path: 'items.productId',
                    select: 'name photo'
                }
            });

        res.status(200).json({ 
            message: 'Review updated successfully', 
            review: updatedReview 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
    const { userId } = req.body;

    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the user is the author of the review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this review' });
        }

        // Delete photos from Cloudinary if needed
        // This would require tracking Cloudinary public_ids in your model

        await Review.findByIdAndDelete(req.params.reviewId);
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get review statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Review.aggregate([
            { 
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ]);
        
        res.status(200).json(stats.length > 0 ? stats[0] : {
            averageRating: 0,
            totalReviews: 0,
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            twoStars: 0,
            oneStar: 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;