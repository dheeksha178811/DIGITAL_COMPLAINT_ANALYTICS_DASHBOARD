const { SLA_CONFIG } = require('../../config/slaConfig');
const Complaint = require('../../models/Complaint');

/**
 * SLA Service - Manages SLA assignment and monitoring
 */

/**
 * Calculate SLA hours based on complaint category
 */
exports.getSLAHours = (category) => {
  return SLA_CONFIG[category] || SLA_CONFIG.OTHER;
};

/**
 * Calculate deadline based on SLA hours
 */
exports.calculateDeadline = (createdAt, slaHours) => {
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + slaHours);
  return deadline;
};

/**
 * Check if complaint is overdue
 */
exports.isOverdue = (deadline) => {
  return new Date() > new Date(deadline);
};

/**
 * Mark overdue complaints and trigger escalation
 */
exports.checkAndMarkOverdue = async () => {
  try {
    const now = new Date();
    
    // Find complaints that are overdue but not marked as such
    const overdueComplaints = await Complaint.find({
      deadline: { $lt: now },
      status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] }
    });

    for (const complaint of overdueComplaints) {
      complaint.status = 'OVERDUE';
      await complaint.save();
      
      // Trigger escalation (will be handled by escalation service)
      console.log(`Complaint ${complaint._id} marked as OVERDUE`);
    }

    return overdueComplaints.length;
  } catch (error) {
    console.error('Error checking overdue complaints:', error);
    throw error;
  }
};

/**
 * Get SLA compliance rate for a geographic unit
 */
exports.getSLACompliance = async (geoUnitId, startDate, endDate) => {
  try {
    const query = {
      geographic_unit_id: geoUnitId,
      status: 'RESOLVED'
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const resolvedComplaints = await Complaint.find(query);
    
    if (resolvedComplaints.length === 0) {
      return 100; // No complaints = 100% compliance
    }

    const withinSLA = resolvedComplaints.filter(complaint => {
      return complaint.resolution_date <= complaint.deadline;
    });

    return Math.round((withinSLA.length / resolvedComplaints.length) * 100);
  } catch (error) {
    console.error('Error calculating SLA compliance:', error);
    throw error;
  }
};
