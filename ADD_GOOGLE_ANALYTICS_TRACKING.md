# Add Google Analytics & Conversion Tracking
Version: v1.0 • Updated: 2025-03-11 15:09 AEST (Brisbane)

## Overview

This guide helps you add Google Analytics and Google Ads conversion tracking to your Fetcha Weather website.

---

## STEP 1: Get Your Google Analytics ID

1. Go to: https://analytics.google.com
2. Sign in with your Google account
3. Click "Start measuring"
4. Create Account:
   - Account name: "Fetcha Weather"
   - Click Next
5. Create Property:
   - Property name: "Fetcha Weather Website"
   - Reporting timezone: Australia/Brisbane
   - Currency: Australian Dollar (AUD)
   - Click Next
6. Business information:
   - Industry: Technology / Software
   - Business size: Small
   - Click Create
7. Accept Terms of Service
8. Set up Data Stream:
   - Choose "Web"
   - Website URL: https://fetcha.net
   - Stream name: "Fetcha Weather Production"
   - Click "Create stream"
9. **COPY YOUR MEASUREMENT ID** → It looks like: `G-XXXXXXXXXX`

---

## STEP 2: Add Analytics to Your Website

Once you have your Measurement ID (G-XXXXXXXXXX), follow these instructions:

### File 1: Create Analytics Script

Create a new file: `03_Website/frontend/js/analytics.js`

```javascript
// Google Analytics Configuration
// Replace G-XXXXXXXXXX with your actual Measurement ID

(function() {
    const MEASUREMENT_ID = 'G-XXXXXXXXXX'; // REPLACE THIS
    
    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID);
    
    // Make gtag available globally
    window.gtag = gtag;
})();

// Conversion tracking function
function trackConversion(conversionId, conversionLabel, value = 10) {
    if (window.gtag) {
        gtag('event', 'conversion', {
            'send_to': `${conversionId}/${conversionLabel}`,
            'value': value,
            'currency': 'AUD'
        });
        console.log('Conversion tracked:', conversionId, conversionLabel);
    }
}

// Make conversion tracking available globally
window.trackConversion = trackConversion;
```

### File 2: Update All HTML Pages

Add this line to the `<head>` section of ALL your HTML pages, right before the closing `</head>` tag:

```html
<script src="js/analytics.js"></script>
```

**Files to update:**
- index.html
- docs.html
- login.html
- weather-dashboard.html
- terms.html
- privacy.html

---

## STEP 3: Set Up Conversion Tracking

After your Google Ads campaign is created:

1. In Google Ads, go to: Tools & Settings → Conversions
2. Click "+ New conversion action"
3. Select "Website"
4. Enter: https://fetcha.net
5. Click "Scan" (let it scan)
6. Click "Add a conversion action manually"
7. Fill out:
   - Conversion name: "Account Sign-up"
   - Category: Sign-up
   - Value: $10
   - Count: One
   - Click window: 30 days
8. Click "Create and Continue"
9. **COPY your Conversion ID and Label**
   - It looks like: `AW-12345678/AbC-defGHIjklMNOpq`
   - First part (AW-12345678) is your Conversion ID
   - Second part (AbC-defGHIjklMNOpq) is your Conversion Label

---

## STEP 4: Add Conversion Tracking to Sign-Up Flow

Update `03_Website/frontend/js/weather-auth.js` to track conversions when users sign up successfully.

Find the sign-up success handler and add conversion tracking:

```javascript
// After successful signup
if (window.trackConversion) {
    // Replace these with your actual values from Step 3
    const CONVERSION_ID = 'AW-12345678';
    const CONVERSION_LABEL = 'AbC-defGHIjklMNOpq';
    window.trackConversion(CONVERSION_ID, CONVERSION_LABEL, 10);
}
```

---

## STEP 5: Test Your Tracking

### Test Google Analytics:

1. Open your website in a browser
2. Open Developer Console (F12)
3. Go to Network tab
4. Refresh the page
5. Look for requests to `google-analytics.com` or `gtag`
6. Should see successful requests (status 200)

### Test Conversion Tracking:

1. Go through your sign-up flow
2. Complete a test sign-up
3. Check Developer Console for "Conversion tracked" message
4. In Google Ads, go to Conversions
5. Within 24 hours, you should see 1 test conversion

---

## READY-TO-USE CODE FILES

I'll create the analytics.js file pre-configured. You just need to:
1. Get your Measurement ID from Google Analytics
2. Replace 'G-XXXXXXXXXX' with your actual ID
3. Get your Conversion ID from Google Ads
4. Update the conversion tracking in weather-auth.js

---

## VERIFICATION CHECKLIST

Before launching your campaign:

- [ ] Google Analytics account created
- [ ] Measurement ID obtained (G-XXXXXXXXXX)
- [ ] analytics.js file created with your ID
- [ ] All HTML files include analytics.js script
- [ ] Google Ads conversion action created
- [ ] Conversion ID and Label obtained
- [ ] Conversion tracking added to sign-up flow
- [ ] Test sign-up completed successfully
- [ ] Conversion visible in Google Ads dashboard

---

*Once these steps are complete, you're ready to launch your Google Ads campaign with full tracking!*
