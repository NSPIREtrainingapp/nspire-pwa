// Netlify Function for GHL Authentication
exports.handler = async (event, context) => {
    // Enable CORS for your PWA
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);
        
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password required' })
            };
        }

        // GHL Configuration from environment variables
        const GHL_API_KEY = process.env.GHL_API_KEY;
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

        if (!GHL_API_KEY || !GHL_LOCATION_ID) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        console.log('🔍 Auth attempt for:', email);
        
        // Fetch contacts from GHL
        const response = await fetch(`https://services.leadconnectorhq.com/v1/contacts?locationId=${GHL_LOCATION_ID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GHL API Error:', response.status, errorText);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'GHL API connection failed' })
            };
        }

        const data = await response.json();
        console.log('📦 GHL Response:', data.contacts?.length, 'contacts found');

        // Find user by email
        const contact = data.contacts?.find(c => 
            c.email && c.email.toLowerCase() === email.toLowerCase()
        );

        if (!contact) {
            console.log('❌ User not found in GHL');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        console.log('👤 Found contact:', contact.email, 'Tags:', contact.tags);

        // Check for required tags
        const hasValidTag = contact.tags && (
            contact.tags.includes('trial_active') || 
            contact.tags.includes('standard_59') || 
            contact.tags.includes('legacy_39')
        );

        if (!hasValidTag) {
            console.log('❌ User missing required subscription tags');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No active subscription' })
            };
        }

        // Verify password from custom field
        const storedPassword = contact.customFields?.app_password;
        if (!storedPassword || storedPassword !== password) {
            console.log('❌ Password mismatch');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid password' })
            };
        }

        // Determine subscription details
        let plan = 'trial';
        let expiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days default

        if (contact.tags.includes('trial_active')) {
            plan = 'trial_active';
            expiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days
        } else if (contact.tags.includes('legacy_39')) {
            plan = 'legacy_39';
            expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
        } else if (contact.tags.includes('standard_59')) {
            plan = 'standard_59';
            expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
        }

        // Return user data
        const userData = {
            email: contact.email.toLowerCase(),
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            plan: plan,
            expiresAt: expiresAt,
            ghlContactId: contact.id,
            appUserId: contact.customFields?.app_user_id || contact.id,
            subscriberNumber: contact.customFields?.subscriber_number,
            lastSync: Date.now()
        };

        console.log('✅ Authentication successful for:', email, 'Plan:', plan);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: userData
            })
        };

    } catch (error) {
        console.error('❌ Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};