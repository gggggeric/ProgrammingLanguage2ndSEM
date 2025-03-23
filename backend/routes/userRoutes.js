const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const cloudinary = require('cloudinary').v2; // Import Cloudinary
const { body, validationResult } = require('express-validator'); // For input validation
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Route to update user profile by userId
router.put('/edit-profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, address, profilePhoto } = req.body;
  
    console.log('Received Payload:', req.body); // Log the received payload
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update user fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (address) {
        user.address = { ...user.address, ...address };
      }
  
      // Handle profile photo upload (if provided)
      if (profilePhoto) {
        console.log('Uploading profile photo to Cloudinary...');
        const uploadedResponse = await cloudinary.uploader.upload(profilePhoto, {
          folder: 'profile_pictures',
          transformation: { width: 150, height: 150, crop: 'fill' },
        });
        console.log('Cloudinary Upload Response:', uploadedResponse); // Log Cloudinary response
        user.profilePhoto = uploadedResponse.secure_url;
      }
  
      await user.save();
      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
// Route to get user profile by userId
router.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId).select('name email address profilePhoto');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
    
      res.status(200).json({ user }); // Ensure this is the response
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

module.exports = router;