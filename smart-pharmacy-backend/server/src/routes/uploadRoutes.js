const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// GET /api/upload - show usage for browsers/testers
router.get('/', (req, res) => {
  return res.json({
    message: 'Use POST /api/upload to upload a CSV/XLSX file.',
    usage: {
      method: 'POST',
      field: 'file (multipart/form-data)',
      optionalBody: { datasetType: 'drugs|patients|doctors|suppliers|prescriptions|insurance|auto' }
    }
  });
});

// POST /api/upload - Upload CSV/Excel file
router.post('/', uploadController.uploadFile);

// GET /api/upload/history - Get upload history
router.get('/history', uploadController.getUploadHistory);

module.exports = router;
