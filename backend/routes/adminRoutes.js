const express = require('express');
const router = express.Router();
const {
  getAdminComplaints,
  updateComplaint,
  assignComplaint,
  createNotice,
  getAdminNotices,
  getAdminAnalytics,
  getEscalationHistory,
  escalateComplaint,
  getManualEscalations
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { verifyGeographicJurisdiction } = require('../middleware/rbac');
const { mongoIdValidation, validate } = require('../middleware/validation');

// All routes require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Complaint management
router.get('/complaints', getAdminComplaints);
router.get('/manual-escalations', getManualEscalations);
router.put('/complaints/:id', mongoIdValidation, validate, verifyGeographicJurisdiction, updateComplaint);
router.put('/complaints/:id/assign', mongoIdValidation, validate, verifyGeographicJurisdiction, assignComplaint);
router.get('/complaints/:id/escalations', mongoIdValidation, validate, getEscalationHistory);
router.post('/complaints/:id/escalate', mongoIdValidation, validate, verifyGeographicJurisdiction, escalateComplaint);

// Notice management
router.post('/notices', createNotice);
router.get('/notices', getAdminNotices);

// Analytics
router.get('/analytics', getAdminAnalytics);

module.exports = router;
