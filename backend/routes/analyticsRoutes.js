const express = require('express');
const router = express.Router();
const {
  getResolutionRate,
  getSLACompliance,
  getRiskScore,
  getEscalationStats,
  getCategoryDistribution,
  getDepartmentRanking,
  getRecurringIssues,
  getDashboardOverview
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const { mongoIdValidation, validate } = require('../middleware/validation');

// All routes require GOVERNMENT_ANALYST or SUPER_ADMIN role
router.use(protect);
router.use(authorize('GOVERNMENT_ANALYST', 'SUPER_ADMIN', 'ADMIN'));

// Analytics routes
router.get('/resolution-rate/:geoId', mongoIdValidation, validate, getResolutionRate);
router.get('/sla-compliance/:geoId', mongoIdValidation, validate, getSLACompliance);
router.get('/risk-score/:geoId', mongoIdValidation, validate, getRiskScore);
router.get('/escalations/:geoId', mongoIdValidation, validate, getEscalationStats);
router.get('/category-distribution/:geoId', mongoIdValidation, validate, getCategoryDistribution);
router.get('/department-ranking/:geoId', mongoIdValidation, validate, getDepartmentRanking);
router.get('/recurring-issues/:geoId', mongoIdValidation, validate, getRecurringIssues);
router.get('/dashboard/:geoId', mongoIdValidation, validate, getDashboardOverview);

module.exports = router;
