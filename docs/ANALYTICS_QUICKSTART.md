# Analytics Quick Setup (15 minutes)

## ✅ What's Already Done
- GA4 script injection in `app/layout.tsx` ✓
- Dynamic sitemap generation in `app/sitemap.ts` ✓
- Structured data (JSON-LD) schemas ✓
- Robots.txt search engine rules ✓

## 🎯 What You Need to Do (4 Steps)

### Step 1: Create GA4 Property (3 minutes)

**Go to:** https://analytics.google.com

1. Click **Admin** (bottom left) → **Create Property**
2. Name it: `LaptopAdvisor`
3. Set timezone: `Asia/Kolkata`
4. Set currency: `INR`
5. Click **Create** → **Web** platform
6. Website URL: `https://laptick.in`
7. Click **Create Stream**
8. **Copy the Measurement ID** (starts with `G-`) — you'll need this in 30 seconds

### Step 2: Add to Environment (1 minute)

**Open `.env.local` in your project root:**
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
(Replace with your actual ID from Step 1)

**Save & restart dev server:**
```bash
npm run dev
```

### Step 3: Verify It's Working (2 minutes)

1. Open the app: `http://localhost:3000`
2. Make a recommendation request
3. Go back to GA4: **Admin → Debug view**
4. Should show events within 30 seconds

**Expected events:**
- `page_view`
- `recommendation_request`
- `affiliate_click`

### Step 4: Setup Google Search Console (9 minutes)

**Go to:** https://search.google.com/search-console

1. Click **Add property** → **URL prefix**
2. Enter: `https://laptick.in`
3. Click **Continue**

**Verify ownership (pick one):**

**Option A: HTML file (Easiest)**
- Download the verification file
- Place in `public/` folder
- Deploy: `npm run deploy`
- Click **Verify**

**Option B: HTML tag**
- Copy the meta tag
- Add to `app/layout.tsx` after line 99
- Deploy: `npm run deploy`
- Click **Verify**

**Submit sitemap:**
1. In Search Console → **Sitemaps** (left menu)
2. Enter: `https://laptick.in/sitemap.xml`
3. Click **Submit**

✅ **Done!** Your site is now being tracked.

---

## 📊 Monitor These Daily

### Google Analytics 4 (free)
- **Real-time** — Users visiting now
- **Acquisition → Traffic source** — Where do visitors come from
- **Events → recommendation_request** — Recommendation submissions
- **Events → affiliate_click** — Affiliate link clicks

### Google Search Console (free)
- **Performance** — Search keywords driving traffic
- **Coverage** — Pages Google indexed
- **Core Web Vitals** — Page speed performance

---

## 🎯 Success Targets (3 months)

| Metric | Target | Check Where |
|--------|--------|---|
| Organic traffic | 500+ visits/month | GA4 → Acquisition |
| Search impressions | 2000+ | Search Console → Performance |
| Avg ranking | Top 10 | Search Console → Performance |
| Affiliate clicks | 50+/month | GA4 → Events |
| Monthly revenue | $200-500 | Affiliate dashboard |

---

## 🔗 Full Guide

For detailed troubleshooting and optimization, see: **ANALYTICS_SETUP.md**

## 🚀 Deploy

After adding `NEXT_PUBLIC_GA_ID`:
```bash
npm run deploy
```

That's it! Analytics will start collecting data within 24 hours.
