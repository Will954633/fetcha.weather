// Google Analytics & Conversion Tracking Configuration
// Fetcha Weather - Market Validation Campaign
// Version: v1.0 • Updated: 2025-03-11 15:10 AEST (Brisbane)

(function() {
    // ===================================
    // CONFIGURATION - UPDATE THESE VALUES
    // ===================================
    
    // TODO: Replace with your Google Analytics Measurement ID from https://analytics.google.com
    // It will look like: G-XXXXXXXXXX
    const MEASUREMENT_ID = 'G-XXXXXXXXXX'; // <-- REPLACE THIS
    
    // Google Ads Conversion ID (updated with your actual ID)
    const CONVERSION_ID = 'AW-612218951';
    
    // Google Ads Conversion Label (updated with your actual label)
    const CONVERSION_LABEL = 'y239COmE9t0DEMfw9qMC';
    
    // ===================================
    // GOOGLE ANALYTICS INITIALIZATION
    // ===================================
    
    // Load Google Analytics gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    // Configure Google Analytics
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, {
        'send_page_view': true,
        'anonymize_ip': true // Privacy-friendly
    });
    
    // Make gtag available globally
    window.gtag = gtag;
    
    console.log('✅ Google Analytics initialized:', MEASUREMENT_ID);
    
    // ===================================
    // CONVERSION TRACKING FUNCTIONS
    // ===================================
    
    /**
     * Track a conversion event (sign-up, API key generation, etc.)
     * @param {string} eventName - Name of the event for logging
     * @param {number} value - Value of the conversion (default: 10 AUD)
     */
    function trackConversion(eventName = 'Sign-up', value = 10) {
        // Check if gtag is loaded
        if (!window.gtag) {
            console.warn('⚠️ Google Analytics not loaded yet. Conversion not tracked.');
            return false;
        }
        
        // Check if conversion tracking is configured
        if (CONVERSION_ID === 'AW-12345678' || CONVERSION_LABEL === 'AbC-defGHIjklMNOpq') {
            console.warn('⚠️ Conversion tracking not configured yet. Update analytics.js with your Google Ads conversion details.');
            return false;
        }
        
        // Track the conversion
        gtag('event', 'conversion', {
            'send_to': `${CONVERSION_ID}/${CONVERSION_LABEL}`,
            'value': value,
            'currency': 'AUD',
            'transaction_id': '' // Optional: can add unique transaction ID
        });
        
        console.log(`✅ Conversion tracked: ${eventName} (Value: $${value} AUD)`);
        return true;
    }
    
    /**
     * Track custom events for additional insights
     * @param {string} eventName - Name of the event
     * @param {object} eventParams - Additional parameters
     */
    function trackEvent(eventName, eventParams = {}) {
        if (!window.gtag) {
            console.warn('⚠️ Google Analytics not loaded yet. Event not tracked.');
            return false;
        }
        
        gtag('event', eventName, eventParams);
        console.log(`📊 Event tracked: ${eventName}`, eventParams);
        return true;
    }
    
    // ===================================
    // PRE-CONFIGURED EVENT TRACKERS
    // ===================================
    
    /**
     * Track when user signs up for account
     */
    function trackSignUp() {
        trackConversion('Account Sign-up', 10);
        trackEvent('sign_up', {
            method: 'email'
        });
    }
    
    /**
     * Track when user generates an API key
     */
    function trackApiKeyGeneration() {
        trackConversion('API Key Generation', 25);
        trackEvent('generate_api_key', {
            value: 25,
            currency: 'AUD'
        });
    }
    
    /**
     * Track when user views documentation
     */
    function trackDocsView() {
        trackEvent('view_documentation', {
            page_location: window.location.href
        });
    }
    
    /**
     * Track when user makes API request
     */
    function trackApiRequest(stationName = '') {
        trackEvent('api_request', {
            station: stationName
        });
    }
    
    // ===================================
    // MAKE FUNCTIONS GLOBALLY AVAILABLE
    // ===================================
    
    window.trackConversion = trackConversion;
    window.trackEvent = trackEvent;
    window.trackSignUp = trackSignUp;
    window.trackApiKeyGeneration = trackApiKeyGeneration;
    window.trackDocsView = trackDocsView;
    window.trackApiRequest = trackApiRequest;
    
    // ===================================
    // AUTO-TRACKING
    // ===================================
    
    // Track page views automatically
    console.log('📄 Page view tracked:', window.location.pathname);
    
    // Track docs page views
    if (window.location.pathname.includes('docs.html')) {
        trackDocsView();
    }
    
})();
