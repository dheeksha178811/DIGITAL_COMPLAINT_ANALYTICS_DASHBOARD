const mongoose = require('mongoose');

/**
 * Complaint Model - Core entity for civic complaints
 */
const ComplaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
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
      'OTHER'
    ]
  },
  status: {
    type: String,
    enum: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'OVERDUE'],
    default: 'SUBMITTED'
  },
  citizen_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  geographic_unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeographicUnit',
    required: [true, 'Geographic unit is required']
  },
  assigned_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  location: {
    address: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  image_url: {
    type: String,
    default: null
  },
  sla_hours: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  current_escalation_level: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  impact_level: {
    type: String,
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  vote_count: {
    type: Number,
    default: 0
  },
  recurring: {
    type: Boolean,
    default: false
  },
  admin_remarks: {
    type: String,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters']
  },
  resolution_date: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
ComplaintSchema.index({ citizen_id: 1 });
ComplaintSchema.index({ geographic_unit_id: 1 });
ComplaintSchema.index({ assigned_admin: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ deadline: 1 });
ComplaintSchema.index({ category: 1, geographic_unit_id: 1, createdAt: -1 });

// Update timestamp on save
ComplaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
