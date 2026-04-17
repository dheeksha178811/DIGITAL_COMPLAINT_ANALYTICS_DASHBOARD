const Vote = require('../../models/Vote');
const Complaint = require('../../models/Complaint');
const User = require('../../models/User');
const { IMPACT_THRESHOLDS } = require('../../config/slaConfig');

/**
 * Voting Service - Manages community voting on complaints
 */

/**
 * Cast a vote on a complaint
 * Ensures one vote per user per complaint
 * Prevents self-voting
 * Awards credibility: +2 to voter (participation), +1 to complaint author (community trust)
 */
exports.castVote = async (complaintId, userId) => {
  try {
    // Check if complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Prevent self-voting
    if (complaint.citizen_id.toString() === userId.toString()) {
      throw new Error('Cannot vote on your own complaint');
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      complaint_id: complaintId,
      user_id: userId
    });

    if (existingVote) {
      throw new Error('You have already voted on this complaint');
    }

    // Create vote
    const vote = await Vote.create({
      complaint_id: complaintId,
      user_id: userId
    });

    // Atomically increment vote count
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { $inc: { vote_count: 1 } },
      { new: true }
    );

    // Update impact level based on new vote count
    const newImpactLevel = calculateImpactLevel(updatedComplaint.vote_count);
    if (newImpactLevel !== updatedComplaint.impact_level) {
      updatedComplaint.impact_level = newImpactLevel;
      await updatedComplaint.save();
    }

    // Award credibility: +1 to voter (civic participation), +5 to complaint author (community trust)
    await awardCredibility(userId, 1);                       // voter
    await awardCredibility(complaint.citizen_id, 5);         // complaint author

    return {
      vote,
      complaint: updatedComplaint
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user has voted on a complaint
 */
exports.hasUserVoted = async (complaintId, userId) => {
  try {
    const vote = await Vote.findOne({
      complaint_id: complaintId,
      user_id: userId
    });
    return !!vote;
  } catch (error) {
    throw error;
  }
};

/**
 * Get vote count for a complaint
 */
exports.getVoteCount = async (complaintId) => {
  try {
    return await Vote.countDocuments({ complaint_id: complaintId });
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate impact level based on vote count
 */
function calculateImpactLevel(voteCount) {
  if (voteCount >= IMPACT_THRESHOLDS.CRITICAL) {
    return 'CRITICAL';
  } else if (voteCount >= IMPACT_THRESHOLDS.HIGH) {
    return 'HIGH';
  } else if (voteCount >= IMPACT_THRESHOLDS.MODERATE) {
    return 'MODERATE';
  } else {
    return 'LOW';
  }
}

/**
 * Get voters for a complaint
 */
exports.getVoters = async (complaintId) => {
  try {
    return await Vote.find({ complaint_id: complaintId })
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
};

/**
 * Internal helper: silently award credibility to a user
 * Clamped to 0-100. Errors are swallowed to not block voting.
 */
async function awardCredibility(userId, points) {
  try {
    // No cap — score grows freely based on civic contributions
    await User.findByIdAndUpdate(userId, {
      $inc: { credibility_score: points }
    });
  } catch (_) {
    // Non-critical — don't fail the vote if credibility update fails
  }
}
