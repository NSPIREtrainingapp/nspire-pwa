const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // GoHighLevel Settings
    ghlApiBase: process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com',
    ghlToken: process.env.GHL_TOKEN,
    ghlLocationId: process.env.GHL_LOCATION_ID,
    
    // App Settings
    renewUrl: process.env.RENEW_URL || 'https://your-customer-portal.com/renew',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@nspiretrainingapp.com',
    sessionTtlHours: parseInt(process.env.SESSION_TTL_HOURS) || 24,
    graceTtlHours: parseInt(process.env.GRACE_TTL_HOURS) || 168, // 7 days
    loginTimeoutMs: parseInt(process.env.LOGIN_TIMEOUT_MS) || 1200,
    
    // Security
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
};

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));

app.use(express.json());

// ============================================
// GHL CLIENT
// ============================================

class GHLClient {
    constructor() {
        this.baseUrl = CONFIG.ghlApiBase;
        this.token = CONFIG.ghlToken;
        this.locationId = CONFIG.ghlLocationId;
    }

    async makeRequest(endpoint, method = 'GET', data = null, timeout = CONFIG.loginTimeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28'
                },
                signal: controller.signal
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async searchContactByEmail(email) {
        try {
            const response = await this.makeRequest('/contacts/search', 'POST', {
                locationId: this.locationId,
                query: email
            });
            
            const contacts = response.contacts || [];
            const contact = contacts.find(c => 
                c.email && c.email.toLowerCase() === email.toLowerCase()
            );
            
            return contact?.id || null;
        } catch (error) {
            console.error('Error searching contact:', error);
            return null;
        }
    }

    async listSubscriptionsByContact(contactId) {
        try {
            const response = await this.makeRequest(`/payments/subscriptions?contact=${contactId}`);
            return response.subscriptions || [];
        } catch (error) {
            console.error('Error getting subscriptions:', error);
            return [];
        }
    }

    normalizeSubscriptionStatus(subscription) {
        const now = new Date();
        const status = subscription.status || 'inactive';
        const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
        
        const active = ['active', 'trialing'].includes(status) && 
                      (!currentPeriodEnd || now < currentPeriodEnd);
        
        return {
            active,
            plan: subscription.priceName || subscription.productName || 'unknown',
            trialEndsAt: subscription.trialEnd || null
        };
    }

