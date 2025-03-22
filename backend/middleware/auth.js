const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // Get the token from the request header
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID to the request object
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = auth;