# Analytics & Google Search Console Setup

Complete guide to setting up tracking for the LaptopAdvisor project.

## Part 1: Google Analytics 4 (GA4) Setup

### Step 1: Create GA4 Property

1. Go to **https://analytics.google.com**
2. Click **Admin** (bottom left)
3. Click **Create Property**
4. Fill in:
   - **Property name:** `LaptopAdvisor` (or your site name)
   - **Reporting timezone:** `Asia/Kolkata` (for India focus)
   - **Currency:** `INR`
5. Click **Create**
6. Choose **Web** as platform
7. Add website details:
   - **Website URL:** `https://laptick.in` (or your domain)
   - **Stream name:** `Web`
8. Click **Create stream**

### Step 2: Get Measurement ID

After creating the stream:
1. You'll see a **Measurement ID** starting with `G-`
2. Copy it (looks like: `G-XXXXXXXX123`)

### Step 3: Add to Environment

1. Open `.env.local` in project root
2. Add the line:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXX123
   ```
   (Replace with your actual measurement ID)
3. Save file

### Step 4: Verify Setup

The app already has GA4 integration in `app/layout.tsx`. Verify it's configured:

```tsx
// Should include something like:
<Script
  strategy="afterInteractive"
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
/>
```

### Step 5: Test Data Collection

1. Run the app: `npm run dev`
2. Make a recommendation request
3. In GA4, go to **Admin → Debug view**
4. You should see events coming in (may take 30 seconds)

Expected events:
- `page_view` — user visits any page
- `recommendation_request` — user submits recommendation form
- `result_click` — user clicks a laptop result
- `affiliate_click` — user clicks Amazon affiliate link
- `blog_view` — user views a blog post

### GA4 Custom Events (Already Implemented)

The app tracks these custom events:

```javascript
// When user submits recommendation
gtag('event', 'recommendation_request', {
  role: form.role,
  use_case: form.primary_use,
  budget: form.budget_key,
  priority: form.top_priority
});

// When user clicks a result laptop
gtag('event', 'result_click', {
  laptop_id: laptopId,
  rank: rankPosition,
  use_case: useCase
});

// When user clicks affiliate link
gtag('event', 'affiliate_click', {
  laptop_id: laptopId,
  laptop_name: name,
  affiliate_store: 'amazon_in'
});

// When user views blog post
gtag('event', 'blog_view', {
  blog_id: postId,
  blog_title: title
});
```

## Part 2: Google Search Console Setup

### Step 1: Create/Verify Domain

1. Go to **https://search.google.com/search-console**
2. Click **Start now** or **Add property**
3. Choose **URL prefix** (simpler)
4. Enter your domain: `https://laptick.in`
5. Click **Continue**

### Step 2: Verify Ownership

Google will ask you to verify you own the domain. Choose one method:

**Method A: HTML file (Easiest)**
1. Google gives you a file like: `googleXXXXXXXXXXXXXXXX.html`
2. Place it in `public/` folder: `public/googleXXXXXXXXXXXXXXXX.html`
3. Deploy to Vercel: `npm run deploy`
4. Return to Google Search Console
5. Click **Verify**

**Method B: HTML tag**
1. Google gives you a meta tag: `<meta name="google-site-verification" content="..." />`
2. Add to `app/layout.tsx`:
   ```tsx
   <meta name="google-site-verification" content="YOUR_TOKEN_HERE" />
   ```
3. Deploy
4. Click **Verify**

**Method C: DNS record (If you own the domain)**
1. Add a TXT record to your domain's DNS settings
2. Google provides the exact record
3. Wait for propagation (can take hours)
4. Click **Verify**

### Step 3: Submit Sitemap

1. In Google Search Console, go to **Sitemaps** (left menu)
2. Enter: `https://laptick.in/sitemap.xml`
3. Click **Submit**
4. Google will crawl all your pages

The sitemap is auto-generated at build time from:
- All active laptops (`/laptops/[slug]`)
- All published blog posts (`/blog/[slug]`)
- Category pages (`/laptops?best_for=X`)

### Step 4: Monitor Performance

Once verified, you can monitor:

**Coverage** (Admin → Coverage)
- Shows which pages Google found
- Highlights any indexing errors

**Performance** (Performance)
- **Queries** — what searches lead to your site
- **Impressions** — how many times you appear in search results
- **CTR** — click-through rate (should be 5-8%)
- **Position** — average ranking for each keyword

**Core Web Vitals** (Experience → Core Web Vitals)
- Loading performance
- Interactivity
- Visual stability
- Shows which pages need optimization

### Step 5: Request Indexing

For new blog posts or laptop pages:
1. Go to **URL Inspection** (search bar at top)
2. Paste the URL: `https://laptick.in/blog/my-new-post`
3. Click **Request indexing**
4. Google crawls it immediately (vs waiting days)

## Part 3: Monitoring & Optimization

### Weekly Checks

