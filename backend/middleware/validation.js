const { body, param, validationResult } = require('express-validator');

/**
 * Validation middleware using express-validator
 */

/**
 * Handle validation errors
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Registration validation
 */
exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * Login validation
 */
exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * Complaint creation validation
 */
exports.complaintValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category').isIn([
    'WATER_SUPPLY', 'ELECTRICITY', 'ROAD_MAINTENANCE', 'GARBAGE_COLLECTION',
    'STREET_LIGHTING', 'DRAINAGE', 'PUBLIC_HEALTH', 'TRAFFIC', 'POLLUTION',
    'ILLEGAL_CONSTRUCTION', 'PARKS_GARDENS', 'OTHER'
  ]).withMessage('Valid category is required'),
  body('location_address').trim().notEmpty().withMessage('Specific location/address is required')
];

/**
 * MongoDB ID validation
 */
exports.mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format')
];
