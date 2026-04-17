const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Admin Model - For hierarchical government administrators
 * Levels: 1 (Local Field Officer), 2 (Division/Block Authority), 3 (District Authority)
 */
const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'ADMIN'
  },
  department: {
    type: String,
    default: 'GENERAL',
    validate: {
      validator: function (v) {
        // Level 2 (division authority) and Level 3 (district analyst) handle all departments
        if (this.level === 2 || this.level === 3) return true;
        return !!v;
      },
      message: 'Department is required'
    },
    enum: [
      'WATER_SUPPLY',
      'ELECTRICITY',
      'ROAD_MAINTENANCE',
      'GARBAGE_COLLECTION',
      'STREET_LIGHTING',
      'DRAINAGE',
      'PUBLIC_HEALTH',
      'TRAFFIC',
      'POLLUTION',
      'ILLEGAL_CONSTRUCTION',
      'PARKS_GARDENS',
      'GENERAL'
    ]
  },
  level: {
    type: Number,
    required: [true, 'Admin level is required'],
    enum: [1, 2, 3],
    default: 1
  },
  assigned_geographic_unit_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeographicUnit'
  }],
  designation: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
AdminSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      level: this.level,
      department: this.department,
      designation: this.designation,
      assigned_geographic_unit_ids: this.assigned_geographic_unit_ids
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('Admin', AdminSchema);
