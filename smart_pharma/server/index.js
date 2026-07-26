const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const apiRoutes = require('./routes/api');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio WhatsApp Messages
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize DB
initDatabase();

// Routes
app.use('/api', apiRoutes);
app.use('/whatsapp', whatsappRoutes); // Exposes http://localhost:5000/whatsapp/incoming

// Basic health check
app.get('/', (req, res) => {
    res.send('Smart Pharma Backend is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
