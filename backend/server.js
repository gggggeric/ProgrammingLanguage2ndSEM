require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));

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
app.use('/api/order', require('./routes/orderRoutes')); // Order 
app.use('/api/review', require('./routes/reviewRoutes')); // Order Routes
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));