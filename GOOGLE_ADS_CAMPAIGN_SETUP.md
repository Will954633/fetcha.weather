# Google Ads Campaign Setup Guide for Fetcha Weather
Version: v1.0 • Updated: 2025-03-11 15:05 AEST (Brisbane)

## Campaign Overview
**Objective**: Validate market demand for Fetcha Weather API before further development
**Budget Approach**: Start small, test, then scale based on results
**Success Metrics**: Sign-ups, API key requests, user engagement

---

## Step 1: Choose Your Campaign Objective

You're currently on the "What's your campaign objective?" page. Here's what to select:

### **RECOMMENDED: Select "Leads"**

**Why?** 
- Your goal is to get potential customers to sign up for API keys
- This optimizes for conversions (sign-ups) rather than just website visits
- Better tracking and measurement of actual interest

**Alternative Options (and why NOT to choose them):**
- ❌ **Website Traffic**: Only good for awareness, not conversion tracking
- ❌ **Sales**: Better for e-commerce with immediate transactions
- ❌ **Brand Awareness**: Too broad for MVP validation
- ❌ **App Promotion**: Not applicable

### What to Click:
```
✅ Click: "Leads" → Continue
```

---

## Step 2: Campaign Type Selection

### **RECOMMENDED: Search Campaign**

**Why Search Campaigns?**
- People actively searching for weather APIs are high-intent users
- Lower cost than Display/Video for B2B/developer audience
- Direct response format fits your validation goals

**What to Click:**
```
✅ Click: "Search" → Continue
```

---

## Step 3: Campaign Settings

### 3a. Campaign Name
```
Name: "Fetcha Weather - Search - Australia - Test"
```
(Clear naming helps track performance later)

### 3b. Networks
**Recommended Settings:**
- ✅ **Search Network**: ON
- ❌ **Display Network**: OFF (too broad for initial test)
- ❌ **Search Partners**: OFF initially (test Google Search first)

### 3c. Location Targeting
**For MVP Validation Test:**
```
Target Location: Australia
```

**Why?**
- Your weather data is Australian BOM data
- Smaller, focused market for testing
- Lower competition = lower costs
- Can expand internationally later if successful

### 3d. Language
```
Language: English
```

### 3e. Audience Segments
**Initial Recommendation:**
- Leave broad for now
- Can add later: "Technology Enthusiasts", "Business Professionals"

---

## Step 4: Budget and Bidding

### Daily Budget Recommendation
```
Starting Budget: $10-20 AUD/day ($300-600/month)
```

**Why This Amount?**
- Enough to gather meaningful data
- Low risk for validation phase
- Can identify if there's genuine interest
- Typical CPC for developer/B2B keywords: $2-5 AUD

**Expected Results at $20/day:**
- ~100-200 clicks per month
- If 2-5% convert → 2-10 sign-ups
- If you get 10+ sign-ups, you've validated demand

### Bidding Strategy
**RECOMMENDED:**
```
Strategy: "Maximize Conversions"
```

**Why?**
- Google's AI optimizes for your conversion goal (sign-ups)
- Automatically adjusts bids
- Good for beginners

**If "Maximize Conversions" isn't available yet:**
```
Fallback: "Manual CPC" with Enhanced CPC enabled
Starting bid: $3 AUD
```

---

## Step 5: Ad Extensions

**MUST ENABLE:**
- ✅ **Sitelink Extensions**: Add links to:
  - "API Documentation" → https://fetcha.net/docs.html
  - "Sign Up Free" → https://fetcha.net/login.html
  - "Pricing" → https://fetcha.net/#pricing

- ✅ **Callout Extensions**: Add:
  - "Free API Key"
  - "Australian Weather Data"
  - "Bureau of Meteorology Data"
  - "Historical Data Available"

- ✅ **Structured Snippets**: Add:
  - Types: Historical Data, Current Conditions, Forecasts

---

## Step 6: Keywords

### Core Keyword Strategy

**Keyword Match Types:**
- **Exact Match** [keyword]: Most specific, lowest volume, highest intent
- **Phrase Match** "keyword": Medium specificity
- **Broad Match** keyword: Widest reach, use carefully

### RECOMMENDED KEYWORDS (Start with these):

