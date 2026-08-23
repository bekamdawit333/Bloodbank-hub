const express = require('express');
const router = express.Router();
const { getNotifications } = require('./notifications.controller');
const { authenticateToken } = require('../../shared/middleware/auth');

router.get('/', authenticateToken, getNotifications);

module.exports = router;
