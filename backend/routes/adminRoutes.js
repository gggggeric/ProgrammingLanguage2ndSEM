const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
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


// Update order status
router.patch('/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status, userId } = req.body; // Expect userId to verify admin

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }

    // Validate userId (replace with your actual admin verification)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate status
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        // Find and update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ 
            message: 'Order status updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Get orders for admin's products
router.get('/orders', async (req, res) => {
    try {
      // 1. Verify admin from token (handled in auth middleware)
      const adminId = req.user.id; // From auth middleware
      
      // 2. Find admin's products
      const adminProducts = await Product.find({ userId: adminId });
      const productIds = adminProducts.map(p => p._id);
      
      // 3. Find orders containing these products
      const orders = await Order.find({
        'items.productId': { $in: productIds }
      })
      .populate('userId', 'name email')
      .populate('items.productId', 'name price photo')
      .sort({ createdAt: -1 });
  
      // 4. Calculate admin-specific totals
      const processedOrders = orders.map(order => {
        const adminItems = order.items.filter(item => 
          productIds.some(id => id.equals(item.productId))
        );
        
        const adminTotal = adminItems.reduce(
          (sum, item) => sum + (item.priceAtOrder * item.quantity), 0
        );
        
        return {
          ...order.toObject(),
          items: adminItems,
          adminTotal
        };
      });
  
      res.json(processedOrders);
    } catch (error) {
      console.error('Admin orders error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch orders',
        error: error.message 
      });
    }
  });

// Get all orders
router.get('/', async (req, res) => {
    try {
      // Get pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Get filter parameters
      const filters = {};
      
      // Filter by status if provided
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      // Filter by user if provided
      if (req.query.userId) {
        filters.userId = req.query.userId;
      }
      
      // Filter by date range if provided
      if (req.query.startDate) {
        filters.createdAt = { $gte: new Date(req.query.startDate) };
      }
      
      if (req.query.endDate) {
        filters.createdAt = { 
          ...filters.createdAt, 
          $lte: new Date(req.query.endDate) 
        };
      }
      
      // Get sort parameters
      const sortField = req.query.sortBy || 'createdAt';
      const sortDirection = req.query.sortOrder === 'asc' ? 1 : -1;
      const sortOptions = {};
      sortOptions[sortField] = sortDirection;
      
      // Get total count for pagination
      const total = await Order.countDocuments(filters);
      
      // Fetch orders
      const orders = await Order.find(filters)
        .populate('userId', 'name email')
        .populate('items.productId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
      
      res.json({
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  


  router.get('/orders/:adminId', async (req, res) => {
    try {
        const adminId = req.params.adminId;

        // 1. Verify the user is an admin
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        if (admin.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. User is not an admin',
                userType: admin.userType
            });
        }

        // 2. Get all products created by this admin
        const products = await Product.find({ userId: adminId });
        if (!products || products.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No products found for this admin',
                admin: { id: admin._id, name: admin.name, email: admin.email },
                products: []
            });
        }

        const productIds = products.map(p => p._id);

        // 3. Find orders containing these products
        const orders = await Order.find({
            'items.productId': { $in: productIds }
        })
            .populate('userId', 'name email address')
            .populate({
                path: 'items.productId',
                select: 'name price photo userId',
                match: { userId: adminId }
            });

        // Filter out orders with no valid products
        const validOrders = orders.filter(order => 
            order.items.some(item => item.productId)
        );

        if (validOrders.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No orders found for your products',
                admin: { id: admin._id, name: admin.name, email: admin.email },
                products: products.map(p => ({
                    productId: p._id,
                    productName: p.name,
                    productPrice: p.price,
                    productPhoto: p.photo,
                    orders: []
                }))
            });
        }

        // 4. Format the response
        const formattedResponse = products.map(product => {
            const productOrders = validOrders.filter(order => 
                order.items.some(item => 
                    item.productId && item.productId._id.equals(product._id)
                )
            );

            return {
                productId: product._id,
                productName: product.name,
                productPrice: product.price,
                productPhoto: product.photo,
                orders: productOrders.map(order => ({
                    orderId: order._id,
                    customer: {
                        id: order.userId._id,
                        name: order.userId.name,
                        email: order.userId.email,
                        address: order.userId.address
                    },
                    items: order.items
                        .filter(item => item.productId && item.productId._id.equals(product._id))
                        .map(item => ({
                            productId: item.productId._id,
                            name: item.name,
                            quantity: item.quantity,
                            priceAtOrder: item.priceAtOrder,
                            photo: item.photo
                        })),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    createdAt: order.createdAt,
                    shippingAddress: order.shippingAddress,
                    paymentMethod: order.paymentMethod
                }))
            };
        });

        res.status(200).json({
            success: true,
            admin: { id: admin._id, name: admin.name, email: admin.email },
            products: formattedResponse
        });

    } catch (error) {
        console.error('Error in admin orders route:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders',
            error: error.message
        });
    }
});


// Update Order Status
router.put('/ordersUpdate/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        // Validate status input
        const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: processing, shipped, delivered, cancelled'
            });
        }

        // Verify admin privileges
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await User.findById(decoded.id);
        
        if (!admin || admin.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin users can update order status'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify the order contains products from this admin
        const adminProducts = await Product.find({ userId: admin._id });
        const adminProductIds = adminProducts.map(p => p._id.toString());
        
        const orderContainsAdminProducts = order.items.some(item => 
            adminProductIds.includes(item.productId.toString())
        );

        if (!orderContainsAdminProducts) {
            return res.status(403).json({
                success: false,
                message: 'You can only update orders containing your products'
            });
        }

        // Update the status
        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: {
                _id: order._id,
                status: order.status,
                updatedAt: order.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while updating order status',
            error: error.message
        });
    }
});



// Add this to reviewRoutes.js
router.get('/product-owner/:ownerId', async (req, res) => {
    try {
      const reviews = await Review.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
          }
        },
        { $unwind: '$order' },
        {
          $lookup: {
            from: 'products',
            localField: 'order.items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $match: {
            'product.userId': mongoose.Types.ObjectId(req.params.ownerId)
          }
        },
        {
          $project: {
            rating: 1,
            title: 1,
            comment: 1,
            photos: 1,
            createdAt: 1,
            'customer': '$userId',
            'product': {
              _id: '$product._id',
              name: '$product.name',
              photo: '$product.photo'
            }
          }
        }
      ]).exec();
  
      // Additional population if needed
      const populatedReviews = await Review.populate(reviews, {
        path: 'customer',
        select: 'name profilePhoto'
      });
  
      res.status(200).json({ reviews: populatedReviews });
    } catch (error) {
      console.error('Error fetching product owner reviews:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
module.exports = router;