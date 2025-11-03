# Google OAuth Integration Setup Guide

**Version:** v1.0 • **Updated:** 2025-03-11 14:36 AEST (Brisbane)

## Overview

This guide explains how to set up Google OAuth authentication for Fetcha Weather. Users will be able to sign in using their Google accounts instead of creating a separate username/password.

## Prerequisites

- Access to Google Cloud Console
- Admin access to your Fetcha Weather deployment (both frontend and backend)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `Fetcha Weather` (or your preferred name)
4. Click **Create**

## Step 2: Enable Google+ API

1. In Google Cloud Console, select your project
2. Go to **APIs & Services** → **Library**
3. Search for "Google+ API"
4. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in the required fields:
   - **App name:** Fetcha Weather
   - **User support email:** your-email@example.com
   - **Developer contact information:** your-email@example.com
5. Click **Save and Continue**
6. On the **Scopes** screen, click **Save and Continue** (default scopes are fine)
7. On **Test users** (optional for development), click **Save and Continue**
8. Review and click **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type:** Web application
4. **Name:** Fetcha Weather Login
5. **Authorized JavaScript origins:**
   - For development: `http://localhost:3000`
   - For production: `https://fetcha.net`
   - Add both if needed
6. **Authorized redirect URIs:**
   - For development: `http://localhost:3000/login.html`
   - For production: `https://fetcha.net/login.html`
   - Add both if needed
7. Click **Create**
8. **IMPORTANT:** Copy both:
   - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - Client Secret (you'll need this for backend)

---

## Step 5: Configure Frontend

### Update `03_Website/frontend/js/config.js`

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google Client ID:

```javascript
// Google OAuth Configuration
window.GOOGLE_CLIENT_ID = '123456789-abc123.apps.googleusercontent.com';
```

### For Production (Netlify)

Add the Google Client ID as an environment variable:

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add new variable:
   - **Key:** `GOOGLE_CLIENT_ID`
   - **Value:** Your Google Client ID
3. Redeploy the site

---

## Step 6: Configure Backend

### Update `.env` File

Add your Google Client ID to `03_Website/backend/.env`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

### For Production (Railway)

Add the Google Client ID as an environment variable:

1. Go to Railway Dashboard → Your Project → **Variables**
2. Add new variable:
   - **Variable:** `GOOGLE_CLIENT_ID`
   - **Value:** Your Google Client ID
3. Redeploy the backend

---

## Step 7: Install Backend Dependencies

The Google OAuth packages should already be in `requirements.txt`. If you need to reinstall:

```bash
cd 03_Website/backend
pip install -r requirements.txt
```

This will install:
- `google-auth==2.25.2`
- `google-auth-oauthlib==1.2.0`
- `google-auth-httplib2==0.2.0`

---

## Step 8: Test the Integration

### Local Testing

1. Start the backend:
   ```bash
   cd 03_Website/backend
   python app.py
   ```

2. Open the frontend:
   ```bash
   # In a new terminal
   cd 03_Website/frontend
   # Open login.html in your browser or use a local server
   open http://localhost:3000/login.html
   ```

3. Click the "Continue with Google" button
4. Sign in with your Google account
5. You should be redirected to the dashboard

### Production Testing

1. Deploy both frontend and backend with the environment variables set
2. Visit `https://fetcha.net/login.html`
3. Click "Continue with Google"
4. Verify successful login

---

## How It Works

### Frontend Flow

1. User clicks "Continue with Google" button
2. Google Sign-In library shows Google account picker
3. User selects account and grants permissions
4. Google returns a credential (JWT token)
5. Frontend sends credential to backend `/auth/google-login` endpoint
6. Backend validates the token and returns a JWT access token
7. User is logged in and redirected to dashboard

### Backend Flow

1. Receives Google credential from frontend
2. Verifies the token with Google's servers
3. Extracts user info (email, name)
4. Checks if user exists in database:
   - **Existing user:** Returns JWT token for login
   - **New user:** Creates account with random password, returns JWT token
5. User can now access protected endpoints with the JWT token

---

## Security Notes

1. **Never commit Google Client ID/Secret to version control**
2. Always use environment variables for credentials
3. The Google Client Secret is NOT used in this implementation (only Client ID)
4. Backend validates all Google tokens server-side
5. Users created via Google have random passwords they cannot use

---

## Troubleshooting

### "Google Sign-In is still loading"

- Check that Google library loaded: `<script src="https://accounts.google.com/gsi/client">`
- Check browser console for errors
- Verify your domain is in Authorized JavaScript origins

### "Invalid Google authentication token"

- Verify GOOGLE_CLIENT_ID matches in both frontend and backend
- Check that token hasn't expired (they expire after 1 hour)
- Ensure backend is using correct Client ID for validation

### "Google authentication is not properly configured"

- GOOGLE_CLIENT_ID environment variable not set in backend
- Check backend logs for specific error messages
- Verify `config.py` loads GOOGLE_CLIENT_ID correctly

### Google Popup Blocked

- Check browser pop-up blocker settings
- Try clicking the button again
- Ensure Authorized JavaScript origins includes your domain

---

## Additional Configuration

### Customizing Google Button

The Google Sign-In button can be customized in `login.html`:

```html
<button id="googleSignIn" class="auth-btn google">
  <!-- SVG Icon -->
  Continue with Google
</button>
```

### Adding More OAuth Providers

To add other providers (GitHub, Facebook, etc.):

1. Create similar endpoints in `backend/routes/auth.py`
2. Add provider libraries to `requirements.txt`
3. Add buttons and handlers in `frontend/js/weather-auth.js`
4. Follow each provider's OAuth documentation

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Google Cloud Console audit logs
3. Check backend application logs
4. Verify environment variables are set correctly

---

## References

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
