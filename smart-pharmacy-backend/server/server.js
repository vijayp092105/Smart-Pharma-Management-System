const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize, testConnection } = require('./src/config/database');

// Load environment variables
dotenv.config();

// Import routes
const apiRoutes = require('./src/routes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await sequelize.authenticate();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      error: 'Database connection failed',
      message: 'Please try again later'
    });
  }
});

// Basic routes
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Smart Pharmacy Backend',
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Smart Pharmacy Management System API',
    endpoints: {
      health: 'GET /api/health',
      dashboard: 'GET /api/dashboard',
      inventory: 'GET /api/inventory/:dataset',
      upload: 'POST /api/upload',
      chat: 'POST /api/chat',
      alerts: 'GET /api/alerts'
    },
    documentation: 'All API endpoints return JSON. Use proper Content-Type headers.'
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/api/health',
      '/api',
      '/api/dashboard',
      '/api/inventory/:dataset',
      '/api/upload',
      '/api/chat',
      '/api/alerts'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server with database check
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server: Database connection failed');
      process.exit(1);
    }
    
    // Sync database models (optional - for development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synced');
    }
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
      🚀 Smart Pharmacy Backend Server Started!
      
      📍 Environment: ${process.env.NODE_ENV}
      ⏰ Started at: ${new Date().toLocaleString()}
      
      🔍 Available Endpoints:
        • Health Check: http://localhost:${PORT}/api/health
        • API Docs: http://localhost:${PORT}/api
        • Dashboard: http://localhost:${PORT}/api/dashboard
        • Inventory: http://localhost:${PORT}/api/inventory/:dataset
        • Upload: http://localhost:${PORT}/api/upload
        • Chat: http://localhost:${PORT}/api/chat
        • Alerts: http://localhost:${PORT}/api/alerts
      
      🔗 Frontend URL: ${process.env.FRONTEND_URL}
      💾 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}
      📈 Data Loaded: Ready for frontend integration
      `);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();