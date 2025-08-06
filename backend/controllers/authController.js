const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT configuration error');
  }
  console.log('Generating token for user ID:', id);
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { 
      username, email, password, role, first_name, last_name, phone, address, 
      country, state, city, collector_group_name, e_waste_price,
      plastic_price, organic_price, paper_price, metal_price, glass_price,
      hazardous_price, mixed_price
    } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      first_name,
      last_name,
      phone,
      address: address || null,
      country: country || null,
      state: state || null,
      city: city || null,
      collector_group_name: role === 'collector' ? collector_group_name : null,
      e_waste_price: role === 'collector' ? e_waste_price : null,
      plastic_price: role === 'collector' ? plastic_price : null,
      organic_price: role === 'collector' ? organic_price : null,
      paper_price: role === 'collector' ? paper_price : null,
      metal_price: role === 'collector' ? metal_price : null,
      glass_price: role === 'collector' ? glass_price : null,
      hazardous_price: role === 'collector' ? hazardous_price : null,
      mixed_price: role === 'collector' ? mixed_price : null
    };

    const newUser = await User.create(userData);

    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        address: newUser.address,
        country: newUser.country,
        state: newUser.state,
        city: newUser.city,
        collector_group_name: newUser.collector_group_name,
        e_waste_price: newUser.e_waste_price,
        plastic_price: newUser.plastic_price,
        organic_price: newUser.organic_price,
        paper_price: newUser.paper_price,
        metal_price: newUser.metal_price,
        glass_price: newUser.glass_price,
        hazardous_price: newUser.hazardous_price,
        mixed_price: newUser.mixed_price
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password valid for user:', email);

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id);
    console.log('Token generated for user:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
        country: user.country,
        state: user.state,
        city: user.city
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
        country: user.country,
        state: user.state,
        city: user.city,
        collector_group_name: user.collector_group_name,
        e_waste_price: user.e_waste_price,
        plastic_price: user.plastic_price,
        organic_price: user.organic_price,
        paper_price: user.paper_price,
        metal_price: user.metal_price,
        glass_price: user.glass_price,
        hazardous_price: user.hazardous_price,
        mixed_price: user.mixed_price,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      first_name, last_name, phone, address, country, state, city,
      // Collector-specific fields
      collector_group_name, e_waste_price, plastic_price, organic_price,
      paper_price, metal_price, glass_price, hazardous_price, mixed_price 
    } = req.body;

    console.log('Profile update request for user ID:', userId);
    console.log('Profile data:', req.body);

    // Update user information
    const updatedUser = await User.updateProfile(userId, {
      first_name,
      last_name, 
      phone,
      address,
      country,
      state,
      city,
      // Include collector-specific fields
      collector_group_name,
      e_waste_price,
      plastic_price,
      organic_price,
      paper_price,
      metal_price,
      glass_price,
      hazardous_price,
      mixed_price
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Profile updated successfully for user:', userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        collector_group_name: updatedUser.collector_group_name,
        e_waste_price: updatedUser.e_waste_price,
        plastic_price: updatedUser.plastic_price,
        organic_price: updatedUser.organic_price,
        paper_price: updatedUser.paper_price,
        metal_price: updatedUser.metal_price,
        glass_price: updatedUser.glass_price,
        hazardous_price: updatedUser.hazardous_price,
        mixed_price: updatedUser.mixed_price,
        created_at: updatedUser.created_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify token (for frontend token validation)
const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        phone: req.user.phone,
        address: req.user.address,
        country: req.user.country,
        state: req.user.state,
        city: req.user.city
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};

// Get all collectors (without city filtering)
const getAllCollectors = async (req, res) => {
  try {
    console.log('Getting all collectors');
    
    // Get all collectors
    const allCollectors = await User.getAllByRole('collector');
    const collectors = [];
    
    for (const collector of allCollectors) {
      // Get full profile including prices
      const fullProfile = await User.findById(collector.id);
      if (fullProfile) {
        collectors.push(fullProfile);
      }
    }
    
    console.log(`Found ${collectors.length} total collectors`);

    res.status(200).json({
      success: true,
      collectors,
      message: `Found ${collectors.length} collectors`
    });
  } catch (error) {
    console.error('Get all collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching collectors'
    });
  }
};

// Get collectors by city
const getCollectorsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    // Convert city to lowercase for case-insensitive matching
    const cityLower = city.toLowerCase();
    
    console.log(`Getting collectors for city: ${city} (normalized: ${cityLower})`);
    
    // Get all collectors and filter by city (case insensitive)
    const allCollectors = await User.getAllByRole('collector');
    const collectors = [];
    
    for (const collector of allCollectors) {
      if (collector.city && collector.city.toLowerCase() === cityLower) {
        // Get full profile including prices
        const fullProfile = await User.findById(collector.id);
        if (fullProfile) {
          collectors.push(fullProfile);
        }
      }
    }
    
    console.log(`Found ${collectors.length} collectors in ${city}`);

    res.status(200).json({
      success: true,
      collectors,
      message: `Found ${collectors.length} collectors in ${city}`
    });
  } catch (error) {
    console.error('Get collectors by city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching collectors'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken,
  getAllCollectors,
  getCollectorsByCity
};
