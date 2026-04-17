const mongoose = require('mongoose');
const Complaint = require('../../models/Complaint');
const Escalation = require('../../models/Escalation');
const Admin = require('../../models/Admin');
const GeographicUnit = require('../../models/GeographicUnit');

/**
 * @desc    Build full jurisdiction unit IDs for an admin
 * @param   {Object} user Logged-in admin user
 * @returns {Array|null} Geographic unit ObjectIds
 */
const getJurisdictionUnitIds = async (user) => {
    if (!user || user.role !== 'ADMIN' || !user.assigned_geographic_unit_ids?.length) {
        return null;
    }

    const unitIds = [...user.assigned_geographic_unit_ids.map(id => id.toString())];

    for (const unitId of user.assigned_geographic_unit_ids) {
        const descendants = await GeographicUnit.getDescendants(unitId);
        descendants.forEach((desc) => {
            unitIds.push(desc._id.toString());
        });
    }

    return [...new Set(unitIds)].map(id => new mongoose.Types.ObjectId(id));
};

const getJurisdictionAdmins = async (jurisdictionUnitIds) => {
    if (!jurisdictionUnitIds || jurisdictionUnitIds.length === 0) {
        return [];
    }

    return await Admin.find({
        level: 1,
        assigned_geographic_unit_ids: { $in: jurisdictionUnitIds }
    }).select('name designation level department assigned_geographic_unit_ids');
};

/**
 * @desc    Calculate and return performance metrics for a specific admin or all admins
 * @param   {String} id (Optional) Admin ID
 * @param   {Object} user Logged-in user context
 * @returns {Array|Object} Metrics
 */
const getPerformanceMetrics = async (adminId = null, user = null) => {
    // 1. Base Match for Complaints
    const matchStage = { assigned_admin: { $exists: true, $ne: null } };
    if (adminId) {
        matchStage.assigned_admin = new mongoose.Types.ObjectId(adminId);
    }

    // Limit Level 2 / Level 3 admins to complaints inside their assigned geographic jurisdiction.
    const jurisdictionUnitIds = await getJurisdictionUnitIds(user);
    if (jurisdictionUnitIds && jurisdictionUnitIds.length > 0) {
        matchStage.geographic_unit_id = { $in: jurisdictionUnitIds };
    }

    let jurisdictionAdmins = [];
    if (!adminId && user && user.role === 'ADMIN' && Number(user.level) === 2) {
        jurisdictionAdmins = await getJurisdictionAdmins(jurisdictionUnitIds);
        if (jurisdictionAdmins.length > 0) {
            matchStage.assigned_admin = { $in: jurisdictionAdmins.map(a => a._id) };
        }
    }

    // 2. Aggregate Complaints
    const complaintStats = await Complaint.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$assigned_admin',
                totalComplaints: { $sum: 1 },
                resolvedComplaints: {
                    $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
                },
                // Calculate resolution time ONLY if resolved and dates exist
                totalResolutionTimeMs: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'RESOLVED'] }, { $ne: ['$resolution_date', null] }] },
                            { $subtract: ['$resolution_date', '$createdAt'] },
                            0
                        ]
                    }
                },
                // Check if resolved before deadline
                slaMetCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$status', 'RESOLVED'] },
                                    { $ne: ['$resolution_date', null] },
                                    { $lte: ['$resolution_date', '$deadline'] }
                                ]
                            },
                            1, 0
                        ]
                    }
                }
            }
        }
    ]);

    // 3. Get Escalation Counts per Admin (both AUTO and MANUAL caused by them)
    // i.e., they were the `from_admin` when the complaint escalated
    const escMatch = { from_admin: { $exists: true, $ne: null } };
    if (adminId) {
        escMatch.from_admin = new mongoose.Types.ObjectId(adminId);
    }

    const escalationStats = await Escalation.aggregate([
        { $match: escMatch },
        {
            $group: {
                _id: '$from_admin',
                escalationsCaused: { $sum: 1 }
            }
        }
    ]);

    // 4. Map them together and calculate scores
    // If bulk, we also populate Admin details (Name, designation)
    const adminIds = complaintStats.map(s => s._id);
    let admins = await Admin.find({ _id: { $in: adminIds } }).select('name designation level department');

    // Ensure all Level 1 admins under the Level 2 jurisdiction are available in the admin map,
    // even if they have zero aggregated complaints yet.
    if (jurisdictionAdmins.length > 0) {
        const existingAdminIds = admins.map(a => a._id.toString());
        jurisdictionAdmins.forEach((admin) => {
            if (!existingAdminIds.includes(admin._id.toString())) {
                admins.push(admin);
            }
        });
    }

    // Handle cross-collection references: Super Admins or Analysts in the User collection
    const foundAdminIds = admins.map(a => a._id.toString());
    const missingIds = adminIds.filter(id => !foundAdminIds.includes(id.toString()));

    if (missingIds.length > 0) {
        const User = require('../../models/User');
        const extraUsers = await User.find({ _id: { $in: missingIds } }).select('name role');
        extraUsers.forEach(u => {
            admins.push({
                _id: u._id,
                name: u.name,
                department: u.role,
                level: null
            });
        });
    }

    const adminMap = admins.reduce((acc, a) => {
        acc[a._id.toString()] = a;
        return acc;
    }, {});

    if (jurisdictionAdmins.length > 0) {
        const complaintAdminIds = complaintStats.map(s => s._id.toString());
        jurisdictionAdmins.forEach((admin) => {
            const adminIdStr = admin._id.toString();
            if (!complaintAdminIds.includes(adminIdStr)) {
                complaintStats.push({
                    _id: admin._id,
                    totalComplaints: 0,
                    resolvedComplaints: 0,
                    totalResolutionTimeMs: 0,
                    slaMetCount: 0
                });
            }
        });
    }

    const escMap = escalationStats.reduce((acc, es) => {
        acc[es._id.toString()] = es.escalationsCaused;
        return acc;
    }, {});

    const results = complaintStats.map(stat => {
        const adminStrId = stat._id.toString();
        const adminInfo = adminMap[adminStrId];

        const total = stat.totalComplaints;
        const resolved = stat.resolvedComplaints;
        const slaMet = stat.slaMetCount;
        const msTotal = stat.totalResolutionTimeMs;
        const escalations = escMap[adminStrId] || 0;

        console.log(`[PERFORMANCE] Mapped stat._id ${adminStrId} -> adminInfo exists: ${!!adminInfo}`);

        // Averages and percentages
        const avgResolutionTimeHours = resolved > 0 ? (msTotal / resolved) / (1000 * 60 * 60) : 0;
        const efficiency = total > 0 ? (resolved / total) : 0; // 0-1
        const slaCompliance = resolved > 0 ? (slaMet / resolved) * 100 : 0; // 0-100
        const escalationRate = total > 0 ? (escalations / total) : 0; // 0-1

        // Formula: (efficiency * 40) + (slaCompliance * 0.4) - (escalationRate * 20)
        const rawScore = (efficiency * 40) + (slaCompliance * 0.4) - (escalationRate * 20);

        // Normalize to 0-100 (Max mathematical raw score is 80)
        const performanceScore = Math.max(0, Math.min(100, Math.round((rawScore / 80) * 100)));

        return {
            adminId: stat._id,
            adminName: adminInfo ? adminInfo.name : 'DEEPTHI',
            department: adminInfo ? adminInfo.department : 'ADMIN',
            level: adminInfo ? adminInfo.level : 1,
            totalComplaints: total,
            resolvedComplaints: resolved,
            avgResolutionTimeHours: parseFloat(avgResolutionTimeHours.toFixed(2)),
            slaCompliance: parseFloat(slaCompliance.toFixed(1)),
            escalations,
            performanceScore
        };
    });

    // Sort by score descending
    results.sort((a, b) => b.performanceScore - a.performanceScore);

    // For Level 2 officers, restrict the visible metrics to departmental officers within their region.
    if (user && user.role === 'ADMIN' && Number(user.level) === 2) {
        return results.filter((item) => item.level === 1);
    }

    return adminId ? results[0] || null : results;
};


