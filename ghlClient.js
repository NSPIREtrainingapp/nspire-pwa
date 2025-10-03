/**
 * GoHighLevel API Client
 * Secure backend service for GHL integration
 * NEVER expose this API key to the frontend!
 */

require('dotenv').config();

class GHLClient {
    constructor() {
        this.apiBase = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';
        this.token = process.env.GHL_TOKEN;
        this.locationId = process.env.GHL_LOCATION_ID;
        this.timeout = parseInt(process.env.LOGIN_TIMEOUT_MS) || 1200;

        // Validate configuration
        if (!this.token) {
            console.error('❌ GHL_TOKEN not found in environment variables');
            throw new Error('GHL API token is required');
        }

        if (!this.locationId) {
            console.error('❌ GHL_LOCATION_ID not found in environment variables');
            throw new Error('GHL Location ID is required');
        }

        console.log('✅ GHL Client initialized successfully');
    }

    /**
     * Make authenticated request to GHL API with timeout and retry
     */
    async makeRequest(endpoint, method = 'GET', data = null, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

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

            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = JSON.stringify(data);
            }

            const url = `${this.apiBase}${endpoint}`;
            console.log(`🔄 GHL API Request: ${method} ${endpoint}`);
            
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`GHL API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ GHL API Success: ${method} ${endpoint}`);
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error(`⏰ GHL API Timeout: ${method} ${endpoint}`);
                
                // Retry once on timeout
                if (retryCount === 0) {
                    console.log(`🔄 Retrying GHL API request: ${method} ${endpoint}`);
                    return this.makeRequest(endpoint, method, data, 1);
                }
                
                throw new Error('GHL API request timeout after retry');
            }

            console.error(`❌ GHL API Error: ${method} ${endpoint}`, error.message);
            throw error;
        }
    }

    /**
     * Search for contact by email address
     * @param {string} email - Email address to search for
     * @returns {string|null} - Contact ID if found, null otherwise
     */
    async searchContactByEmail(email) {
        try {
            console.log(`🔍 Searching for contact: ${email}`);
            
            const response = await this.makeRequest('/contacts/search', 'POST', {
                locationId: this.locationId,
                query: email
            });

            const contacts = response.contacts || [];
            console.log(`📊 Found ${contacts.length} contacts for query: ${email}`);

            // Find exact email match (case-insensitive)
            const exactMatch = contacts.find(contact => 
                contact.email && contact.email.toLowerCase() === email.toLowerCase()
            );

            if (exactMatch) {
                console.log(`✅ Exact contact match found: ${exactMatch.id}`);
                return exactMatch.id;
            }

            console.log(`❌ No exact email match found for: ${email}`);
            return null;

        } catch (error) {
            console.error('❌ Error searching contact by email:', error.message);
            throw new Error(`Failed to search contact: ${error.message}`);
        }
    }

    /**
     * Get all subscriptions for a contact
     * @param {string} contactId - GHL Contact ID
     * @returns {Array} - Array of subscription objects
     */
    async listSubscriptionsByContact(contactId) {
        try {
            console.log(`💳 Getting subscriptions for contact: ${contactId}`);
            
            const response = await this.makeRequest(`/payments/subscriptions?contact=${contactId}`);
            
            const subscriptions = response.subscriptions || [];
            console.log(`📊 Found ${subscriptions.length} subscriptions for contact: ${contactId}`);

            return subscriptions;

        } catch (error) {
            console.error('❌ Error getting subscriptions:', error.message);
            throw new Error(`Failed to get subscriptions: ${error.message}`);
        }
    }

    /**
     * Normalize subscription data and determine access status
     * @param {Object} subscription - Raw subscription object from GHL
     * @returns {Object} - Normalized subscription status
     */
    normalizeSubscriptionStatus(subscription) {
        if (!subscription) {
            return {
                active: false,
                plan: 'none',
                trialEndsAt: null,
                status: 'no_subscription'
            };
        }

        const now = new Date();
        const status = subscription.status || 'inactive';
        const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
        
        // Determine if subscription is active
        const isActiveStatus = ['active', 'trialing'].includes(status.toLowerCase());
        const isWithinPeriod = !currentPeriodEnd || now < currentPeriodEnd;
        const active = isActiveStatus && isWithinPeriod;

        // Extract plan information
        const plan = subscription.priceName || 
                    subscription.productName || 
                    subscription.planName || 
                    'unknown';

        // Trial end date
        const trialEndsAt = subscription.trialEnd || null;

        const result = {
            active,
            plan,
            trialEndsAt,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            raw: subscription // Include raw data for debugging
        };

        console.log(`📊 Subscription status for ${subscription.id}:`, {
            active: result.active,
            plan: result.plan,
            status: result.status
        });

        return result;
    }

    /**
     * Get the most recent/relevant subscription for a contact
     * @param {string} contactId - GHL Contact ID
     * @returns {Object} - Normalized subscription status
     */
    async getContactSubscriptionStatus(contactId) {
        try {
            const subscriptions = await this.listSubscriptionsByContact(contactId);
            
            if (subscriptions.length === 0) {
                console.log(`❌ No subscriptions found for contact: ${contactId}`);
                return this.normalizeSubscriptionStatus(null);
            }

            // Sort by creation date (most recent first)
            const sortedSubscriptions = subscriptions.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.created_at || 0);
                const dateB = new Date(b.createdAt || b.created_at || 0);
                return dateB - dateA;
            });

            // Use the most recent subscription
            const latestSubscription = sortedSubscriptions[0];
            console.log(`🎯 Using latest subscription: ${latestSubscription.id} (${latestSubscription.status})`);

            return this.normalizeSubscriptionStatus(latestSubscription);

        } catch (error) {
            console.error('❌ Error getting contact subscription status:', error.message);
            throw error;
        }
    }

    /**
     * Log activity to GHL contact notes (non-blocking)
     * @param {string} contactId - GHL Contact ID
     * @param {string} activity - Activity description
     */
    async logActivity(contactId, activity) {
        try {
            const timestamp = new Date().toISOString();
            const note = {
                body: `NSPIRE App Activity: ${activity}\nTimestamp: ${timestamp}`,
                userId: contactId
            };

            // Don't await - make this non-blocking
            this.makeRequest(`/contacts/${contactId}/notes`, 'POST', note)
                .then(() => console.log(`📝 Activity logged for ${contactId}: ${activity}`))
                .catch(error => console.log(`⚠️ Failed to log activity (non-critical): ${error.message}`));

        } catch (error) {
            // Silently fail - activity logging is not critical
            console.log(`⚠️ Activity logging failed (non-critical): ${error.message}`);
        }
    }

    /**
     * Test GHL API connection
     */
    async testConnection() {
        try {
            console.log('🧪 Testing GHL API connection...');
            
            // Try to get location info
            const response = await this.makeRequest(`/locations/${this.locationId}`);
            
            console.log('✅ GHL API connection successful');
            console.log(`📍 Location: ${response.location?.name || 'Unknown'}`);
            
            return true;
        } catch (error) {
            console.error('❌ GHL API connection failed:', error.message);
            return false;
        }
    }
}

// Export singleton instance
const ghlClient = new GHLClient();

module.exports = ghlClient;