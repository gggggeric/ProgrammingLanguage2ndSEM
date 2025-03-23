require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());

// Increase the payload size limit for JSON data (e.g., 50MB)
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes')); // Authentication routes

app.use('/api/products', require('./routes/productRoutes')); // Product routes
app.use('/api/admin/products', require('./routes/adminRoutes')); // Product routes
app.use('/api/user', require('./routes/userRoutes')); // Product routes
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));