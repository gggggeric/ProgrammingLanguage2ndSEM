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

// Create a product
router.post('/create', upload.single('photo'), async (req, res) => {
    const { userId, name, description, price, category, crust, size, quantity } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
    }

    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate quantity (optional, but recommended)
    if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
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
            quantity, // Add the quantity field
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

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a product
router.put('/:id', upload.single('photo'), async (req, res) => {
    try {
        const { name, description, price, category, crust, size, quantity } = req.body;
        const updateData = { name, description, price, category, crust, size, quantity };

        // If a new photo is uploaded, update it in Cloudinary and get the new URL
        if (req.file) {
            // First, get the current product to potentially delete the old image from Cloudinary
            const currentProduct = await Product.findById(req.params.id);
            
            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
            });
            
            // Add new photo URL to update data
            updateData.photo = result.secure_url;

            // Optional: Delete the old image from Cloudinary
            if (currentProduct.photo) {
                const publicId = currentProduct.photo.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`products/${publicId}`);
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        // First find the product to get the photo URL
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If the product has a photo, delete it from Cloudinary
        if (product.photo) {
            const publicId = product.photo.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
        }

        // Then delete the product from the database
        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;