# Deploy Google Ads Tracking to Production
Version: v1.0 • Updated: 2025-03-11 16:20 AEST (Brisbane)

## ✅ What I've Done

I've added your Google Ads tracking tag to your website files:

**Your Google Ads Conversion ID: AW-612218951**

### Files Updated:
- ✅ `03_Website/frontend/index.html` - Google Ads tag added
- ✅ `03_Website/frontend/js/analytics.js` - Conversion ID configured

### Files That Need Tag (I'll add these next):
- `03_Website/frontend/login.html`
- `03_Website/frontend/docs.html`
- `03_Website/frontend/weather-dashboard.html`
- `03_Website/frontend/terms.html`
- `03_Website/frontend/privacy.html`

---

## 🚀 How to Deploy to Production (Netlify)

### Option 1: Deploy via Git (Recommended)

1. **Commit the updated files:**
   ```bash
   cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
   git add frontend/
   git commit -m "Add Google Ads tracking tag"
   git push
   ```

2. **Netlify auto-deploys:**
   - Netlify will automatically detect the push
   - Build and deploy will start automatically
   - Takes ~2-3 minutes
   - You'll see the deployment in Netlify dashboard

### Option 2: Manual Deploy via Netlify CLI

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
netlify deploy --prod --dir=frontend
```

### Option 3: Drag & Drop in Netlify Dashboard

1. Go to: https://app.netlify.com
2. Select your site
3. Go to "Deploys" tab
4. Drag the `03_Website/frontend/` folder to the drop zone

---

## ✅ Verification Checklist

After deployment, verify tracking is working:

### 1. Check Tag is Loading

1. Go to https://fetcha.net
2. Open Developer Tools (F12)
3. Go to Network tab
4. Filter for "gtag"
5. You should see requests to `googletagmanager.com`
6. Status should be 200 (OK)

### 2. Test in Google Ads

1. Go to Google Ads dashboard
2. Navigate to: Tools → Conversions
3. Your conversion action should show "Recording conversions" status
4. May take 24-48 hours for first data to appear

### 3. Use Tag Assistant

1. Install Google Tag Assistant Chrome extension
2. Go to https://fetcha.net
3. Click Tag Assistant icon
4. Should show: "Google Ads" tag detected
5. Green checkmark = working correctly

---

## 📊 What Happens Next

### Campaign Approval:
- **Timeline**: Usually 24-48 hours
- **Status**: Check Google Ads dashboard for approval status
- **While Waiting**: Tracking tag is installed and ready

### First Data Collection:
- **Starts**: Immediately when campaign is approved
- **Appears in Dashboard**: Within 24 hours
- **Conversion Tracking**: Will show when someone signs up

### Week 1 Monitoring:
- Check impressions (ads showing)
- Monitor CTR (click-through rate)
- Verify conversions are tracking
- Add negative keywords as needed

---

## 🎯 Next Steps for Conversion Tracking

### Still Needed:
1. **Set up Google Analytics** (separate from Google Ads)
   - Get Measurement ID (G-XXXXXXXXXX)
   - Update `analytics.js` with your ID
   
2. **Get Conversion Label** from Google Ads
   - Go to: Tools → Conversions → Your conversion
   - Copy the conversion label
   - Update `analytics.js` with the label

3. **Add conversion tracking to sign-up flow**
   - Update `weather-auth.js` to call tracking on successful sign-up
   - I can help with this

---

## 📝 Files Modified

```
03_Website/frontend/index.html
  - Added Google Ads tag in <head> section
  
03_Website/frontend/js/analytics.js
  - Updated CONVERSION_ID to: AW-612218951
  - Conversion tracking functions ready
  - Need: Conversion Label + Google Analytics ID
```

---

## ⚠️ Important Notes

1. **Don't add the tag twice** - I've already added it for you
2. **Tag goes in <head>** immediately after opening tag
3. **Same tag on all pages** for consistent tracking
4. **Test after deployment** to ensure it's working
5. **Conversions need sign-up tracking** - separate step

---

## 🆘 Troubleshooting

### Tag Not Loading?
- Clear browser cache
- Check Developer Console for errors
- Verify deployment completed successfully
- Check file was actually uploaded to Netlify

### No Conversions Showing?
- Verify conversion tracking code is in sign-up flow
- Check conversion label is accurate
- Test a manual sign-up yourself
- Allow 24 hours for data to appear

### Campaign Not Approved?
- Check Google Ads notifications
- Review policy issues if any
- Make corrections and resubmit
- Usually approves within 24-48 hours

---

## 🚀 Ready to Deploy?

Run one of these commands:

```bash
# If using Git (recommended)
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
git add frontend/
git commit -m "Add Google Ads tracking"
git push

# Or direct deploy
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
netlify deploy --prod --dir=frontend
```

Then verify at: https://fetcha.net

---

*Your Google Ads campaign is set up and ready. Tracking tag is installed. Deploy to activate!*
