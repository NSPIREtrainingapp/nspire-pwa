# NSPIRE Training PWA - GoHighLevel Integration Setup

## Overview
Your NSPIRE Training PWA now includes complete GoHighLevel (GHL) integration for user authentication, subscription management, and offline access control.

## 🚀 Quick Start

### 1. Demo Mode (Test Immediately)
- Username: `demo@nspire.app`
- Password: `demo123`
- This bypasses GHL and shows full app functionality

### 2. GoHighLevel Configuration

#### Step 1: Get GHL Credentials
1. Log into your GoHighLevel account
2. Go to **Settings → Locations → [Your Location]**
3. Copy your **Location ID**
4. Go to **Settings → Integrations → API Keys**
5. Create new API key with permissions:
   - `contacts.readonly`
   - `contacts.write`
6. Copy your **API Key**

#### Step 2: Update Configuration
Edit `index.html` around line 70 in the `GHL_CONFIG` object:

```javascript
const GHL_CONFIG = {
    apiUrl: 'https://services.leadconnectorhq.com/v1',
    locationId: 'your_actual_location_id_here', // ← Replace this
    apiKey: 'your_actual_api_key_here',         // ← Replace this
    authUrl: '...'
};
```

### 3. Contact Setup in GoHighLevel

#### Required Custom Fields
Add these custom fields to your Contact records:
- **Field Name**: `password`
- **Field Type**: Text
- **Purpose**: Store user app passwords

#### Required Tags for Subscription Management
Create these tags in GHL:
- `trial_active` - User has active 14-day trial
- `paid_subscriber` - User has paid subscription
- `legacy_39` - Legacy $39.99/year subscriber
- `standard_59` - Standard $59.99/year subscriber  
- `cancelled` - Subscription cancelled (grace period)

#### Example Contact Setup
```
Contact: john@example.com
Custom Fields:
  - password: "securepassword123"
Tags:
  - paid_subscriber
  - standard_59
```

## 🔐 Authentication Flow

1. **User Login**: Email/password entered in app
2. **GHL Lookup**: App searches contacts by email
3. **Password Check**: Compares with custom field
4. **Tag Verification**: Checks subscription tags
5. **Access Control**: Grants/denies based on subscription
6. **Offline Caching**: Stores session for 7-day grace period

## 💳 Subscription Tiers

| Tier | Price | Tag | Features |
|------|-------|-----|----------|
| Trial | $1 for 14 days | `trial_active` | Full access during trial |
| Legacy | $39.99/year | `legacy_39` | First 5,000 subscribers |
| Standard | $59.99/year | `standard_59` | After 5,000 subscribers |

## 📱 Offline Support

- **Grace Period**: 7 days offline access for paid users
- **Data Caching**: Subscription status cached locally
- **Sync**: Automatic sync when connection restored
- **Indicators**: Visual offline/online status

## 🔧 Backend Integration

The included `server.js` handles:
- Webhook signature verification
- Real-time subscription updates
- Contact activity tracking
- Secure API endpoints

Deploy to platforms like:
- Heroku
- Railway
- DigitalOcean App Platform
- Vercel

## 📊 Usage Tracking

Automatically tracks in GHL contact notes:
- App login events
- Page views
- Feature usage
- Session duration

## 🛠 Troubleshooting

### Common Issues

1. **"Demo mode active"**
   - Update `GHL_CONFIG` with real credentials
   - Verify Location ID and API Key are correct

2. **"Email not found"**
   - Ensure contact exists in GHL with exact email
   - Check contact is in the correct location

3. **"Invalid password"**
   - Verify custom field named "password" exists
   - Check password value in contact record

4. **"No active subscription"**
   - Add required subscription tags to contact
   - Verify tag names match exactly

### Testing Checklist

- [ ] GHL credentials configured
- [ ] Test contact created with password field
- [ ] Subscription tags added to test contact
- [ ] Login works with test credentials
- [ ] Subscription status displays correctly
- [ ] Offline mode tested
- [ ] Backend webhooks configured (optional)

## 🚀 Production Deployment

1. **Security Enhancements**:
   - Hash passwords instead of plain text
   - Use HTTPS for all API calls
   - Implement rate limiting
   - Add CORS restrictions

2. **Performance**:
   - Enable PWA caching
   - Optimize image loading
   - Monitor API quotas

3. **Monitoring**:
   - Set up error tracking
   - Monitor subscription conversions
   - Track app usage analytics

Your NSPIRE Training PWA is now ready for production with full GoHighLevel integration! 🎉