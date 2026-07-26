const express = require('express');
const router = express.Router();
const alertService = require('../services/alertsService');
const alertController = require('../controllers/alertController');

// POST /api/alerts/check - Manually check for alerts
router.post('/check', async (req, res) => {
  try {
    const alerts = await alertService.checkAndSendAlerts();
    res.json({
      success: true,
      message: `Checked and sent ${alerts.length} alerts`,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/alerts/recent - Get recent alerts
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const alerts = await alertService.getRecentAlerts(limit);
    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/alerts/:id/resolve - Mark alert as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const resolved = await alertService.markAlertResolved(req.params.id);
    if (resolved) {
      res.json({
        success: true,
        message: 'Alert marked as resolved'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;