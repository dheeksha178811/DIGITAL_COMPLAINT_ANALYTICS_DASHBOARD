const mongoose = require('mongoose');

/**
 * Self-referencing geographic hierarchy model
 * Supports: STATE → DIVISION → DISTRICT → CORPORATION/MUNICIPALITY/CITY → WARD → BLOCK → VILLAGE
 */
const GeographicUnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Geographic unit name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: [
      'STATE',
      'DIVISION',
      'DISTRICT',
      'CORPORATION',
      'MUNICIPALITY',
      'CITY',
      'WARD',
      'BLOCK',
      'VILLAGE'
    ]
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeographicUnit',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
GeographicUnitSchema.index({ parent_id: 1 });
GeographicUnitSchema.index({ type: 1 });

/**
 * Get all ancestors (parent, grandparent, etc.) up the hierarchy
 */
GeographicUnitSchema.methods.getAncestors = async function() {
  const ancestors = [];
  let current = this;

  while (current.parent_id) {
    const parent = await mongoose.model('GeographicUnit').findById(current.parent_id);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
};

/**
 * Get all descendants (children at all levels)
 */
GeographicUnitSchema.statics.getDescendants = async function(unitId) {
  const descendants = [];
  const queue = [unitId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await this.find({ parent_id: currentId });
    
    for (const child of children) {
      descendants.push(child);
      queue.push(child._id);
    }
  }

  return descendants;
};

module.exports = mongoose.model('GeographicUnit', GeographicUnitSchema);
