const analyticsService = require('../modules/analytics/analyticsService');
const slaService = require('../modules/sla/slaService');
const escalationService = require('../modules/escalation/escalationService');
const Complaint = require('../models/Complaint');

/**
 * @desc    Get resolution rate for a geographic unit
 * @route   GET /api/analytics/resolution-rate/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getResolutionRate = async (req, res, next) => {
  try {
    const { geoId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await analyticsService.getResolutionRate(geoId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get SLA compliance for a geographic unit
 * @route   GET /api/analytics/sla-compliance/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getSLACompliance = async (req, res, next) => {
  try {
    const { geoId } = req.params;
    const { startDate, endDate } = req.query;

    const compliance = await slaService.getSLACompliance(geoId, startDate, endDate);

    res.status(200).json({
      success: true,
      compliance_percentage: compliance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get risk score for a geographic unit
 * @route   GET /api/analytics/risk-score/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getRiskScore = async (req, res, next) => {
  try {
    const { geoId } = req.params;

    const riskData = await analyticsService.calculateRiskScore(geoId);

    res.status(200).json({
      success: true,
      data: riskData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get escalation statistics
 * @route   GET /api/analytics/escalations/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getEscalationStats = async (req, res, next) => {
  try {
    const { geoId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await escalationService.getEscalationStats(geoId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category distribution
 * @route   GET /api/analytics/category-distribution/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getCategoryDistribution = async (req, res, next) => {
  try {
    const { geoId } = req.params;
    const { startDate, endDate } = req.query;

    const distribution = await analyticsService.getCategoryDistribution(geoId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department ranking
 * @route   GET /api/analytics/department-ranking/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getDepartmentRanking = async (req, res, next) => {
  try {
    const { geoId } = req.params;

    const ranking = await analyticsService.getDepartmentRanking(geoId);

    res.status(200).json({
      success: true,
      data: ranking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detect recurring issues
 * @route   GET /api/analytics/recurring-issues/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN)
 */
exports.getRecurringIssues = async (req, res, next) => {
  try {
    const { geoId } = req.params;

    const issues = await analyticsService.detectRecurringIssues(geoId);

    res.status(200).json({
      success: true,
      data: issues
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard overview
 * @route   GET /api/analytics/dashboard/:geoId
 * @access  Private (GOVERNMENT_ANALYST, SUPER_ADMIN, ADMIN)
 */
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const { geoId } = req.params;

    // Aggregate all key metrics
    const [resolutionRate, riskScore, slaCompliance, categoryDist] = await Promise.all([
      analyticsService.getResolutionRate(geoId),
      analyticsService.calculateRiskScore(geoId),
      slaService.getSLACompliance(geoId),
      analyticsService.getCategoryDistribution(geoId)
    ]);

    // Get count by status
    const statusCounts = await Complaint.aggregate([
      { $match: { geographic_unit_id: geoId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        resolution: resolutionRate,
        risk: riskScore,
        sla_compliance: slaCompliance,
        category_distribution: categoryDist,
        status_counts: statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};
