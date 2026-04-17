const mongoose = require('mongoose');

/**
 * Notice Model - For public notices and announcements
 * Created by admins for specific geographic units.
 * Level 2 officers may broadcast to multiple ward IDs via geographic_unit_ids.
 */
const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  type: {
    type: String,
    enum: ['GENERAL', 'URGENT', 'MAINTENANCE', 'EVENT', 'ALERT', 'INFORMATION', 'WARNING', 'EMERGENCY'],
    default: 'GENERAL'
  },
  // Single geo unit (Level 1 / Level 3 notices)
  geographic_unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeographicUnit',
    default: null
  },
  // Multi-ward broadcast (Level 2 notices — contains ALL assigned ward IDs)
  geographic_unit_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeographicUnit'
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  valid_until: {
    type: Date
    // Not required — defaults to 30 days from creation if not provided (set in controller)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
NoticeSchema.index({ geographic_unit_id: 1 });
NoticeSchema.index({ geographic_unit_ids: 1 });
NoticeSchema.index({ valid_until: 1 });
NoticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', NoticeSchema);

