const mongoose = require('mongoose');

/**
 * Vote Model - For community voting on complaints
 * Ensures one vote per user per complaint
 */
const VoteSchema = new mongoose.Schema({
  complaint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one vote per user per complaint
VoteSchema.index({ complaint_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
