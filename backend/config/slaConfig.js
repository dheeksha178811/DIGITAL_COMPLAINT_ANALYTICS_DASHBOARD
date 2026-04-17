/**
 * SLA Configuration for different complaint categories
 * Maps category to SLA hours
 */
const SLA_CONFIG = {
  WATER_SUPPLY: 24,
  ELECTRICITY: 12,
  ROAD_MAINTENANCE: 48,
  GARBAGE_COLLECTION: 24,
  STREET_LIGHTING: 12,
  DRAINAGE: 36,
  PUBLIC_HEALTH: 24,
  TRAFFIC: 48,
  POLLUTION: 72,
  ILLEGAL_CONSTRUCTION: 96,
  PARKS_GARDENS: 72,
  OTHER: 48
};

/**
 * Impact level thresholds based on vote count
 */
const IMPACT_THRESHOLDS = {
  LOW: 5,
  MODERATE: 20,
  HIGH: 50,
  CRITICAL: 100
};

/**
 * Escalation level configuration
 */
const ESCALATION_LEVELS = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3
};

module.exports = {
  SLA_CONFIG,
  IMPACT_THRESHOLDS,
  ESCALATION_LEVELS
};