**Google Analytics 4:**
1. Check **Real-time** → Verify users are visiting
2. Check **Acquisition** → Where users come from (organic, direct, affiliate)
3. Check **Engagement** → Most popular pages
4. Check **Conversions** → Track `affiliate_click` events

**Google Search Console:**
1. Check **Performance** → Which keywords are working
2. Check **Coverage** → Any indexing errors
3. Check **Core Web Vitals** → Performance metrics

### Optimization Targets

**GA4 Goals (Set up custom goals):**
- Recommendation requests > 100/day
- Affiliate clicks > 5% of recommendations
- Blog views contributing 20% of traffic

**Search Console Goals:**
- Top 10 ranking for "laptop recommendation india"
- 500+ monthly impressions
- 5%+ CTR (above average is 3-4%)
- 30+ indexed pages

## Part 4: Custom Dashboard Setup

### In Google Analytics 4

1. Create a custom dashboard for daily monitoring:
   - Real-time users
   - Daily recommendation requests (event count)
   - Daily affiliate clicks (event count)
   - Top pages
   - Traffic by source

2. Go to **Admin → Custom definitions → Create custom metric**
   - Create metric: `affiliate_click_rate` = `affiliate_click / recommendation_request`
   - This shows conversion rate

### Setup Data Studio (Free)

For prettier reports:
1. Go to **https://datastudio.google.com**
2. Create new report
3. Connect GA4 property
4. Build dashboard with:
   - Daily recommendations (line chart)
   - Affiliate clicks (gauge)
   - Conversion rate (scorecard)
   - Top laptops (bar chart)
   - Traffic source (pie chart)

## Part 5: Implementation Checklist

### Before Launch

- [ ] GA4 property created
- [ ] `NEXT_PUBLIC_GA_ID` added to `.env.local`
- [ ] App deployed with GA4 code
- [ ] Test events showing in GA4 debug view
- [ ] Domain verified in Google Search Console
- [ ] Sitemap submitted in Google Search Console
- [ ] Initial pages indexed (check Coverage)

### During First Month

- [ ] Monitor traffic daily in GA4
- [ ] Check Search Console for ranking keywords
- [ ] Fix any Core Web Vitals issues
- [ ] Request indexing for new blog posts
- [ ] Identify top-performing pages

### After 3 Months

- [ ] Analyze top search keywords
- [ ] Create more blog posts targeting high-intent keywords
- [ ] Optimize CTR for keywords where you rank 3-5
- [ ] Check conversion funnel (recommendation → affiliate click)
- [ ] Update underperforming laptop specs based on engagement

## Troubleshooting

### GA4 shows no events

**Problem:** `NEXT_PUBLIC_GA_ID` not set or wrong
- **Fix:** Check `.env.local` has correct `G-XXXXXXXX` ID
- **Fix:** Restart dev server after adding to `.env`
- **Fix:** Check Network tab in browser dev tools → `gtag.js` should load

### Google Search Console says "Not Verified"

**Problem:** Verification token not properly deployed
- **Fix:** Verify file is in `public/` folder
- **Fix:** Ensure you've deployed changes to Vercel
- **Fix:** Try DNS verification (more reliable for owned domains)

### Pages not indexing

**Problem:** Robots.txt blocking Google
- **Fix:** Check `public/robots.txt` allows `/laptops` and `/blog`
- **Fix:** Verify sitemap.xml is accessible at `https://laptick.in/sitemap.xml`
- **Fix:** Check for noindex meta tags (shouldn't exist)

### Core Web Vitals failing

**Problem:** Pages too slow
- **Fix:** Check if all explanation caches are pre-generated (should be instant)
- **Fix:** Optimize images (use Next.js Image component)
- **Fix:** Check database query performance
- **Fix:** See Vercel Analytics for bottlenecks

## Success Metrics

After 3 months with proper setup:

| Metric | Target | How to Monitor |
|--------|--------|---|
| Organic sessions | 500+ monthly | GA4 → Acquisition → Traffic source = Organic Search |
| Search impressions | 2000+ monthly | Google Search Console → Performance → Impressions |
| Average ranking | Top 10 | Google Search Console → Performance → Position |
| CTR | 5%+ | Google Search Console → Performance → CTR |
| Affiliate clicks | 50+ monthly | GA4 → Events → `affiliate_click` |
| Revenue | $200-500 | Affiliate dashboard + GA4 goals |

## Files Already Set Up

✅ `app/layout.tsx` — GA4 script injection  
✅ `app/sitemap.ts` — Dynamic sitemap generation  
✅ `public/robots.txt` — Search engine crawling rules  
✅ Structured data (JSON-LD) — Product, Article, Breadcrumb schemas  

All you need to do is:
1. Create GA4 property
2. Get Measurement ID
3. Add to `.env.local`
4. Verify in Google Search Console
5. Submit sitemap

---

**Questions?** See CLAUDE.md "Analytics & Monitoring" section for overview.
