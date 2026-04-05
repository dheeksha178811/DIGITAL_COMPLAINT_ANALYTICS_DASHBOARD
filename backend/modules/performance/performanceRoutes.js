const express = require('express');
const router = express.Router();
const { getBulkPerformance, getSinglePerformance } = require('./performanceController');
const { protect, authorize } = require('../../middleware/auth');

// Protect all routes
router.use(protect);

// Allow Admins, Analysts, etc.
router.use(authorize('ADMIN', 'GOVERNMENT_ANALYST', 'SUPER_ADMIN'));

// Bulk endpoint
router.get('/', getBulkPerformance);

// Specific admin endpoint
router.get('/:adminId', getSinglePerformance);

module.exports = router;