**High Intent - Exact Match [keyword]:**
```
[australian weather api]
[bom api]
[bureau of meteorology api]
[weather api australia]
[historical weather data australia]
[weather data api free]
```

**Medium Intent - Phrase Match "keyword":**
```
"weather api"
"historical weather data"
"climate data api"
"weather forecast api"
```

**Avoid Initially:**
- ❌ Broad match (too expensive, low quality)
- ❌ Generic terms like "weather" (too broad)
- ❌ International weather APIs (wrong audience)

### Negative Keywords (Add these immediately):
```
-free weather app
-weather forecast today
-weather tomorrow
-weather radar
-accuweather
-bom website
-weather channel
```

**Why?** These searches indicate consumers, not developers/businesses

---

## Step 7: Ad Copy Creation

### Ad Group 1: Australian Weather API

**Headline Ideas (use 3-15):**
```
1. Australian Weather API | Free Tier
2. BOM Historical Weather Data
3. Weather API for Developers
4. Bureau of Meteorology Data
5. Reliable Australian Weather API
6. Free Weather API Key | Sign Up Now
7. Historical Climate Data | Australia
8. Weather Data Integration
```

**Description Lines (use 2-4):**
```
1. Access Australian weather data via simple API. Bureau of Meteorology historical data. Free tier available. Sign up in minutes.

2. Get accurate Australian weather data for your app or business. Easy integration. Comprehensive historical records from BOM.
```

**Final URL:**
```
https://fetcha.net
```

**Display Path:**
```
fetcha.net/weather-api
```

### Ad Group 2: Historical Weather Data

**Headline Ideas:**
```
1. Historical Weather Data Australia
2. BOM Climate Records API
3. Decades of Weather History
4. Australian Climate Data Access
5. Weather Trends & Analysis
6. Historical Temperature Data
```

**Description Lines:**
```
1. Access decades of Australian weather records. Perfect for analysis, research, and planning. Bureau of Meteorology verified data.

2. Comprehensive historical weather API. Daily observations, climate trends, temperature records. Start free today.
```

---

## Step 8: Conversion Tracking Setup

### CRITICAL: Set Up Conversion Tracking

**What to Track:**
1. ✅ Sign-up completions (primary goal)
2. ✅ API key generation
3. ✅ Documentation page views (secondary)

### How to Set Up:

#### Option 1: Google Tag Manager (Recommended)
1. Go to Google Ads → Goals → Conversions → New Conversion Action
2. Choose "Website"
3. Conversion Category: "Sign-up"
4. Value: Use different values:
   - Sign-up: $10
   - API Key Generated: $25
   - (This helps Google optimize)

#### Option 2: Direct Tag
Add this to your sign-up success page:
```html
<!-- Google Ads Conversion Tag -->
<script>
gtag('event', 'conversion', {
    'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
    'value': 10.0,
    'currency': 'AUD'
});
</script>
```

**Where to get the tag:**
Google Ads → Tools → Conversions → Set up conversion tracking

---

## Step 9: Landing Page Optimization

### Pre-Launch Checklist:

**Your Landing Page (fetcha.net) Should Have:**
- ✅ Clear headline about Australian weather API
- ✅ Visible "Sign Up" button above the fold
- ✅ Trust indicators (BOM data, free tier)
- ✅ Simple sign-up process (currently good!)
- ✅ Clear value proposition
- ✅ API documentation link
- ✅ Fast load time (<3 seconds)

**Quick Wins to Consider:**
1. Add a banner: "Get Your Free API Key - Australian Weather Data"
2. Highlight "Bureau of Meteorology" prominently
3. Show example API response
4. Add testimonial placeholder even if empty

---

## Step 10: Launch Checklist

**Before Clicking "Publish Campaign":**

- [ ] Conversion tracking installed and tested
- [ ] Daily budget set ($10-20 AUD)
- [ ] Location: Australia only
- [ ] Keywords: 10-15 high-intent keywords
- [ ] Negative keywords: Added
- [ ] Ad extensions: At least 3 sitelinks
- [ ] 2-3 ads per ad group
- [ ] Landing page loads correctly
- [ ] Sign-up process tested
- [ ] Google Analytics connected

---

## Step 11: Post-Launch Monitoring

