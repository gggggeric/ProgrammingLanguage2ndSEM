const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');


// Helper function to validate URL format
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
};

// Create new order
router.post('/create', async (req, res) => {
  // Manual validation
  const { userId, items, totalAmount, shippingAddress, paymentMethod } = req.body;
  
  // Validate required fields
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user ID'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'At least one item is required'
    });
  }

  // Validate each item
  const itemErrors = [];
  items.forEach((item, index) => {
    if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
      itemErrors.push({
        index,
        field: 'productId',
        message: 'Invalid product ID'
      });
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      itemErrors.push({
        index,
        field: 'quantity',
        message: 'Quantity must be at least 1'
      });
    }
    if (!item.priceAtOrder || typeof item.priceAtOrder !== 'number' || item.priceAtOrder < 0) {
      itemErrors.push({
        index,
        field: 'priceAtOrder',
        message: 'Price must be positive'
      });
    }
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      itemErrors.push({
        index,
        field: 'name',
        message: 'Product name is required'
      });
    }
    if (item.photo && !isValidUrl(item.photo)) {
      itemErrors.push({
        index,
        field: 'photo',
        message: 'Invalid photo URL format'
      });
    }
  });

  if (itemErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid item data',
      errors: itemErrors
    });
  }

  // Validate total amount
  if (!totalAmount || typeof totalAmount !== 'number' || totalAmount < 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Total must be positive'
    });
  }

  // Validate shipping address
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return res.status(400).json({ 
      success: false,
      message: 'Address is required'
    });
  }

  const addressFields = ['street', 'city', 'state', 'postalCode', 'country'];
  const addressErrors = [];
  
  addressFields.forEach(field => {
    if (!shippingAddress[field] || typeof shippingAddress[field] !== 'string' || shippingAddress[field].trim() === '') {
      addressErrors.push({
        field,
        message: `${field} is required`
      });
    }
  });

  if (addressErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address data',
      errors: addressErrors
    });
  }

  // Validate payment method
  const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid payment method'
    });
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify product stock and calculate total
    const outOfStockItems = [];
    const productIds = items.map(item => item.productId);
    let calculatedTotal = 0;
    
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // First pass: verify stock and calculate total
    for (const item of items) {
      const product = productMap[item.productId];
      
      if (!product) {
        outOfStockItems.push({
          productId: item.productId,
          message: 'Product not found'
        });
        continue;
      }
      
      if (product.stock < item.quantity) {
        outOfStockItems.push({
          productId: product._id,
          name: product.name,
          message: 'Insufficient stock',
          available: product.stock,
          requested: item.quantity
        });
        continue;
      }
      
      calculatedTotal += item.priceAtOrder * item.quantity;
    }

    // Verify calculated total matches provided total
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Total amount does not match calculated order total'
      });
    }

    if (outOfStockItems.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Stock issues found',
        errors: outOfStockItems
      });
    }

    // Create items with photos included
    const itemsWithPhotos = items.map(item => {
      const product = productMap[item.productId];
      return {
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        // Use product photo if available, otherwise use the photo sent from frontend
        photo: product?.photo || item.photo || null
      };
    });

    // Create order with photos included in items
    const order = new Order({
      userId,
      items: itemsWithPhotos,
      totalAmount: calculatedTotal,
      shippingAddress,
      paymentMethod,
      status: 'processing'
    });

    const savedOrder = await order.save({ session });
    
    // Update product stock
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      order: savedOrder,
      message: 'Order placed successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Order processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Order processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Get all orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Keep prices as integers (no division by 100)
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      totalAmount: order.totalAmount, // Keep as is
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        _id: item._id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder, // Keep as is
        photo: item.photo,
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod
    }));

    res.json({
      success: true,
      count: orders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// Get order details
router.get('/:orderId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(req.params.orderId)
      .populate('items.productId', 'name imageUrl');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

module.exports = router;