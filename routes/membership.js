/**
 * Membership & Authentication Routes
 * Handles user login and subscription verification
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ghlClient = require('../ghlClient');

const router = express.Router();

// ============================================
// DEMO USER DATABASE (Replace with real DB)
// ============================================

const DEMO_USERS = {
    'demo@nspire.app': {
        id: 'demo_user_123',
        email: 'demo@nspire.app',
        passwordHash: bcrypt.hashSync('demo123', 10),
        ghlContactId: null // Demo user doesn't need GHL lookup
    },
    // Add more demo users here for testing
    'test@nspire.app': {
        id: 'test_user_456',
        email: 'test@nspire.app',
        passwordHash: bcrypt.hashSync('test123', 10),
        ghlContactId: null // Will be looked up in GHL
    }
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_MISSING'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                code: 'TOKEN_INVALID'
            });
        }
        req.user = user;
        next();
    });
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/login
 * User authentication and subscription verification
 */
router.post('/login', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        console.log(`🔐 Login attempt for: ${email}`);

        // Step 1: Verify user credentials in our database
        const user = DEMO_USERS[email.toLowerCase()];
        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return res.status(403).json({ 
                error: 'No account found for this email',
                code: 'USER_NOT_FOUND'
            });
        }

        // Step 2: Verify password
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            console.log(`❌ Invalid password for: ${email}`);
            return res.status(401).json({ 
                error: 'Invalid password',
                code: 'INVALID_PASSWORD'
            });
        }

        console.log(`✅ Password verified for: ${email}`);

        // Step 3: Handle demo user (skip GHL lookup)
        if (email === 'demo@nspire.app') {
            const demoResponse = {
                token: jwt.sign({
                    userId: user.id,
                    email: user.email,
                    ghlContactId: 'demo_contact',
                    membership: { active: true, plan: 'demo', trialEndsAt: null },
                    lastVerifiedAt: new Date().toISOString()
                }, process.env.JWT_SECRET, { expiresIn: '24h' }),
                active: true,
                plan: 'Demo Access',
                trialEndsAt: null,
                renewUrl: process.env.RENEW_URL,
                userId: user.id,
                loginTime: Date.now() - startTime
            };

            console.log(`🎭 Demo login successful for: ${email} (${demoResponse.loginTime}ms)`);
            return res.json(demoResponse);
        }

        // Step 4: Get GHL contact ID
        let ghlContactId = user.ghlContactId;
        if (!ghlContactId) {
            console.log(`🔍 Looking up GHL contact for: ${email}`);
            ghlContactId = await ghlClient.searchContactByEmail(email);
            
            if (!ghlContactId) {
                console.log(`❌ No GHL contact found for: ${email}`);
                return res.status(403).json({ 
                    error: 'No account found in our system',
                    code: 'GHL_CONTACT_NOT_FOUND'
                });
            }
        }

        console.log(`✅ GHL contact found: ${ghlContactId}`);

        // Step 5: Check subscription status
        console.log(`💳 Checking subscription status for contact: ${ghlContactId}`);
        const subscriptionStatus = await ghlClient.getContactSubscriptionStatus(ghlContactId);

        // Step 6: Create session token
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            ghlContactId,
            membership: subscriptionStatus,
            lastVerifiedAt: new Date().toISOString()
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
            expiresIn: `${process.env.SESSION_TTL_HOURS || 24}h` 
        });

        // Step 7: Log activity (non-blocking)
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        ghlClient.logActivity(ghlContactId, `Login - IP: ${ip} - Device: ${userAgent}`);

        // Step 8: Return response
        const response = {
            token,
            active: subscriptionStatus.active,
            plan: subscriptionStatus.plan,
            trialEndsAt: subscriptionStatus.trialEndsAt,
            renewUrl: process.env.RENEW_URL,
            userId: user.id,
            loginTime: Date.now() - startTime
        };

        console.log(`✅ Login successful for: ${email} - Active: ${subscriptionStatus.active} - Plan: ${subscriptionStatus.plan} (${response.loginTime}ms)`);
        
        res.json(response);

    } catch (error) {
        const loginTime = Date.now() - startTime;
        console.error(`❌ Login failed after ${loginTime}ms:`, error.message);
        
        res.status(500).json({ 
            error: 'Login failed due to server error',
            code: 'SERVER_ERROR',
            loginTime
        });
    }
});

