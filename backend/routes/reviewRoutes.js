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

    // Validate comment exists
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'Comment is required' });
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

        // Create new review that matches the model
        const review = new Review({
            userId,
            orderId,
            rating,
            title: title || '', // Make title optional
            comment,
            photos: photoUrls, // Now matches the model's photos array
            // verifiedPurchase is automatically true from model defaults
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

// [Keep all your other existing routes...]

module.exports = router;