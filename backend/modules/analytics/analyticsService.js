const Complaint = require('../../models/Complaint');
const Escalation = require('../../models/Escalation');
const GeographicUnit = require('../../models/GeographicUnit');

/**
 * Analytics Service - Government-grade analytics and reporting
 */

/**
 * Get resolution rate for a geographic unit
 */
exports.getResolutionRate = async (geoUnitId, startDate, endDate) => {
  try {
    // Get all child geographic units
    const geoUnit = await GeographicUnit.findById(geoUnitId);
    if (!geoUnit) {
      throw new Error('Geographic unit not found');
    }

    const descendants = await GeographicUnit.getDescendants(geoUnitId);
    const unitIds = [geoUnitId, ...descendants.map(d => d._id)];

    const matchStage = {
      geographic_unit_id: { $in: unitIds }
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length === 0 || stats[0].total === 0) {
      return { total: 0, resolved: 0, rate: 0 };
    }

    const { total, resolved } = stats[0];
    const rate = Math.round((resolved / total) * 100);

    return { total, resolved, rate };
  } catch (error) {
    console.error('Error calculating resolution rate:', error);
    throw error;
  }
};

/**
 * Calculate risk score for a geographic unit
 * Risk = weighted sum of complaint count, overdue count, escalation count
 */
exports.calculateRiskScore = async (geoUnitId) => {
  try {
    const geoUnit = await GeographicUnit.findById(geoUnitId);
    if (!geoUnit) {
      throw new Error('Geographic unit not found');
    }

    const descendants = await GeographicUnit.getDescendants(geoUnitId);
    const unitIds = [geoUnitId, ...descendants.map(d => d._id)];

    // Get complaint statistics
    const stats = await Complaint.aggregate([
      {
        $match: {
          geographic_unit_id: { $in: unitIds },
          status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'OVERDUE'] }
        }
      },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] }
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$impact_level', 'CRITICAL'] }, 1, 0] }
          },
          avgEscalationLevel: { $avg: '$current_escalation_level' }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        score: 0,
        level: 'LOW',
        metrics: {
          totalComplaints: 0,
          overdueCount: 0,
          criticalCount: 0,
          avgEscalationLevel: 0
        }
      };
    }

    const metrics = stats[0];

    // Calculate weighted risk score
    const complaintWeight = 0.3;
    const overdueWeight = 0.4;
    const escalationWeight = 0.3;

    const normalizedComplaintScore = Math.min(metrics.totalComplaints / 100, 1) * 100;
    const normalizedOverdueScore = Math.min(metrics.overdueCount / 50, 1) * 100;
    const normalizedEscalationScore = (metrics.avgEscalationLevel / 3) * 100;

    const riskScore = Math.round(
      (normalizedComplaintScore * complaintWeight) +
      (normalizedOverdueScore * overdueWeight) +
      (normalizedEscalationScore * escalationWeight)
    );

    // Determine risk level
    let riskLevel;
    if (riskScore >= 75) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 25) {
      riskLevel = 'MODERATE';
    } else {
      riskLevel = 'LOW';
    }

    return {
      score: riskScore,
      level: riskLevel,
      metrics: {
        totalComplaints: metrics.totalComplaints,
        overdueCount: metrics.overdueCount,
        criticalCount: metrics.criticalCount,
        avgEscalationLevel: Math.round(metrics.avgEscalationLevel * 10) / 10
      }
    };
  } catch (error) {
    console.error('Error calculating risk score:', error);
    throw error;
  }
};

/**
 * Detect recurring issues
 * Same category + same geographic unit + last 30 days
 */
exports.detectRecurringIssues = async (geoUnitId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recurringIssues = await Complaint.aggregate([
      {
        $match: {
          geographic_unit_id: geoUnitId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          complaints: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gte: 3 } // Consider recurring if 3+ in 30 days
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Mark complaints as recurring
    for (const issue of recurringIssues) {
      await Complaint.updateMany(
        { _id: { $in: issue.complaints } },
        { $set: { recurring: true } }
      );
    }

    return recurringIssues;
  } catch (error) {
    console.error('Error detecting recurring issues:', error);
    throw error;
  }
};

/**
 * Get category-wise distribution
 */
exports.getCategoryDistribution = async (geoUnitId, startDate, endDate) => {
  try {
    const geoUnit = await GeographicUnit.findById(geoUnitId);
    if (!geoUnit) {
      throw new Error('Geographic unit not found');
    }

    const descendants = await GeographicUnit.getDescendants(geoUnitId);
    const unitIds = [geoUnitId, ...descendants.map(d => d._id)];

    const matchStage = {
      geographic_unit_id: { $in: unitIds }
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const distribution = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return distribution;
  } catch (error) {
    console.error('Error getting category distribution:', error);
    throw error;
  }
};

/**
 * Get department-wise performance ranking
 */
exports.getDepartmentRanking = async (geoUnitId) => {
  try {
    const ranking = await Complaint.aggregate([
      {
        $match: {
          geographic_unit_id: geoUnitId,
          status: { $in: ['RESOLVED', 'IN_PROGRESS', 'OVERDUE'] }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          resolved: 1,
          overdue: 1,
          resolutionRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }
            ]
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ]);

    return ranking;
  } catch (error) {
    console.error('Error getting department ranking:', error);
    throw error;
  }
};
