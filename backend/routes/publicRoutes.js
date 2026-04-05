const express = require('express');
const router = express.Router();
const {
  getPublicStats,
  getPublicNotices,
  getGeographicUnits,
  getGeographicHierarchy
} = require('../controllers/publicController');

// All routes are public
router.get('/stats', getPublicStats);
router.get('/notices', getPublicNotices);
router.get('/geographic-units', getGeographicUnits);
router.get('/geographic-units/:id/hierarchy', getGeographicHierarchy);

module.exports = router;
