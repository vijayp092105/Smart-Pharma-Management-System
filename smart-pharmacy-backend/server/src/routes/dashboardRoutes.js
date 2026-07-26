const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const analyticsService = require('../services/analyticsService');

router.get('/', dashboardController.getDashboardData.bind(dashboardController));

module.exports = router;
