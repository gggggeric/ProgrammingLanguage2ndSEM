const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // Ensure name is optional
        name = name || ""; // If name is undefined, set it to an empty string

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });

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
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Ensure JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in environment variables");
            return res.status(500).json({ message: "Server error: JWT not configured" });
        }

        // Generate Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
