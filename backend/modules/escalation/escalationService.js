const Complaint = require('../../models/Complaint');
const Escalation = require('../../models/Escalation');
const Admin = require('../../models/Admin');
const GeographicUnit = require('../../models/GeographicUnit');

/**
 * Escalation Service - Manages sequential 3-level escalation
 */

/**
 * Escalate complaint to next level
 * Ensures sequential escalation: Level 1 → 2 → 3
 */
exports.escalateComplaint = async (complaintId, reason = 'SLA_BREACH', remarks = '') => {
  try {
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check if already at max level
    if (complaint.current_escalation_level >= 3) {
      console.log(`Complaint ${complaintId} already at maximum escalation level`);
      return null;
    }

    const fromLevel = complaint.current_escalation_level;
    const toLevel = fromLevel + 1;

    // Find appropriate admin at next level
    const nextAdmin = await findAdminForNextLevel(
      complaint.geographic_unit_id,
      toLevel,
      complaint.category
    );

    if (!nextAdmin) {
      console.log(`No admin found for escalation level ${toLevel}`);
      return null;
    }

    // Create escalation record
    const escalation = await Escalation.create({
      complaint_id: complaintId,
      from_level: fromLevel,
      to_level: toLevel,
      from_admin: complaint.assigned_admin,
      to_admin: nextAdmin._id,
      reason,
      remarks
    });

    // Update complaint
    complaint.current_escalation_level = toLevel;
    complaint.assigned_admin = nextAdmin._id;
    complaint.status = 'ASSIGNED';

    // Extend deadline by standard SLA hours for this category
    const { getSLAHours } = require('../sla/slaService');
    const slaHours = getSLAHours(complaint.category);
    const newDeadline = new Date();
    newDeadline.setHours(newDeadline.getHours() + slaHours);
    complaint.deadline = newDeadline;

    await complaint.save();

    console.log(`Complaint ${complaintId} escalated from Level ${fromLevel} to Level ${toLevel}`);

    return escalation;
  } catch (error) {
    console.error('Error escalating complaint:', error);
    throw error;
  }
};

/**
 * Find admin for next escalation level
 * Must be in same geographic branch and department
 */
async function findAdminForNextLevel(geoUnitId, level, department) {
  try {
    // Get geographic unit and its ancestors
    const geoUnit = await GeographicUnit.findById(geoUnitId);
    if (!geoUnit) return null;

    const ancestors = await geoUnit.getAncestors();
    const geoUnitsToCheck = [geoUnit, ...ancestors];

    // Find admin matching level and department in the geographic hierarchy
    for (const unit of geoUnitsToCheck) {
      const admin = await Admin.findOne({
        level: level,
        department: { $in: [department, 'GENERAL'] },
        assigned_geographic_unit_ids: unit._id
      });

      if (admin) {
        return admin;
      }
    }

    // Fallback: find any admin with the right level and department
    return await Admin.findOne({
      level: level,
      department: { $in: [department, 'GENERAL'] }
    });
  } catch (error) {
    console.error('Error finding admin for next level:', error);
    return null;
  }
}

/**
 * Get escalation history for a complaint
 */
exports.getEscalationHistory = async (complaintId) => {
  try {
    return await Escalation.find({ complaint_id: complaintId })
      .populate('from_admin', 'name email level')
      .populate('to_admin', 'name email level')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting escalation history:', error);
    throw error;
  }
};

/**
 * Get escalation statistics for analytics
 */
exports.getEscalationStats = async (geoUnitId, startDate, endDate) => {
  try {
    const matchStage = {
      geographic_unit_id: geoUnitId
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$current_escalation_level',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return stats;
  } catch (error) {
    console.error('Error getting escalation stats:', error);
    throw error;
  }
};
