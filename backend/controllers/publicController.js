const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const GeographicUnit = require('../models/GeographicUnit');

/**
 * @desc    Get public statistics
 * @route   GET /api/public/stats
 * @access  Public
 */
exports.getPublicStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          pending: {
            $sum: {
              $cond: [
                { $in: ['$status', ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS']] },
                1,
                0
              ]
            }
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      resolved: 0,
      pending: 0,
      overdue: 0
    };

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active notices for a geographic unit
 *          Matches both single-unit notices (L1/L3) and multi-ward broadcasts (L2)
 * @route   GET /api/public/notices
 * @access  Public
 */
exports.getPublicNotices = async (req, res, next) => {
  try {
    const { geographic_unit_id } = req.query;

    const now = new Date();
    let filter = { valid_until: { $gte: now } };

    if (geographic_unit_id) {
      // Build list: this unit + all ancestors (so higher-level notices cascade down)
      const unitIds = [geographic_unit_id];
      try {
        const unit = await GeographicUnit.findById(geographic_unit_id);
        if (unit) {
          const ancestors = await unit.getAncestors();
          ancestors.forEach(a => unitIds.push(a._id.toString()));
        }
      } catch (_) {
        // Ancestor lookup failure — fall back to just the provided ID
      }

      // Match notices targeting this unit via either single or multi-ward field
      filter = {
        valid_until: { $gte: now },
        $or: [
          { geographic_unit_id: { $in: unitIds } },
          { geographic_unit_ids: { $in: unitIds } }
        ]
      };
    }

    let notices = await Notice.find(filter)
      .populate('geographic_unit_id', 'name type')
      .populate('geographic_unit_ids', 'name type')
      .populate('created_by', 'name department designation level')
      .sort({ createdAt: -1 })
      .limit(50);

    // If no area-specific notices found, fall back to all active notices
    if (notices.length === 0 && geographic_unit_id) {
      notices = await Notice.find({ valid_until: { $gte: now } })
        .populate('geographic_unit_id', 'name type')
        .populate('geographic_unit_ids', 'name type')
        .populate('created_by', 'name department designation level')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.status(200).json({
      success: true,
      count: notices.length,
      notices
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Get geographic units
 * @route   GET /api/public/geographic-units
 * @access  Public
 */
exports.getGeographicUnits = async (req, res, next) => {
  try {
    const { parent_id, type } = req.query;
    const filter = {};

    // Handle parent_id filter
    if (parent_id) {
      // Parent ID is provided - filter by it
      filter.parent_id = parent_id;
    } else {
      // No parent ID provided - get root level units (parent_id is null)
      filter.parent_id = null;
    }

    // Handle type filter
    if (type) {
      filter.type = type.toUpperCase();
    }

    console.log('Geographic Units Query:', {
      query: req.query,
      filter: JSON.stringify(filter)
    });

    const units = await GeographicUnit.find(filter).sort({ name: 1 });

    console.log(`Found ${units.length} units matching filter`);

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error in getGeographicUnits:', error);
    next(error);
  }
};

/**
 * @desc    Get geographic unit hierarchy
 * @route   GET /api/public/geographic-units/:id/hierarchy
 * @access  Public
 */
exports.getGeographicHierarchy = async (req, res, next) => {
  try {
    const unit = await GeographicUnit.findById(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Geographic unit not found'
      });
    }

    const ancestors = await unit.getAncestors();
    const descendants = await GeographicUnit.getDescendants(req.params.id);

    res.status(200).json({
      success: true,
      unit,
      ancestors,
      descendants
    });
  } catch (error) {
    next(error);
  }
};
