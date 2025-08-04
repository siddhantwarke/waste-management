const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, verifyToken, getCollectorsByCity } = require('../controllers/authController');
const { validateRegister, validateLogin, validateProfileUpdate, handleValidationErrors } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, handleValidationErrors, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authMiddleware, validateProfileUpdate, handleValidationErrors, updateProfile);

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', authMiddleware, verifyToken);

// @route   GET /api/auth/collectors/:city
// @desc    Get collectors by city
// @access  Private
router.get('/collectors/:city', authMiddleware, getCollectorsByCity);

module.exports = router;
