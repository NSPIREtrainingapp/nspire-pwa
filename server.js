const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const membershipRoutes = require('./routes/membership');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// SECURITY & MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api', membershipRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'NSPIRE Training App - Authentication Backend',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            login: 'POST /api/login',
            membershipStatus: 'GET /api/membership/status',
            activityLog: 'POST /api/activity/login',
            health: 'GET /api/health'
        }
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('💥 Unhandled server error:', error);
    
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log('\n🚀 NSPIRE Authentication Backend Started');
    console.log('==========================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'CONFIGURED ✅' : 'MISSING ❌'}`);
    console.log(`📍 GHL Location: ${process.env.GHL_LOCATION_ID ? 'CONFIGURED ✅' : 'MISSING ❌'}`);
    console.log(`🔑 GHL Token: ${process.env.GHL_TOKEN ? 'CONFIGURED ✅' : 'MISSING ❌'}`);
    console.log(`💳 Renewal URL: ${process.env.RENEW_URL || 'NOT SET'}`);
    console.log(`📧 Support Email: ${process.env.SUPPORT_EMAIL || 'NOT SET'}`);
    console.log('\n🔗 Available endpoints:');
    console.log(`   • Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   • Login: POST http://localhost:${PORT}/api/login`);
    console.log(`   • Status: GET http://localhost:${PORT}/api/membership/status`);
    console.log('\n🧪 Demo credentials: demo@nspire.app / demo123');
    console.log('==========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;