# Email Verification Setup Guide

**Version:** v1.0 • **Updated:** 2025-10-31 19:48 AEST (Brisbane)

## Overview

This guide explains how to set up Gmail SMTP for email verification in the Fetcha Weather application.

## Prerequisites

- A Gmail account
- Access to your Google Account settings

## Step 1: Enable Gmail App Passwords

1. **Go to your Google Account**
   - Visit https://myaccount.google.com/

2. **Enable 2-Step Verification** (if not already enabled)
   - Go to Security → 2-Step Verification
   - Follow the prompts to enable it

3. **Generate an App Password**
   - Go to Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "Fetcha Weather"
   - Click "Generate"
   - **IMPORTANT:** Copy the 16-character password (it looks like: `xxxx xxxx xxxx xxxx`)
   - You won't be able to see this password again

## Step 2: Configure Environment Variables

### For Local Development

1. **Copy the example environment file:**
   ```bash
   cd 03_Website/backend
   cp .env.example .env
   ```

2. **Edit the `.env` file** and update these values:
   ```bash
   # Email Configuration - Gmail SMTP
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-actual-gmail@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-character app password
   EMAIL_FROM=your-actual-gmail@gmail.com
   EMAIL_FROM_NAME=Fetcha Weather
   FRONTEND_URL=http://localhost:3000
   ```

3. **Important Notes:**
   - Replace `your-actual-gmail@gmail.com` with your Gmail address
   - Replace `xxxx xxxx xxxx xxxx` with the app password you generated
   - Remove any spaces from the app password (use just the 16 characters)

### For Production (Railway/Heroku/etc.)

Add these environment variables in your hosting platform's dashboard:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-actual-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-actual-gmail@gmail.com
EMAIL_FROM_NAME=Fetcha Weather
FRONTEND_URL=https://your-production-domain.com
```

## Step 3: Test Email Sending

### Quick Test Script

Create a file `test_email.py` in the `backend` directory:

```python
from services.email_service import EmailService
from config import get_config

config = get_config('development')
email_service = EmailService(config)

result = email_service.send_verification_email(
    to_email="your-test-email@example.com",
    verification_token="test-token-12345",
    user_name="Test User"
)

print(result)
```

Run it:
```bash
python test_email.py
```

If successful, you should see:
```
{'success': True, 'message': 'Email sent successfully'}
```

## Step 4: Verify the Integration

1. **Start the backend server:**
   ```bash
   cd 03_Website/backend
   python app.py
   ```

2. **Test signup** via the frontend or API:
   ```bash
   curl -X POST http://localhost:8000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123",
       "full_name": "Test User"
     }'
   ```

3. **Check your email** for the verification message

4. **Click the verification link** or copy the token and visit:
   ```
   http://localhost:3000/verify-email.html?token=TOKEN&email=test@example.com
   ```

## How It Works

### Email Flow

1. **User Signs Up**
   - User submits registration form
   - Backend creates user account in database
   - Backend generates verification token
   - Backend sends verification email via Gmail SMTP

2. **User Verifies Email**
   - User clicks link in email
   - Frontend extracts token from URL
   - Frontend calls `/auth/verify-email` endpoint
   - Backend verifies token and marks email as verified

3. **User Can Login**
   - User can now log in with verified account
   - Access to protected resources is granted

### Email Templates

The system sends beautifully formatted HTML emails with:
- Fetcha branding
- Clear call-to-action button
- Fallback plain text link
- Expiration notice
- Professional footer

## Troubleshooting

### "Email authentication failed"

**Problem:** SMTP authentication is failing

**Solutions:**
1. Verify your Gmail address is correct
2. Ensure you're using an App Password, not your regular Gmail password
3. Check that 2-Step Verification is enabled on your Google Account
4. Generate a new App Password if the old one isn't working

### "Failed to send email"

**Problem:** SMTP connection issues

**Solutions:**
1. Check your internet connection
2. Verify SMTP_SERVER is `smtp.gmail.com`
3. Verify SMTP_PORT is `587`
4. Check firewall settings (port 587 must be open)

### "Email not received"

**Problem:** Email was sent but not received

**Solutions:**
1. Check spam/junk folder
2. Verify the recipient email address is correct
3. Check Gmail sending limits (500 emails per day for free accounts)
4. Look at backend logs for any errors

### Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 100 recipients per message

**Google Workspace (paid):**
- 2,000 emails per day
- 2,000 recipients per message

## Security Best Practices

1. **Never commit .env files** - They contain sensitive credentials
2. **Use App Passwords** - Never use your main Gmail password
3. **Rotate passwords regularly** - Generate new App Passwords periodically
4. **Monitor usage** - Keep an eye on your Gmail sent folder
5. **Use environment variables** - Never hardcode credentials in code

## Production Considerations

### Email Service Alternatives

For production at scale, consider using dedicated email services:

1. **SendGrid** - 100 free emails/day, scales well
2. **AWS SES** - Very low cost, high reliability
3. **Mailgun** - Good for transactional emails
4. **Postmark** - Excellent deliverability

### Benefits of Dedicated Services

- Better deliverability rates
- Detailed analytics
- No daily sending limits (with paid plans)
- Dedicated IP addresses
- Better spam score
- Email tracking and webhooks

## Support

If you encounter issues:

1. Check the backend logs: `03_Website/backend/logs/app.log`
2. Review the troubleshooting section above
3. Verify your Gmail settings
4. Test with the quick test script

## Related Files

- `backend/services/email_service.py` - Email service implementation
- `backend/routes/auth.py` - Authentication routes using email service
- `backend/config.py` - Configuration with SMTP settings
- `backend/.env.example` - Example environment variables
- `frontend/verify-email.html` - Email verification page
- `frontend/js/verify-email.js` - Verification page JavaScript

---

**Next Steps:** After setting up email verification, you can test the complete signup flow from registration to email verification to login.
