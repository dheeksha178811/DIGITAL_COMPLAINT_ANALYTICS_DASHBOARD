const mongoose = require('mongoose');

/**
 * Escalation Model - Audit trail for complaint escalations
 * Tracks sequential escalation from Level 1 → 2 → 3
 */
const EscalationSchema = new mongoose.Schema({
  complaint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  from_level: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  to_level: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  from_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  to_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'SLA_BREACH',
      'MANUAL',
      'JURISDICTION_CHANGE',
      'REQUIRES_HIGHER_AUTHORITY',
      'RESOURCE_UNAVAILABLE',
      'COMPLEX_ISSUE'
    ]
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  escalation_type: {
    type: String,
    enum: ['AUTO', 'MANUAL'],
    default: 'AUTO'
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
EscalationSchema.index({ complaint_id: 1 });
EscalationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Escalation', EscalationSchema);
