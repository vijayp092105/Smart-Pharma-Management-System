// server/src/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Index - list available datasets (helps avoid calling :dataset literally)
router.get('/', (req, res) => {
  return res.json({
    success: true,
    availableDatasets: ['drugs', 'suppliers', 'patients', 'doctors', 'prescriptions', 'insurance', 'alerts'],
    note: 'Use /api/inventory/:dataset — e.g. /api/inventory/drugs?search=lipitor'
  });
});

// ALERTS FIRST (specific)
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts.bind(inventoryController));
router.get('/alerts/expiry', inventoryController.getExpiryAlerts.bind(inventoryController));

// DRUG SEARCH (specific)
router.get('/drugs', inventoryController.getDrugsData.bind(inventoryController));

// GENERIC dataset route (last, and defensive)
router.get('/:dataset', inventoryController.getInventoryData.bind(inventoryController));

module.exports = router;
