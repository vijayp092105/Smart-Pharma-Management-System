const express = require('express');
const router = express.Router();

// Import route modules
const dashboardRoutes = require('./dashboardRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const uploadRoutes = require('./uploadRoutes');
const chatRoutes = require('./chatRoutes');
const alertRoutes = require('./alertRoutes');

// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);
router.use('/alerts', alertRoutes);

module.exports = router;