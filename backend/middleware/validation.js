const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['customer', 'collector'])
    .withMessage('Role must be either customer or collector'),
  
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Country can only contain letters and spaces'),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
  
  // Collector-specific fields (conditional validation)
  body('collector_group_name')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Collector group name is required for collectors')
    .isLength({ min: 2, max: 100 })
    .withMessage('Collector group name must be between 2 and 100 characters'),
  
  body('e_waste_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('E-Waste price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('E-Waste price must be a positive number'),
  
  body('plastic_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Plastic price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Plastic price must be a positive number'),
  
  body('organic_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Organic price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Organic price must be a positive number'),
  
  body('paper_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Paper price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Paper price must be a positive number'),
  
  body('metal_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Metal price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Metal price must be a positive number'),
  
  body('glass_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Glass price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Glass price must be a positive number'),
  
  body('hazardous_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Hazardous price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Hazardous price must be a positive number'),
  
  body('mixed_price')
    .if((value, { req }) => req.body.role === 'collector')
    .notEmpty()
    .withMessage('Mixed price is required for collectors')
    .isFloat({ min: 0 })
    .withMessage('Mixed price must be a positive number')
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for waste request creation
const validateWasteRequest = [
  body('waste_type')
    .notEmpty()
    .withMessage('Waste type is required')
    .isIn(['e-waste', 'plastic', 'organic', 'paper', 'metal', 'glass', 'hazardous', 'mixed'])
    .withMessage('Please select a valid waste type'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isNumeric({ min: 0.1 })
    .withMessage('Quantity must be a positive number'),
  
  body('pickup_address')
    .notEmpty()
    .withMessage('Pickup address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Pickup address must be between 10 and 500 characters'),
  
  body('pickup_date')
    .notEmpty()
    .withMessage('Pickup date is required')
    .isISO8601()
    .withMessage('Please provide a valid pickup date (YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date();
      const pickupDate = new Date(value);
      if (pickupDate < today) {
        throw new Error('Pickup date cannot be in the past');
      }
      return true;
    }),
  
  body('pickup_time')
    .notEmpty()
    .withMessage('Pickup time preference is required')
    .isIn(['morning', 'afternoon', 'evening', 'flexible'])
    .withMessage('Please select a valid pickup time preference'),
  
  body('special_instructions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must not exceed 1000 characters')
];

// Validation rules for profile update
const validateProfileUpdate = [
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Country can only contain letters and spaces'),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
  
  // Collector-specific fields (optional for profile update)
  body('collector_group_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Collector group name must be between 2 and 100 characters'),
  
  body('e_waste_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('E-Waste price must be a positive number'),
  
  body('plastic_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Plastic price must be a positive number'),
  
  body('organic_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Organic price must be a positive number'),
  
  body('paper_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paper price must be a positive number'),
  
  body('metal_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Metal price must be a positive number'),
  
  body('glass_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Glass price must be a positive number'),
  
  body('hazardous_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hazardous price must be a positive number'),
  
  body('mixed_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mixed price must be a positive number')
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateWasteRequest,
  validateProfileUpdate,
  handleValidationErrors
};
