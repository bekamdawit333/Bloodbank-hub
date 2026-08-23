
const express = require('express');
const router = express.Router();
const donorController = require('./donor.controller');
const { authenticateToken, requireRole } = require('../../shared/middleware/auth');

router.get('/dashboard-info', authenticateToken, requireRole(['donor']), donorController.getDonorDashboardInfo);
router.get('/stations', authenticateToken, requireRole(['donor']), donorController.getStationsList);
router.get('/messages', authenticateToken, requireRole(['donor']), donorController.getDonorMessages);
router.get('/history', authenticateToken, requireRole(['donor']), donorController.getDonorHistory);

module.exports = router;
