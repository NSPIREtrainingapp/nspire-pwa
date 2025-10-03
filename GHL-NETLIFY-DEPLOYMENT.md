# 🚀 GHL + Netlify Functions Deployment Guide

## ✅ **What's Created:**

### **Netlify Function:**
- `netlify/functions/ghl-auth.js` - Handles GHL authentication
- Bypasses CORS issues by running server-side
- Validates users against your GHL database in real-time

### **Updated PWA:**
- Login now calls Netlify Function instead of direct GHL API
- Real-time GHL verification for every login
- Full subscription control through GHL tags

## 🎯 **Deployment Steps:**

### **1. Deploy to Netlify:**
1. **Drag your entire project folder** to Netlify (or use Git deployment)
2. Netlify will automatically detect and deploy the function

### **2. Set Environment Variables in Netlify:**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings → Environment variables**
3. Add these variables:
   ```
   GHL_API_KEY = pit-27a95900-7f0c-4fe1-b5ee-50f199a49a0a
   GHL_LOCATION_ID = QPG7wp7xYyeZidGPH0JV
   ```

### **3. Test the Integration:**
1. Visit your deployed site
2. Try logging in with your GHL test contact:
   - Email: nspiretrainingapp@gmail.com  
   - Password: [whatever you set in the app_password custom field]

## 🔄 **How It Works:**

### **User Login Flow:**
1. User enters email/password on PWA
2. PWA sends request to `yoursite.netlify.app/.netlify/functions/ghl-auth`
3. Function calls GHL API to verify user exists with correct tags
4. Function checks custom field `app_password` matches entered password
5. Function returns approval/denial to PWA
6. PWA logs user in or shows error

### **GHL Control:**
- **Add user to GHL** + tag `trial_active` = Instant app access
- **Remove tag** or **delete contact** = Instant access revocation  
- **Change tags** (`trial_active` → `standard_59`) = Plan changes
- **Update `app_password` field** = Password changes

## 🛡️ **Security Features:**
- ✅ **API key hidden** in Netlify environment (not in frontend code)
- ✅ **Server-side validation** - no client-side bypassing
- ✅ **Real-time GHL verification** - always current subscription status
- ✅ **HTTPS encryption** - secure data transmission

## 🎯 **What to Test:**

### **Successful Login:**
- Contact exists in GHL
- Has tag: `trial_active`, `standard_59`, or `legacy_39`
- Custom field `app_password` matches entered password
- → Should login successfully

### **Failed Login:**
- Contact not in GHL → "User not found"
- Missing subscription tags → "No active subscription"  
- Wrong password → "Invalid password"
- → Should show appropriate error

## 📊 **Monitoring:**
- Check Netlify Functions logs for authentication attempts
- Monitor GHL API usage (very minimal - only on login)
- Function calls logged in Netlify dashboard

## 💰 **Cost Tracking:**
- Monitor function invocations in Netlify dashboard
- 125,000 free calls/month (about 4,100 daily logins)
- Usage tracking available in real-time

## 🚀 **Ready to Deploy!**
Your PWA now has full GHL integration with zero additional platform costs!