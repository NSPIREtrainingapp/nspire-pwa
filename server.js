const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));

// Raw body parser for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// GHL Public Key (get this from GoHighLevel documentation)
const GHL_PUBLIC_KEY = process.env.GHL_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

// Webhook signature verification middleware
function verifyGHLSignature(req, res, next) {
    try {
        const signature = req.headers['x-wh-signature'];
        const body = req.body;
        
        if (!signature) {
            console.log('⚠️ Missing webhook signature');
            return res.status(401).json({ error: 'Missing signature' });
        }
        
        // Create verifier
        const verifier = crypto.createVerify('SHA256');
        verifier.update(body);
        
        // Verify signature with GHL public key
        const isValid = verifier.verify(GHL_PUBLIC_KEY, signature, 'base64');
        
        if (!isValid) {
            console.log('🚫 Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        console.log('✅ Webhook signature verified');
        
        // Parse body for processing
        req.body = JSON.parse(body.toString());
        next();
    } catch (error) {
        console.error('💥 Signature verification error:', error);
        return res.status(401).json({ error: 'Signature verification failed' });
    }
}

// GHL Webhook endpoints
app.post('/webhooks/contact-update', verifyGHLSignature, (req, res) => {
    // Respond quickly to avoid timeout (< 5 seconds)
    res.status(200).json({ received: true, timestamp: new Date().toISOString() });
    
    // Process asynchronously
    setImmediate(() => processContactUpdate(req.body));
});

app.post('/webhooks/subscription-change', verifyGHLSignature, (req, res) => {
    // Respond quickly to avoid timeout
    res.status(200).json({ received: true, timestamp: new Date().toISOString() });
    
    // Process asynchronously
    setImmediate(() => processSubscriptionChange(req.body));
});

// API endpoints for PWA authentication
app.get('/api/user/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`🔍 Checking status for user: ${userId}`);
        
        // TODO: Replace with actual database query
        const userStatus = await getUserStatus(userId);
        res.json(userStatus);
    } catch (error) {
        console.error('💥 Error getting user status:', error);
        res.status(500).json({ error: 'Failed to get user status' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.body;
        console.log('🔐 Verifying user token');
        
        // TODO: Verify with GHL API or your database
        const user = await verifyUserToken(token);
        res.json({ valid: true, user });
    } catch (error) {
        console.error('💥 Token verification failed:', error);
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'nspire-backend'
    });
});

// Async processing functions
async function processContactUpdate(payload) {
    try {
        console.log('📧 Processing contact update:', payload.type || 'contact_update');
        
        // TODO: Implement contact update logic
        // - Update user database
        // - Send notifications
        // - Update subscription status if needed
        
    } catch (error) {
        console.error('💥 Error processing contact update:', error);
    }
}

async function processSubscriptionChange(payload) {
    try {
        console.log('💳 Processing subscription change:', payload.type || 'subscription_change');
        
        // TODO: Implement subscription logic
        // - Update user subscription status
        // - Grant/revoke app access
        // - Send confirmation emails
        // - Log billing events
        
    } catch (error) {
        console.error('💥 Error processing subscription change:', error);
    }
}

// TODO: Implement these functions with your chosen database
async function getUserStatus(userId) {
    // Mock response - replace with real database query
    return {
        userId,
        subscriptionActive: true,
        planType: 'premium',
        expiresAt: '2025-12-31T23:59:59Z',
        lastChecked: new Date().toISOString()
    };
}

async function verifyUserToken(token) {
    // Mock response - replace with GHL API call or database query
    return {
        id: 'user_' + Date.now(),
        email: 'user@example.com',
        subscriptionActive: true,
        verified: true
    };
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 NSPIRE Backend running on port ${PORT}`);
    console.log(`🔐 Webhook signature verification: ${GHL_PUBLIC_KEY ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;