const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, geographic_unit_id, address, department, designation, level, assigned_geographic_unit_ids } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    let existingAdmin = await Admin.findOne({ email });

    if (existingUser || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    let user;
    let token;

    // Register as Admin
    if (role === 'ADMIN') {
      if (!department || !level || !assigned_geographic_unit_ids) {
        return res.status(400).json({
          success: false,
          message: 'Department, level, and assigned geographic units are required for admin registration'
        });
      }

      user = await Admin.create({
        name,
        email,
        phone,
        password,
        department,
        designation: designation || '',
        level,
        assigned_geographic_unit_ids
      });

      token = user.getSignedJwtToken();
    } else {
      // Register as User (CITIZEN, SUPER_ADMIN, GOVERNMENT_ANALYST)
      user = await User.create({
        name,
        email,
        phone,
        password,
        role: role || 'CITIZEN',
        geographic_unit_id,
        address
      });

      token = user.getSignedJwtToken();
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.level && { level: user.level }),
        ...(user.department && { department: user.department }),
        ...(user.assigned_geographic_unit_ids && { assigned_geographic_unit_ids: user.assigned_geographic_unit_ids }),
        ...(user.geographic_unit_id && { geographic_unit_id: user.geographic_unit_id }),
        ...(user.credibility_score !== undefined && { credibility_score: user.credibility_score })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check in User model
    let user = await User.findOne({ email }).select('+password');
    let isAdmin = false;

    // If not found in User, check in Admin
    if (!user) {
      user = await Admin.findOne({ email }).select('+password');
      isAdmin = true;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    // Populate geographic unit details if we have them
    if (!isAdmin && user.geographic_unit_id) {
      await user.populate('geographic_unit_id', 'name type');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(isAdmin && {
          level: user.level,
          department: user.department,
          designation: user.designation || '',
          assigned_geographic_unit_ids: user.assigned_geographic_unit_ids
        }),
        ...(!isAdmin && {
          geographic_unit_id: user.geographic_unit_id,
          credibility_score: user.credibility_score,
          address: user.address
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    let userResponse = req.user;

    // Explicitly populate for citizens to show ward details in sidebar
    if (req.user.role === 'CITIZEN' && req.user.geographic_unit_id) {
      userResponse = await User.findById(req.user._id).populate('geographic_unit_id', 'name type');
    } else if (req.user.role === 'ADMIN' && req.user.assigned_geographic_unit_ids?.length) {
      // Also handy for admins
      const Admin = require('../models/Admin');
      userResponse = await Admin.findById(req.user._id).populate('assigned_geographic_unit_ids', 'name type');
    }

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};