/**
 * @desc    Get bulk performance for all officers
 * @route   GET /api/analytics/officer-performance
 * @access  Private (Level 2, 3, Analyst, Super Admin)
 */
exports.getBulkPerformance = async (req, res, next) => {
    try {
        // Security verification: Block Level 1
        if (req.user.role === 'ADMIN' && req.user.level === 1) {
            return res.status(403).json({ success: false, message: 'Not authorized to view bulk performance.' });
        }

        const metrics = await getPerformanceMetrics(null, req.user);

        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (err) {
        next(err);
    }
};


/**
 * @desc    Get self performance
 * @route   GET /api/analytics/officer-performance/:adminId
 * @access  Private (Self or Higher Roles)
 */
exports.getSinglePerformance = async (req, res, next) => {
    try {
        const targetAdminId = req.params.adminId;

        // Security: Only allow if it's the requesting user themselves, or the requesting user is a higher authority
        const isSelf = req.user._id.toString() === targetAdminId;
        const isHigherAuth = req.user.role === 'GOVERNMENT_ANALYST' || req.user.role === 'SUPER_ADMIN' || (req.user.role === 'ADMIN' && req.user.level > 1);

        if (!isSelf && !isHigherAuth) {
            return res.status(403).json({ success: false, message: 'Not authorized to view another officer\'s performance.' });
        }

        const metric = await getPerformanceMetrics(targetAdminId, req.user);

        let payload = metric;

        // If no complaints mapped yet, construct a zeroed payload with their actual details to avoid "Unknown / N/A"
        if (!payload || !payload.adminName || payload.adminName === 'Unknown') {
            console.log(`[PERFORMANCE] Building fallback payload for ${targetAdminId}.`);
            let adminInfo = await Admin.findById(targetAdminId).select('name department level');

            // If not found in Admin collection, try User collection
            if (!adminInfo) {
                const User = require('../../models/User');
                const userInfo = await User.findById(targetAdminId).select('name role');
                if (userInfo) {
                    adminInfo = {
                        name: userInfo.name,
                        department: userInfo.role,
                        level: null
                    };
                }
            }

            payload = {
                adminId: targetAdminId,
                adminName: adminInfo ? adminInfo.name : 'DEEPTHI',
                department: adminInfo ? adminInfo.department : 'ADMIN',
                level: adminInfo ? adminInfo.level : 1,
                totalComplaints: payload ? payload.totalComplaints : 0,
                resolvedComplaints: payload ? payload.resolvedComplaints : 0,
                avgResolutionTimeHours: payload ? payload.avgResolutionTimeHours : 0,
                slaCompliance: payload ? payload.slaCompliance : 0,
                escalations: payload ? payload.escalations : 0,
                performanceScore: payload ? payload.performanceScore : 0
            };
        }

        res.status(200).json({
            success: true,
            data: payload
        });
    } catch (err) {
        next(err);
    }
};
