const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/stock', authenticateToken, requireRole(['warehouse']), warehouseController.getStockLevels);
router.get('/requests', authenticateToken, requireRole(['warehouse']), warehouseController.getIncomingRequests);
router.post('/requests/:id/fulfill', authenticateToken, requireRole(['warehouse']), warehouseController.fulfillHospitalRequest);
router.post('/announcements', authenticateToken, requireRole(['warehouse']), warehouseController.createAnnouncement);
router.get('/announcements', authenticateToken, requireRole(['warehouse']), warehouseController.getWarehouseAnnouncements);
router.post('/emergency-alert', authenticateToken, requireRole(['warehouse']), warehouseController.sendEmergencyStockAlert);
router.get('/expiring-soon', authenticateToken, requireRole(['warehouse']), warehouseController.getExpiringBags);

module.exports = router;