/**
 * GET /api/membership/status
 * Check current membership status (with caching)
 */
router.get('/membership/status', authenticateToken, async (req, res) => {
    try {
        const { ghlContactId, membership, lastVerifiedAt } = req.user;
        const lastVerified = new Date(lastVerifiedAt);
        const now = new Date();
        const minutesSinceVerification = (now - lastVerified) / (1000 * 60);

        console.log(`🔍 Checking membership status - Last verified: ${Math.round(minutesSinceVerification)} minutes ago`);

        // Use cached data if recent enough (< 60 minutes)
        if (minutesSinceVerification < 60) {
            console.log(`✅ Using cached membership data (${Math.round(minutesSinceVerification)} minutes old)`);
            return res.json({
                active: membership.active,
                plan: membership.plan,
                trialEndsAt: membership.trialEndsAt,
                graceMode: false,
                cached: true,
                lastVerified: lastVerifiedAt
            });
        }

        // Handle demo user
        if (ghlContactId === 'demo_contact') {
            return res.json({
                active: true,
                plan: 'Demo Access',
                trialEndsAt: null,
                graceMode: false,
                demo: true
            });
        }

        // Need fresh verification from GHL
        console.log(`🔄 Fetching fresh subscription status from GHL for contact: ${ghlContactId}`);
        
        try {
            const freshStatus = await ghlClient.getContactSubscriptionStatus(ghlContactId);

            // Update token with new verification time
            const newTokenPayload = {
                ...req.user,
                membership: freshStatus,
                lastVerifiedAt: now.toISOString()
            };

            const newToken = jwt.sign(newTokenPayload, process.env.JWT_SECRET, { 
                expiresIn: `${process.env.SESSION_TTL_HOURS || 24}h` 
            });

            console.log(`✅ Fresh membership status retrieved - Active: ${freshStatus.active} - Plan: ${freshStatus.plan}`);

            res.json({
                active: freshStatus.active,
                plan: freshStatus.plan,
                trialEndsAt: freshStatus.trialEndsAt,
                graceMode: false,
                newToken, // Client should update stored token
                lastVerified: now.toISOString()
            });

        } catch (ghlError) {
            console.error('❌ GHL verification failed:', ghlError.message);
            
            // Check if we're within grace period
            const hoursSinceVerification = (now - lastVerified) / (1000 * 60 * 60);
            const gracePeriodHours = parseInt(process.env.GRACE_TTL_HOURS) || 168; // 7 days
            
            if (membership.active && hoursSinceVerification <= gracePeriodHours) {
                console.log(`🕒 Allowing grace access (${Math.round(hoursSinceVerification)} hours since last verification)`);
                res.json({
                    active: true,
                    plan: membership.plan,
                    trialEndsAt: membership.trialEndsAt,
                    graceMode: true,
                    graceHoursRemaining: Math.max(0, gracePeriodHours - hoursSinceVerification)
                });
            } else {
                console.log(`❌ Grace period expired or was never active`);
                res.status(503).json({ 
                    active: false, 
                    error: 'Unable to verify membership status',
                    code: 'VERIFICATION_FAILED'
                });
            }
        }

    } catch (error) {
        console.error('❌ Membership status check failed:', error.message);
        res.status(500).json({ 
            error: 'Failed to check membership status',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * POST /api/activity/login
 * Log user activity (optional, non-blocking)
 */
router.post('/activity/login', authenticateToken, async (req, res) => {
    try {
        const { ghlContactId } = req.user;
        const { deviceInfo, action } = req.body;
        
        if (ghlContactId && ghlContactId !== 'demo_contact') {
            const activity = `${action || 'App Activity'} - Device: ${deviceInfo || 'Unknown'} - IP: ${req.ip}`;
            ghlClient.logActivity(ghlContactId, activity);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.log('⚠️ Activity logging failed (non-critical):', error.message);
        res.json({ success: false }); // Don't fail the request
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        // Test GHL connection
        const ghlHealthy = await ghlClient.testConnection();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                ghl: ghlHealthy ? 'connected' : 'disconnected',
                jwt: !!process.env.JWT_SECRET,
                database: 'demo_mode' // Change when real DB is added
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                renewUrl: process.env.RENEW_URL,
                supportEmail: process.env.SUPPORT_EMAIL
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;