### First 7 Days:

**Daily Checks:**
- Impressions: Are your ads showing?
- CTR (Click-Through Rate): Aim for >2%
- CPC (Cost Per Click): Should be $2-5 AUD
- Quality Score: Check keyword quality scores

**Red Flags:**
- ❌ 0 impressions → Keywords too specific or bid too low
- ❌ CTR <1% → Ad copy not compelling
- ❌ High clicks, 0 conversions → Landing page issue

### Week 2-4: Optimization

**What to Adjust:**
1. Pause keywords with 0 impressions after 7 days
2. Increase bids on keywords with conversions
3. Test new ad copy variations
4. Add more negative keywords based on search terms report

---

## Step 12: Success Metrics for Market Validation

### What Numbers Validate Demand?

**Strong Validation Signals:**
- ✅ 5+ sign-ups in first month at <$50 cost per acquisition
- ✅ CTR >3% on core keywords
- ✅ Multiple users generating API keys
- ✅ Quality Score >7 on main keywords

**Weak Demand Signals:**
- ❌ <2 sign-ups after $300 spend
- ❌ CTR <1%
- ❌ High bounce rate (>70%) on landing page
- ❌ No API key generation from sign-ups

**Decision Framework:**
```
IF: 10+ quality sign-ups at <$30 CPA
THEN: Market validated → Increase budget, expand features

IF: 3-9 sign-ups at $30-60 CPA
THEN: Moderate interest → Optimize campaign, test messaging

IF: <3 sign-ups at >$60 CPA
THEN: Weak demand → Pivot messaging or reconsider market
```

---

## Budget Scenarios

### Conservative ($300/month = $10/day)
- Expected clicks: 60-100
- Expected conversions: 1-3 sign-ups
- Cost per acquisition: $100-300
- **Use for:** Initial validation

### Moderate ($600/month = $20/day)
- Expected clicks: 120-200
- Expected conversions: 3-10 sign-ups
- Cost per acquisition: $60-200
- **Use for:** Serious validation testing

### Aggressive ($1500/month = $50/day)
- Expected clicks: 300-500
- Expected conversions: 10-25 sign-ups
- Cost per acquisition: $60-150
- **Use for:** If initial results are promising

---

## Quick Reference: Campaign Settings Summary

```yaml
Campaign Name: Fetcha Weather - Search - Australia - Test
Campaign Type: Search
Network: Google Search only
Location: Australia
Language: English
Budget: $20 AUD/day
Bidding: Maximize Conversions
Keywords: 10-15 exact/phrase match
Negative Keywords: 10+ consumer terms
Ad Extensions: Sitelinks, Callouts, Structured Snippets
Conversion Tracking: Sign-ups + API key generation
Landing Page: https://fetcha.net
```

---

## Support Resources

**Google Ads Help:**
- Keyword Planner: Plan and research keywords
- Search Terms Report: See what people actually searched
- Auction Insights: See competitor activity
- Recommendations: Google's optimization suggestions

**Key Reports to Check Weekly:**
1. Search Terms Report (find new keywords/negatives)
2. Keyword Performance (pause low performers)
3. Ad Performance (test variations)
4. Landing Page Experience (check quality scores)

---

## Next Steps After This Guide

1. **Complete the campaign setup** using the recommendations above
2. **Set up conversion tracking** (CRITICAL - do this first!)
3. **Launch with conservative budget** ($10-20/day)
4. **Monitor daily for first week**
5. **Review results after 2 weeks**
6. **Make optimization decisions** based on data

---

## Questions to Consider

Before launching, think about:
1. What's your maximum cost per sign-up you're willing to pay?
2. How many sign-ups would validate market demand for you?
3. Do you have time to monitor daily for the first week?
4. Is your sign-up process as frictionless as possible?

---

## IMPORTANT NOTES

⚠️ **Do NOT launch until conversion tracking is installed**
⚠️ **Start small** - You can always increase budget if it works
⚠️ **Mobile matters** - 50%+ of clicks will be mobile
⚠️ **Quality Score impacts cost** - Good ads + landing page = lower costs
⚠️ **Be patient** - Need 2-4 weeks of data to make informed decisions

---

*This guide will be updated as we gather campaign data and insights.*
