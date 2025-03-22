const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product'); // Adjust the path to your Product model
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

router.post('/create', upload.single('photo'), async (req, res) => {
    const { userId, name, description, price, category, crust, size } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
    }

    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products', // Optional: Organize images in a folder
        });

        // Create new product with data from request and Cloudinary URL
        const product = new Product({
            userId,
            name,
            description,
            price,
            category,
            crust,
            size,
            photo: result.secure_url, // Cloudinary URL
        });

        // Save the product to the database
        await product.save();

        // Send response
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;