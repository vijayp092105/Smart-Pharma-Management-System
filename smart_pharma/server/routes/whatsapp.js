const express = require('express');
const router = express.Router();
const { processQuery } = require('../botEngine');

// POST /whatsapp/incoming
// This is the webhook URL you would put into Twilio Console
router.post('/incoming', async (req, res) => {
    try {
        console.log('--- WHATSAPP WEBHOOK HIT ---');
        console.log('Body:', req.body);
        const incomingMsg = req.body.Body || '';
        console.log('User said:', incomingMsg);

        // 1. Process with AI Engine
        const botResponse = await processQuery(incomingMsg);

        // 2. Format for WhatsApp (Generic Text)
        // Manual TwiML generation to avoid 'twilio' package dependency

        const message = `${botResponse.answer} \n\n${botResponse.action ? `💡 Tip: ${botResponse.action}` : ''} `;

        // Return TwiML XML style for Twilio
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${message}</Message>
</Response>`);

    } catch (err) {
        console.error("WhatsApp Error:", err);
        res.status(500).send('Error processing');
    }
});

module.exports = router;
