const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose;
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const GeographicUnit = require('../models/GeographicUnit');
const escalationService = require('../modules/escalation/escalationService');
const credibilityService = require('../modules/credibility/credibilityService');

/**
 * Helper: Get all geographic unit IDs an admin has jurisdiction over
 * (their assigned units + all descendants)
 */
async function getAllJurisdictionIds(admin) {
  let allIds = [...(admin.assigned_geographic_unit_ids || []).map(id => id.toString())];
  for (const unitId of (admin.assigned_geographic_unit_ids || [])) {
    const descendants = await GeographicUnit.getDescendants(unitId);
    descendants.forEach(d => allIds.push(d._id.toString()));
  }
  return allIds;
}

/**
 * @desc    Get complaints assigned to admin
 * @route   GET /api/admin/complaints
 * @access  Private (ADMIN)
 */
exports.getAdminComplaints = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    // Build query based on admin's jurisdiction
    const filter = {};
    const adminLevel = Number(req.user.level);

    // Filter by admin's assigned geographic units
    if (req.user.assigned_geographic_unit_ids && req.user.assigned_geographic_unit_ids.length > 0) {
      // Get all descendants of assigned units
      let allUnits = [...req.user.assigned_geographic_unit_ids];

      for (const unitId of req.user.assigned_geographic_unit_ids) {
        const descendants = await GeographicUnit.getDescendants(unitId);
        allUnits = [...allUnits, ...descendants.map(d => d._id)];
      }

      filter.geographic_unit_id = { $in: allUnits };
    }

    // Level 2 officers see overdue/escalated complaints from Level 1 in their area
    if (adminLevel === 2) {
      filter.$or = [
        { current_escalation_level: 2, status: { $in: ['OVERDUE', 'ASSIGNED', 'IN_PROGRESS'] } },
        { current_escalation_level: 1, status: 'OVERDUE' },
        { current_escalation_level: 1, status: { $nin: ['RESOLVED', 'REJECTED'] }, deadline: { $lte: new Date() } }
      ];
    }

    // Optional filters
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Level 1 officers should only see complaints matching their department.
    if (adminLevel === 1) {
      if (!req.user.department || req.user.department === 'GENERAL') {
        return res.status(403).json({
          success: false,
          message: 'Level 1 officers require a specific department to view complaints.'
        });
      }
      filter.category = req.user.department;
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen_id', 'name email phone credibility_score')
      .populate('geographic_unit_id', 'name type')
      .populate('assigned_admin', 'name email department level')
      .sort({ deadline: 1, createdAt: -1 });

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
 * @desc    Update complaint status
 * @route   PUT /api/admin/complaints/:id
 * @access  Private (ADMIN)
 */
exports.updateComplaint = async (req, res, next) => {
  try {
    const { status, admin_remarks } = req.body;

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Prevent lower-level officers from updating escalated complaints
    if (Number(req.user.level) < complaint.current_escalation_level) {
      return res.status(403).json({
        success: false,
        message: `This complaint has been escalated to Level ${complaint.current_escalation_level} and cannot be modified by Level ${req.user.level} officers.`
      });
    }

    // Assign to admin if not already assigned
    if (!complaint.assigned_admin) {
      complaint.assigned_admin = req.user._id;
    }

    // Update status
    if (status) {
      complaint.status = status;

      // Handle resolution
      if (status === 'RESOLVED') {
        complaint.resolution_date = new Date();

        // Award credibility to citizen
        await credibilityService.awardForResolved(complaint.citizen_id);
      }

      // Handle rejection
      if (status === 'REJECTED') {
        // Penalize credibility
        await credibilityService.penalizeForInvalid(complaint.citizen_id);
      }
    }

    // Update remarks
    if (admin_remarks) {
      complaint.admin_remarks = admin_remarks;
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign complaint to admin
 * @route   PUT /api/admin/complaints/:id/assign
 * @access  Private (ADMIN - Level 2, 3)
 */
exports.assignComplaint = async (req, res, next) => {
  try {
    const { admin_id } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.assigned_admin = admin_id;
    complaint.status = 'ASSIGNED';
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notice — auto-targets admin's assigned geographic units
 *          Level 2: broadcasts to ALL assigned wards (geographic_unit_ids)
 *          Level 1 / 3: targets their single assigned unit (geographic_unit_id)
 * @route   POST /api/admin/notices
 * @access  Private (ADMIN)
 */
exports.createNotice = async (req, res, next) => {
  try {
    const { title, content, type, valid_until } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required for a notice'
      });
    }

    const assignedIds = req.user.assigned_geographic_unit_ids || [];
    if (!assignedIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No assigned geographic units found for your account. Please contact an administrator.'
      });
    }

    // Default valid_until to 30 days from now if not provided
    const expiresAt = valid_until
      ? new Date(valid_until)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let notice;

    if (Number(req.user.level) === 2) {
      // ── Level 2: broadcast to ALL assigned wards ─────────────────────────
      notice = await Notice.create({
        title,
        content,
        type: type || 'GENERAL',
        geographic_unit_id: null,
        geographic_unit_ids: assignedIds,
        valid_until: expiresAt,
        created_by: req.user._id
      });
    } else {
      // ── Level 1 / Level 3: single assigned geographic unit ───────────────
      notice = await Notice.create({
        title,
        content,
        type: type || 'GENERAL',
        geographic_unit_id: assignedIds[0],
        geographic_unit_ids: [],
        valid_until: expiresAt,
        created_by: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notice posted successfully',
      notice
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Get notices for admin
 *          - Own notices (all levels)
 *          - For Level 1: also includes notices broadcast by Level 2 officers to their ward
 * @route   GET /api/admin/notices
 * @access  Private (ADMIN)
 */
exports.getAdminNotices = async (req, res, next) => {
  try {
    const myAssignedIds = (req.user.assigned_geographic_unit_ids || []);

    // Build the full set of relevant geographic unit IDs (assigned + all ancestors)
    // so that higher-level notices (Level 3 district, etc.) cascade down to Level 1/2 officers
    let allRelevantIds = [...myAssignedIds];
    for (const unitId of myAssignedIds) {
      try {
        const unit = await GeographicUnit.findById(unitId);
        if (unit) {
          const ancestors = await unit.getAncestors();
          ancestors.forEach(a => allRelevantIds.push(a._id));
        }
      } catch (_) {}
    }

    const noticeFilter = {
      $or: [
        { created_by: req.user._id },
        { geographic_unit_id: { $in: allRelevantIds } },
        { geographic_unit_ids: { $in: myAssignedIds } }
      ]
    };

    const notices = await Notice.find(noticeFilter)
      .populate('geographic_unit_id', 'name type')
      .populate('geographic_unit_ids', 'name type')
      .populate('created_by', 'name level designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get analytics for admin's jurisdiction
 * @route   GET /api/admin/analytics
 * @access  Private (ADMIN)
 */
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const allUnitIds = await getAllJurisdictionIds(req.user);
    const unitObjectIds = allUnitIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const now = new Date();

    // ── 1. KPI counts ───────────────────────────────────
    const [total, resolved, pending, overdue, inProgress, rejected] = await Promise.all([
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds } }),
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds }, status: 'RESOLVED' }),
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds }, status: 'SUBMITTED' }),
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds }, status: 'OVERDUE' }),
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds }, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ geographic_unit_id: { $in: unitObjectIds }, status: 'REJECTED' }),
    ]);

    // ── 2. By category ──────────────────────────────────
    const byCategory = await Complaint.aggregate([
      { $match: { geographic_unit_id: { $in: unitObjectIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // ── 3. By sub-area (direct children of assigned unit) ─
    const directChildrenIds = (req.user.assigned_geographic_unit_ids || [])
      .filter(id => ObjectId.isValid(id.toString()))
      .map(id => new ObjectId(id.toString()));

    const subAreaUnits = await GeographicUnit.find({ parent_id: { $in: directChildrenIds } }).select('_id name type');
    const subAreaData = await Promise.all(
      subAreaUnits.map(async (unit) => {
        // Get all descendants of this sub-area
        const desc = await GeographicUnit.getDescendants(unit._id);
        const ids = [unit._id, ...desc.map(d => d._id)];
        const count = await Complaint.countDocuments({ geographic_unit_id: { $in: ids } });
        return { name: unit.name, type: unit.type, count };
      })
    );

    // If no sub-areas, fall back to complaints per assigned unit itself
    let areaBreakdown = subAreaData.filter(a => a.count > 0);
    if (areaBreakdown.length === 0) {
      const assignedUnits = await GeographicUnit.find({ _id: { $in: directChildrenIds } }).select('name type');
      for (const unit of assignedUnits) {
        const desc = await GeographicUnit.getDescendants(unit._id);
        const ids = [unit._id, ...desc.map(d => d._id)];
        const count = await Complaint.countDocuments({ geographic_unit_id: { $in: ids } });
        areaBreakdown.push({ name: unit.name, type: unit.type, count });
      }
    }

    // ── 4. 7-day timeline ───────────────────────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const timeline = await Complaint.aggregate([
      {
        $match: {
          geographic_unit_id: { $in: unitObjectIds },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const timelineMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      timelineMap[key] = 0;
    }
    timeline.forEach(t => { timelineMap[t._id] = t.count; });
    const timelineData = Object.entries(timelineMap).map(([date, count]) => ({ date, count }));

    // ── 5. Level 3 extra metrics (district-wide) ─────────
    let slaCompliance = [];
    let escalationFrequency = [];
    let departmentPerformance = [];

    if (req.user.level === 3) {
      const Escalation = require('../models/Escalation');

      // 5a. SLA compliance per area (resolved on-time / total resolved)
      slaCompliance = await Promise.all(
        areaBreakdown.map(async (area) => {
          const areaUnit = await GeographicUnit.findOne({ name: area.name });
          if (!areaUnit) return { name: area.name, compliance: 0, resolved: 0, onTime: 0 };
          const desc = await GeographicUnit.getDescendants(areaUnit._id);
          const ids = [areaUnit._id, ...desc.map(d => d._id)];
          const resolvedList = await Complaint.find({
            geographic_unit_id: { $in: ids },
            status: 'RESOLVED',
            resolution_date: { $exists: true }
          }).select('deadline resolution_date');
          const onTime = resolvedList.filter(c => c.resolution_date <= c.deadline).length;
          return {
            name: area.name,
            resolved: resolvedList.length,
            onTime,
            compliance: resolvedList.length > 0 ? Math.round((onTime / resolvedList.length) * 100) : 100
          };
        })
      );

      // 5b. Escalation frequency per area
      escalationFrequency = await Promise.all(
        areaBreakdown.map(async (area) => {
          const areaUnit = await GeographicUnit.findOne({ name: area.name });
          if (!areaUnit) return { name: area.name, escalations: 0 };
          const desc = await GeographicUnit.getDescendants(areaUnit._id);
          const ids = [areaUnit._id, ...desc.map(d => d._id)];
          const complaintIds = await Complaint.find({ geographic_unit_id: { $in: ids } }).select('_id');
          const escCount = await Escalation.countDocuments({
            complaint_id: { $in: complaintIds.map(c => c._id) }
          });
          return { name: area.name, escalations: escCount };
        })
      );

      // 5c. Department performance across all categories in district
      const deptStats = await Complaint.aggregate([
        { $match: { geographic_unit_id: { $in: unitObjectIds } } },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } }
          }
        },
        { $sort: { total: -1 } }
      ]);
      departmentPerformance = deptStats.map(d => ({
        category: d._id,
        total: d.total,
        resolved: d.resolved,
        overdue: d.overdue,
        resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
      }));
    }

    res.status(200).json({
      success: true,
      analytics: {
        kpi: {
          total, resolved, pending, overdue, inProgress, rejected,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
        },
        byCategory,
        areaBreakdown,
        timeline: timelineData,
        // Level 3 district extras
        slaCompliance,
        escalationFrequency,
        departmentPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get manual escalations specifically (for Level 2)
 * @route   GET /api/admin/manual-escalations
 * @access  Private (ADMIN - Level 2)
 */
exports.getManualEscalations = async (req, res, next) => {
  try {
    if (req.user.level !== 2) {
      return res.status(403).json({ success: false, message: 'Only Level 2 admins can view this' });
    }

    const Escalation = require('../models/Escalation');

    // Find all manual escalations to this admin
    const escalations = await Escalation.find({
      to_admin: req.user._id,
      escalation_type: 'MANUAL'
    }).populate({
      path: 'complaint_id',
      populate: [
        { path: 'citizen_id', select: 'name email phone credibility_score' },
        { path: 'geographic_unit_id', select: 'name type' }
      ]
    }).populate('from_admin', 'name designation department').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: escalations.length,
      escalations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get escalation history for a complaint

 * @route   GET /api/admin/complaints/:id/escalations
 * @access  Private (ADMIN)
 */
exports.getEscalationHistory = async (req, res, next) => {
  try {
    const Escalation = require('../models/Escalation');
    const escalations = await Escalation.find({ complaint_id: req.params.id })
      .populate('from_admin', 'name level designation')
      .populate('to_admin', 'name level designation')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      escalations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually escalate a complaint to Level 2
 * @route   POST /api/admin/complaints/:id/escalate
 * @access  Private (ADMIN - Level 1)
 */
exports.escalateComplaint = async (req, res, next) => {
  try {
    const { reason, notes } = req.body;

    // Ensure only Level 1 can do this
    if (req.user.level !== 1) {
      return res.status(403).json({ success: false, message: 'Only Level 1 officers can manually escalate' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Fix: Allow if it's assigned to us, OR if it's unassigned but we represent the jurisdiction
    // Since verifyGeographicJurisdiction already passed, we just check if someone ELSE claimed it
    if (complaint.assigned_admin && complaint.assigned_admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This complaint is already assigned to another officer' });
    }

    // Ensure it's not resolved
    if (complaint.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Cannot escalate a resolved complaint' });
    }

    // Ensure it is Level 1 currently
    if (complaint.current_escalation_level >= 2) {
      return res.status(409).json({ success: false, message: 'Complaint is already escalated' });
    }

    // Let's get the geographic unit and its ancestors
    const geoUnit = await GeographicUnit.findById(complaint.geographic_unit_id);
    if (!geoUnit) {
      return res.status(404).json({ success: false, message: 'Geographic unit not found' });
    }

    const ancestors = await geoUnit.getAncestors();
    const ancestorIds = ancestors.map(a => a._id);
    const relevantUnitIds = [geoUnit._id, ...ancestorIds];

    // Find Level 2 admin for this branch
    const Admin = require('../models/Admin');
    const level2Admin = await Admin.findOne({
      level: 2,
      assigned_geographic_unit_ids: { $in: relevantUnitIds }
    });

    if (!level2Admin) {
      return res.status(400).json({
        success: false,
        message: 'Could not find a Level 2 authority for this region to escalate to'
      });
    }

    // Perform escalation
    complaint.current_escalation_level = 2;
    complaint.assigned_admin = level2Admin._id;
    complaint.status = 'ASSIGNED';
    await complaint.save();

    // Create Escalation Record
    const Escalation = require('../models/Escalation');
    await Escalation.create({
      complaint_id: complaint._id,
      from_level: 1,
      to_level: 2,
      from_admin: req.user._id,
      to_admin: level2Admin._id,
      reason: reason || 'MANUAL',
      notes: notes,
      escalation_type: 'MANUAL'
    });

    res.status(200).json({
      success: true,
      message: 'Complaint escalated successfully to Level 2',
      complaint
    });

  } catch (error) {
    next(error);
  }
};
