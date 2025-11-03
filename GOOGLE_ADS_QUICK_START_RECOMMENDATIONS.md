# Google Ads Quick Start - Recommended Settings
Version: v1.0 • Updated: 2025-03-11 15:08 AEST (Brisbane)

## MY RECOMMENDATIONS FOR YOU

Based on your MVP validation goals, here are my best suggestions:

---

## 1. Budget Recommendation: $20 AUD/day

**Why this amount:**
- Balances risk with data quality
- Generates 120-200 clicks per month
- Expected 3-10 sign-ups in first month
- Cost per acquisition: $60-200
- Total monthly investment: ~$600 AUD

**Risk Assessment:**
- ✅ Low enough to walk away if no demand
- ✅ High enough to generate meaningful data
- ✅ Can scale up if results are positive

---

## 2. Success Validation Criteria

### **STRONG VALIDATION** (Scale Up Immediately)
```
✅ 10+ sign-ups at <$30 per acquisition
✅ CTR >3% on main keywords
✅ 50%+ of sign-ups generate API keys
✅ Quality Score >7
→ ACTION: Increase budget to $50-100/day
```

### **MODERATE VALIDATION** (Optimize First)
```
⚠️ 5-9 sign-ups at $30-60 per acquisition
⚠️ CTR 2-3%
⚠️ 25-50% of sign-ups generate API keys
→ ACTION: Optimize ads, test keywords, continue 30 more days
```

### **WEAK VALIDATION** (Pivot or Stop)
```
❌ <5 sign-ups at >$60 per acquisition
❌ CTR <2%
❌ High bounce rate (>70%)
❌ Few/no API key generations
→ ACTION: Reconsider market or messaging
```

---

## 3. Timeline Recommendation: 60 Days

**Phase 1: Days 1-14 (Learning Phase)**
- Google's algorithm learns your audience
- Expect higher costs, lower conversions
- Focus: Monitor, don't panic

**Phase 2: Days 15-30 (Optimization Phase)**
- Data becomes meaningful
- Make first optimization decisions
- Pause poor performers, boost winners

**Phase 3: Days 31-60 (Decision Phase)**
- Clear patterns emerge
- Make go/no-go decision on product
- Scale or pivot based on data

---

## ACTION PLAN: IMMEDIATE NEXT STEPS

### BEFORE You Click "Publish Campaign"

You MUST complete these steps in order:

---

### ✅ STEP 1: Set Up Google Analytics (30 minutes)

**Why First?**
Without this, you can't track conversions = wasted ad spend

**DO THIS NOW:**

1. Go to: https://analytics.google.com
2. Click "Start measuring"
3. Create account: "Fetcha Weather"
4. Add property: "fetcha.net"
5. Set up data stream: Web
6. Copy your Measurement ID (looks like: G-XXXXXXXXXX)

**Then add this code to ALL your website pages:**

Open `03_Website/frontend/index.html` and add RIGHT AFTER `<head>` tag:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Add to these files:**
- index.html
- docs.html
- login.html
- weather-dashboard.html
- terms.html
- privacy.html

---

### ✅ STEP 2: Set Up Conversion Tracking (15 minutes)

**In Google Ads:**

1. Click: Tools & Settings (wrench icon)
2. Click: Conversions
3. Click: + New Conversion Action
4. Select: Website
5. Enter URL: https://fetcha.net
6. Click: Scan
7. Click: Add a conversion action manually
8. Category: Sign-up
9. Name: "Account Sign-up"
10. Value: $10 (helps Google optimize)
11. Count: One per user
12. Click window: 30 days
13. Create and Continue

**You'll get a tag like this:**

```html
<!-- Event snippet for Account Sign-up conversion page -->
<script>
  gtag('event', 'conversion', {'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXX'});
</script>
```

**Add this tag to your sign-up success page.**

Since you're using email verification, you need to trigger this AFTER successful sign-up.

I'll create a tracking script for you below.

---

### ✅ STEP 3: Campaign Settings (Follow the Main Guide)

Use the settings from GOOGLE_ADS_CAMPAIGN_SETUP.md:

**Quick Reference:**
- Objective: Leads
- Type: Search
- Budget: $20/day
- Bidding: Maximize Conversions
- Location: Australia
- Keywords: 10-15 from the guide
- Negative Keywords: Add all suggested

---

### ✅ STEP 4: Create 2-3 Ads Per Ad Group

**Use the ad copy templates from the main guide.**

Minimum viable: 2 ad groups × 2 ads = 4 ads total

---

### ✅ STEP 5: Launch & Monitor

**Daily for First Week:**
- Check impressions (should be >0)
- Check CTR (aim for >2%)
- Check Quality Score
- Add negative keywords as needed

**Weekly After That:**
- Review Search Terms Report
- Optimize bids
- Test new ad variations

---

## FILE CHANGES NEEDED

I'll help you implement Google Analytics and conversion tracking in your website files.

---

## CRITICAL SUCCESS FACTORS

### Before Launch:
- [ ] Google Analytics installed on all pages
- [ ] Conversion tracking tested and working
- [ ] Campaign settings match recommendations
- [ ] Budget set to $20/day
- [ ] Keywords and negatives added
- [ ] At least 2 ads per ad group created

### After Launch (Week 1):
- [ ] Verify ads are showing (check daily)
- [ ] Monitor CTR (should be >1% minimum)
- [ ] Check conversion tracking is firing
- [ ] Add negative keywords from search terms

### Decision Point (Day 30):
- [ ] Review total sign-ups vs cost
- [ ] Calculate cost per acquisition
- [ ] Check API key generation rate
- [ ] Decide: Scale, Optimize, or Stop

---

## WHAT TO DO RIGHT NOW

1. **Set up Google Analytics** (I'll help you add the code)
2. **Set up Conversion Tracking** in Google Ads
3. **Complete Campaign Setup** following main guide
4. **Launch with $20/day budget**
5. **Monitor daily for first week**

---

## SUPPORT & NEXT STEPS

Would you like me to:
- Add Google Analytics code to your website files?
- Create conversion tracking scripts for your sign-up flow?
- Set up a monitoring dashboard template?
- Create email alert scripts for performance issues?

Let me know and I'll implement these for you immediately.

---

## REALISTIC EXPECTATIONS

**Month 1 Forecast ($600 budget):**
- Clicks: 120-200
- Sign-ups: 3-10
- Cost per sign-up: $60-200
- Quality data: Yes
- Market validation: Probable

**If Successful, Month 2 ($1,200 budget):**
- Clicks: 300-500
- Sign-ups: 15-30
- Cost per sign-up: $40-80
- Clear patterns: Yes
- Scale decision: Clear

---

*Ready to proceed? Let me add Google Analytics to your website files.*
