
const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/dashboard-info', authenticateToken, requireRole(['donor']), donorController.getDonorDashboardInfo);
router.get('/stations', authenticateToken, requireRole(['donor']), donorController.getStationsList);

module.exports = router;
