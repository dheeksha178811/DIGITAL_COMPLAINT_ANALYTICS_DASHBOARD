const Complaint = require('../models/Complaint');
const User = require('../models/User');
const slaService = require('../modules/sla/slaService');
const votingService = require('../modules/voting/votingService');
const credibilityService = require('../modules/credibility/credibilityService');

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (CITIZEN)
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const location = {
      address: req.body.location_address || req.body['location[address]'] || '',
      landmark: req.body.location_landmark || req.body['location[landmark]'] || ''
    };

    // Use citizen's registered geographic unit
    const geographic_unit_id = req.user.geographic_unit_id;

    if (!geographic_unit_id) {
      return res.status(400).json({
        success: false,
        message: 'Geographic unit not found in user profile. Please update your profile.'
      });
    }

    // Calculate SLA and deadline
    const slaHours = slaService.getSLAHours(category);
    const deadline = slaService.calculateDeadline(new Date(), slaHours);

    // Handle image upload
    let image_url = null;
    if (req.file) {
      // Create relative path for the frontend to consume
      image_url = `/uploads/${req.file.filename}`;
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      geographic_unit_id,
      location,
      citizen_id: req.user._id,
      sla_hours: slaHours,
      deadline,
      current_escalation_level: 1,
      status: 'SUBMITTED',
      image_url
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaints for logged-in citizen
 * @route   GET /api/complaints/my
 * @access  Private (CITIZEN)
 */
exports.getMyComplaints = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = { citizen_id: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('geographic_unit_id', 'name type')
      .populate('assigned_admin', 'name email department level')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single complaint details
 * @route   GET /api/complaints/:id
 * @access  Private
 */
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen_id', 'name email phone credibility_score')
      .populate('geographic_unit_id', 'name type')
      .populate('assigned_admin', 'name email department level');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Level 1 admins can only view complaints matching their department
    if (req.user.role === 'ADMIN' && Number(req.user.level) === 1) {
      if (req.user.department && req.user.department !== 'GENERAL' && complaint.category !== req.user.department) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to complaints outside your department'
        });
      }
    }

    // Normalize image URL to full path so the frontend can display attachments reliably
    const complaintObj = complaint.toObject();
    if (complaintObj.image_url && !complaintObj.image_url.startsWith('http')) {
      complaintObj.image_url = `${req.protocol}://${req.get('host')}${complaintObj.image_url}`;
    }

    // Attach a reliable submitter label for the frontend
    let submittedBy = 'Citizen';
    if (complaintObj.citizen_id) {
      if (typeof complaintObj.citizen_id === 'object' && complaintObj.citizen_id.name) {
        submittedBy = complaintObj.citizen_id.name;
      } else {
        const submitter = await User.findById(complaintObj.citizen_id).select('name email phone');
        submittedBy = submitter?.name || submitter?.email || submitter?.phone || submittedBy;
      }
    }
    complaintObj.submitted_by = submittedBy;

    // Check if user has voted (for citizens)
    let hasVoted = false;
    if (req.user.role === 'CITIZEN') {
      hasVoted = await votingService.hasUserVoted(complaint._id, req.user._id);
    }

    res.status(200).json({
      success: true,
      complaint: complaintObj,
      hasVoted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vote on a complaint
 * @route   POST /api/complaints/:id/vote
 * @access  Private (CITIZEN)
 */
exports.voteOnComplaint = async (req, res, next) => {
  try {
    const result = await votingService.castVote(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Vote cast successfully',
      vote_count: result.complaint.vote_count,
      impact_level: result.complaint.impact_level
    });
  } catch (error) {
    if (error.message === 'Cannot vote on your own complaint' ||
      error.message === 'You have already voted on this complaint') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all complaints (with filters)
 * @route   GET /api/complaints
 * @access  Private (All authenticated users)
 */
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, geographic_unit_id, impact_level } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (geographic_unit_id) filter.geographic_unit_id = geographic_unit_id;
    if (impact_level) filter.impact_level = impact_level;

    const complaints = await Complaint.find(filter)
      .populate('citizen_id', 'name email credibility_score')
      .populate('geographic_unit_id', 'name type')
      .populate('assigned_admin', 'name email department level')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};
