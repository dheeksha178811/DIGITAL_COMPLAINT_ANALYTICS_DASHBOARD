const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaint,
  voteOnComplaint,
  getAllComplaints
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { preventIDOR } = require('../middleware/rbac');
const { complaintValidation, mongoIdValidation, validate } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Citizen routes
router.post('/', protect, authorize('CITIZEN'), upload.single('image'), complaintValidation, validate, createComplaint);
router.get('/my', protect, authorize('CITIZEN'), getMyComplaints);
router.post('/:id/vote', protect, authorize('CITIZEN'), mongoIdValidation, validate, voteOnComplaint);

// General authenticated routes
router.get('/:id', protect, mongoIdValidation, validate, preventIDOR, getComplaint);
router.get('/', protect, getAllComplaints);

module.exports = router;
