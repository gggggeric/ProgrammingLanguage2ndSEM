const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { 
        type: String, 
        enum: ['admin', 'user'], // Restrict to 'admin' or 'user'
        default: 'user' // Default to 'user'
    },
    profilePhoto: { type: String, default: "https://res.cloudinary.com/your_cloud_name/image/upload/v1631234567/default_profile.png" },
    address: {
        street: { type: String, default: "" }, // Street address
        city: { type: String, default: "" }, // City
        state: { type: String, default: "" }, // State
        postalCode: { type: String, default: "" }, // Postal code
        country: { type: String, default: "" } // Country
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);