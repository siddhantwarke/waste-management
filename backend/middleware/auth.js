const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware called. Token present:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    const user = await User.findById(decoded.id);
    console.log('User found from token:', user ? `User ID: ${user.id}, Role: ${user.role}, Username: ${user.username}` : 'No user found');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid, user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied, no user found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied, required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Alias for roleMiddleware for easier usage
const authorize = roleMiddleware;
const protect = authMiddleware;

module.exports = {
  authMiddleware,
  roleMiddleware,
  protect,
  authorize
};
