const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Register Route
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, profilePhoto, address } = req.body;

        // Ensure name is optional
        name = name || "";

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Handle profile photo upload
        let profilePhotoUrl = "https://res.cloudinary.com/your_cloud_name/image/upload/v1631234567/default_profile.png"; // Default profile picture

        if (profilePhoto) {
            // Upload image to Cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(profilePhoto, {
                folder: 'profile_pictures', // Optional: Organize images in a folder
                transformation: { width: 150, height: 150, crop: 'fill' } // Resize and crop image
            });
            profilePhotoUrl = uploadedResponse.secure_url; // Get the secure URL of the uploaded image
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        user = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            profilePhoto: profilePhotoUrl,
            address: {
                street: address?.street || "",
                city: address?.city || "",
                state: address?.state || "",
                postalCode: address?.postalCode || "",
                country: address?.country || ""
            }
        });
        await user.save();

        res.status(201).json({ message: "User registered successfully", user });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
// Login Route
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Include user details in the response
      res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          userType: user.userType, // Include the user's role
        } 
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;
