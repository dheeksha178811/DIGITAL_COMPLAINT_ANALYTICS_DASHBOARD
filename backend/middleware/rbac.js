const Complaint = require('../models/Complaint');
const GeographicUnit = require('../models/GeographicUnit');

/**
 * Verify that admin has jurisdiction over the geographic unit
 * Prevents IDOR attacks and cross-jurisdiction access
 */
exports.verifyGeographicJurisdiction = async (req, res, next) => {
  try {
    // Only apply to admins
    if (req.user.role !== 'ADMIN') {
      return next();
    }

    const { id } = req.params;
    let geoUnitId;

    // If checking complaint access
    if (id) {
      const complaint = await Complaint.findById(id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }
      geoUnitId = complaint.geographic_unit_id;
    } else if (req.body.geographic_unit_id) {
      geoUnitId = req.body.geographic_unit_id;
    }

    if (!geoUnitId) {
      return next();
    }

    // Check if admin has jurisdiction
    const hasJurisdiction = await checkJurisdiction(
      req.user.assigned_geographic_unit_ids,
      geoUnitId
    );

    if (!hasJurisdiction) {
      return res.status(403).json({
        success: false,
        message: 'You do not have jurisdiction over this geographic unit'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if admin's assigned units include the target unit or its ancestors
 */
async function checkJurisdiction(assignedUnitIds, targetUnitId) {
  // Direct match
  if (assignedUnitIds.some(id => id.toString() === targetUnitId.toString())) {
    return true;
  }

  // Check if any assigned unit is an ancestor of target unit
  const targetUnit = await GeographicUnit.findById(targetUnitId);
  if (!targetUnit) return false;

  const ancestors = await targetUnit.getAncestors();
  
  for (const ancestor of ancestors) {
    if (assignedUnitIds.some(id => id.toString() === ancestor._id.toString())) {
      return true;
    }
  }

  return false;
}

/**
 * Prevent users from accessing other users' data
 */
exports.preventIDOR = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Skip for admins and analysts
    if (['ADMIN', 'SUPER_ADMIN', 'GOVERNMENT_ANALYST'].includes(req.user.role)) {
      return next();
    }

    // For citizens, verify they own the complaint
    if (id) {
      const complaint = await Complaint.findById(id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }

      if (complaint.citizen_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this complaint'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
