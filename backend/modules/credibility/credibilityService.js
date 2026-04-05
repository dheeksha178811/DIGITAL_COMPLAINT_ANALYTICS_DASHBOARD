const User = require('../../models/User');

/**
 * Credibility Service - Manages user credibility scoring
 */

/**
 * Update user credibility score
 * +5 on resolved, -10 on invalid/rejected
 * Clamped between 0-100
 */
exports.updateCredibility = async (userId, change) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // No cap — score grows freely based on civic activity
    user.credibility_score = user.credibility_score + change;
    if (user.credibility_score < 0) user.credibility_score = 0; // floor at 0
    await user.save();

    console.log(`User ${userId} credibility updated: ${change > 0 ? '+' : ''}${change} (now: ${user.credibility_score})`);

    return user.credibility_score;
  } catch (error) {
    console.error('Error updating credibility:', error);
    throw error;
  }
};

/**
 * Award credibility for resolved complaint
 */
exports.awardForResolved = async (userId) => {
  return await exports.updateCredibility(userId, 10);
};

/**
 * Penalize for invalid/rejected complaint
 */
exports.penalizeForInvalid = async (userId) => {
  return await exports.updateCredibility(userId, -10);
};

/**
 * Get credibility score
 */
exports.getCredibility = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.credibility_score;
  } catch (error) {
    console.error('Error getting credibility:', error);
    throw error;
  }
};

/**
 * Get credibility tier
 */
exports.getCredibilityTier = (score) => {
  if (score >= 80) {
    return { tier: 'EXCELLENT', color: 'green' };
  } else if (score >= 60) {
    return { tier: 'GOOD', color: 'blue' };
  } else if (score >= 40) {
    return { tier: 'FAIR', color: 'yellow' };
  } else if (score >= 20) {
    return { tier: 'POOR', color: 'orange' };
  } else {
    return { tier: 'CRITICAL', color: 'red' };
  }
};