    async logActivity(contactId, activity) {
        try {
            await this.makeRequest(`/contacts/${contactId}/notes`, 'POST', {
                body: `NSPIRE App: ${activity} - ${new Date().toISOString()}`,
                userId: contactId
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Non-blocking - don't throw
        }
    }
}

const ghlClient = new GHLClient();

// ============================================
// DEMO USER DATABASE (Replace with real DB)
// ============================================

const DEMO_USERS = {
    'demo@nspire.app': {
        id: 'demo_user_123',
        email: 'demo@nspire.app',
        passwordHash: bcrypt.hashSync('demo123', 10),
        ghlContactId: 'demo_contact_123'
    }
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, CONFIG.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// API ENDPOINTS
// ============================================

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Step 1: Lookup user in database (demo implementation)
        const user = DEMO_USERS[email.toLowerCase()];
        if (!user) {
            return res.status(403).json({ error: 'No account found' });
        }

        // Step 2: Verify password
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Step 3: Get GHL contact ID
        let ghlContactId = user.ghlContactId;
        if (!ghlContactId) {
            ghlContactId = await ghlClient.searchContactByEmail(email);
            if (!ghlContactId) {
                return res.status(403).json({ error: 'No account found' });
            }
        }

        // Step 4: Check subscription status
        const subscriptions = await ghlClient.listSubscriptionsByContact(ghlContactId);
        const latestSubscription = subscriptions.length > 0 ? subscriptions[subscriptions.length - 1] : null;
        
        let membershipStatus = { active: false, plan: 'none', trialEndsAt: null };
        if (latestSubscription) {
            membershipStatus = ghlClient.normalizeSubscriptionStatus(latestSubscription);
        }

        // Step 5: Create session token
        const tokenPayload = {
            userId: user.id,
            ghlContactId,
            membership: membershipStatus,
            lastVerifiedAt: new Date().toISOString()
        };

        const token = jwt.sign(tokenPayload, CONFIG.jwtSecret, { 
            expiresIn: `${CONFIG.sessionTtlHours}h` 
        });

        // Step 6: Log activity (non-blocking)
        ghlClient.logActivity(ghlContactId, `Login from ${req.ip}`);

        // Step 7: Return response
        res.json({
            token,
            active: membershipStatus.active,
            plan: membershipStatus.plan,
            trialEndsAt: membershipStatus.trialEndsAt,
            renewUrl: CONFIG.renewUrl,
            userId: user.id
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/membership/status
app.get('/api/membership/status', authenticateToken, async (req, res) => {
    try {
        const { ghlContactId, membership, lastVerifiedAt } = req.user;
        const lastVerified = new Date(lastVerifiedAt);
        const now = new Date();
        const minutesSinceVerification = (now - lastVerified) / (1000 * 60);

        // Use cached data if recent enough (< 60 minutes)
        if (minutesSinceVerification < 60) {
            return res.json({
                active: membership.active,
                plan: membership.plan,
                trialEndsAt: membership.trialEndsAt,
                graceMode: false
            });
        }

        // Need fresh verification
        try {
            const subscriptions = await ghlClient.listSubscriptionsByContact(ghlContactId);
            const latestSubscription = subscriptions.length > 0 ? subscriptions[subscriptions.length - 1] : null;
            
            let membershipStatus = { active: false, plan: 'none', trialEndsAt: null };
            if (latestSubscription) {
                membershipStatus = ghlClient.normalizeSubscriptionStatus(latestSubscription);
            }

            // Update token with new verification time
            const newTokenPayload = {
                ...req.user,
                membership: membershipStatus,
                lastVerifiedAt: now.toISOString()
            };

            const newToken = jwt.sign(newTokenPayload, CONFIG.jwtSecret, { 
                expiresIn: `${CONFIG.sessionTtlHours}h` 
            });

            res.json({
                active: membershipStatus.active,
                plan: membershipStatus.plan,
                trialEndsAt: membershipStatus.trialEndsAt,
                graceMode: false,
                newToken // Client should update stored token
            });

        } catch (ghlError) {
            console.error('GHL verification failed:', ghlError);
            
            // Check if we're within grace period
            const hoursSinceVerification = (now - lastVerified) / (1000 * 60 * 60);
            
            if (membership.active && hoursSinceVerification <= CONFIG.graceTtlHours) {
                // Allow grace access
                res.json({
                    active: true,
                    plan: membership.plan,
                    trialEndsAt: membership.trialEndsAt,
                    graceMode: true
                });
            } else {
                res.status(503).json({ 
                    active: false, 
                    error: 'verification_failed' 
                });
            }
        }

    } catch (error) {
        console.error('Membership status error:', error);
        res.status(500).json({ error: 'Failed to check membership status' });
    }
});

// POST /api/activity/login (optional)
app.post('/api/activity/login', authenticateToken, async (req, res) => {
    try {
        const { ghlContactId } = req.user;
        const { deviceInfo } = req.body;
        
        const activity = `Login activity - Device: ${deviceInfo || 'Unknown'} - IP: ${req.ip}`;
        await ghlClient.logActivity(ghlContactId, activity);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Activity logging failed:', error);
        res.json({ success: false }); // Don't fail the request
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'nspire-auth-backend',
        config: {
            ghlConfigured: !!(CONFIG.ghlToken && CONFIG.ghlLocationId),
            jwtConfigured: !!CONFIG.jwtSecret
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 NSPIRE Authentication Backend running on port ${PORT}`);
    console.log(`🔐 JWT Authentication: ${CONFIG.jwtSecret ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📡 GoHighLevel Integration: ${CONFIG.ghlToken ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`� Health check: http://localhost:${PORT}/health`);
});

module.exports = app;