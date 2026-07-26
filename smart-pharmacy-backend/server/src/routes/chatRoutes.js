const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/', (req, res) => res.json({ message: 'Use POST /api/chat with JSON { "message": "..." }' }));
router.post('/', chatController.processMessage.bind(chatController));
router.get('/history', chatController.getChatHistory.bind(chatController));

module.exports = router;
