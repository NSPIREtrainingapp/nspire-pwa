# GoHighLevel Backend Integration Setup

## 🔐 Webhook Signature Verification Implementation

### Required Dependencies
```bash
npm install express crypto dotenv cors helmet
```

### Environment Variables (.env)
```env
GHL_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
GHL_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Backend Server Structure (server.js)
```javascript
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
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Raw body parser for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// GHL Public Key (same for all webhooks)
const GHL_PUBLIC_KEY = process.env.GHL_PUBLIC_KEY;

// Webhook signature verification middleware
function verifyGHLSignature(req, res, next) {
    try {
        const signature = req.headers['x-wh-signature'];
        const body = req.body;
        
        if (!signature) {
            console.log('Missing webhook signature');
            return res.status(401).json({ error: 'Missing signature' });
        }
        
        // Create verifier
        const verifier = crypto.createVerify('SHA256');
        verifier.update(body);
        
        // Verify signature
        const isValid = verifier.verify(GHL_PUBLIC_KEY, signature, 'base64');
        
        if (!isValid) {
            console.log('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // Parse body for processing
        req.body = JSON.parse(body.toString());
        next();
    } catch (error) {
        console.error('Signature verification error:', error);
        return res.status(401).json({ error: 'Signature verification failed' });
    }
}

// GHL Webhook endpoints
app.post('/webhooks/contact-update', verifyGHLSignature, (req, res) => {
    // Respond quickly to avoid timeout
    res.status(200).json({ received: true });
    
    // Process asynchronously
    processContactUpdate(req.body);
});

app.post('/webhooks/subscription-change', verifyGHLSignature, (req, res) => {
    // Respond quickly to avoid timeout
    res.status(200).json({ received: true });
    
    // Process asynchronously
    processSubscriptionChange(req.body);
});

// Async processing functions
async function processContactUpdate(payload) {
    try {
        console.log('Processing contact update:', payload);
        // Update user database with new contact info
        // Send notifications if needed
    } catch (error) {
        console.error('Error processing contact update:', error);
    }
}

async function processSubscriptionChange(payload) {
    try {
        console.log('Processing subscription change:', payload);
        // Update user subscription status
        // Grant/revoke app access
        // Send confirmation emails
    } catch (error) {
        console.error('Error processing subscription change:', error);
    }
}

// API endpoints for PWA
app.get('/api/user/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Check user subscription status in database
        const userStatus = await getUserStatus(userId);
        res.json(userStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user status' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.body;
        // Verify user token with GHL
        const user = await verifyUserToken(token);
        res.json({ valid: true, user });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

// Placeholder functions (implement based on your database choice)
async function getUserStatus(userId) {
    // Query your database for user subscription status
    return {
        userId,
        subscriptionActive: true,
        planType: 'premium',
        expiresAt: '2025-12-31'
    };
}

async function verifyUserToken(token) {
    // Verify token with GHL API or your database
    return {
        id: 'user123',
        email: 'user@example.com',
        subscriptionActive: true
    };
}

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`🔐 Webhook signature verification enabled`);
});
```

## 🔗 Frontend Integration Updates

### Add to your PWA (index.html):
```javascript
// User authentication check
async function checkUserSubscription(userId) {
    try {
        const response = await fetch(`http://localhost:3001/api/user/status/${userId}`);
        const userStatus = await response.json();
        return userStatus.subscriptionActive;
    } catch (error) {
        console.error('Subscription check failed:', error);
        return false;
    }
}

// Protect app access
async function validateAccess() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'https://your-ghl-portal.com/login';
        return false;
    }
    
    const hasAccess = await checkUserSubscription(userId);
    if (!hasAccess) {
        showPaywallMessage();
        return false;
    }
    
    return true;
}
```

## 📱 Deployment Checklist

### 1. Backend Deployment:
- [ ] Deploy to Heroku/DigitalOcean/AWS
- [ ] Set environment variables
- [ ] Configure HTTPS (required for webhooks)
- [ ] Test webhook signature verification

### 2. GHL Configuration:
- [ ] Set up webhook URLs in GHL
- [ ] Configure membership portal
- [ ] Set up payment processing
- [ ] Test subscription flows

### 3. Frontend Updates:
- [ ] Add authentication checks
- [ ] Implement paywall UI
- [ ] Update API endpoints
- [ ] Test PWA installation

## 🔐 Security Best Practices

1. **Always verify signatures** before processing webhooks
2. **Use HTTPS** for all webhook endpoints
3. **Rate limit** webhook endpoints
4. **Log all verification failures** for monitoring
5. **Store sensitive data** in environment variables
6. **Validate all input** data from webhooks

This setup ensures your app only processes authentic GHL notifications and maintains secure user access control.