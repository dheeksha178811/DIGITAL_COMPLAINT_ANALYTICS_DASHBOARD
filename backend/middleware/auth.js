const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Protect routes - Verify JWT token
 * Attaches user to req.user
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request based on role
      if (decoded.role === 'ADMIN') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.user.level = decoded.level;
        req.user.department = decoded.department;
        req.user.assigned_geographic_unit_ids = decoded.assigned_geographic_unit_ids;
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Grant access to specific roles
 * @param  {...any} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Authorize admin by level
 * @param  {...any} levels - Allowed admin levels
 */
exports.authorizeAdminLevel = (...levels) => {
  return (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this route'
      });
    }

    if (!levels.includes(req.user.level)) {
      return res.status(403).json({
        success: false,
        message: `Admin level ${req.user.level} is not authorized for this action`
      });
    }
    next();
  };
};
