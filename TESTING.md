# Testing Guide — LaptopAdvisor

All three phases are complete. Here's how to verify everything works.

## ✅ Phase 2: Web Search (Chat Integration)

### Local Testing

Start the dev server:
```bash
npm run dev
```

### Test Cases

**Test 1: Budget Query**
```
Input: "Best laptop under 50k for coding"
Expected:
- Chat shows real Amazon products from Rainforest
- Prices in ₹ (Indian Rupees)
- Gemini explains why each fits for coding
- Real Amazon.in links with affiliate tag
```

**Test 2: Use Case Detection**
```
Input: "Gaming laptop under 80k"
Expected:
- Detects: budget=80k, use_case=gaming
- Shows gaming laptops (RTX, high refresh rate)
- Explains GPU TGP and display Hz
```

**Test 3: Fallback Gracefully**
```
Input: "Gaming laptop under 80k" (when Rainforest is down)
Expected:
- Falls back to Supabase database
- Returns 28 pre-seeded laptops
- No error visible to user
- Chat still provides recommendations
```

**Test 4: Non-Laptop Question**
```
Input: "What's the best programming language?"
Expected:
- Doesn't trigger web search
- Responds without Rainforest calls
- General AI knowledge answer
```

---

## ✅ Phase 3: Catalog Ingestion (Cron Job)

### Manual Testing (Local)

```bash
# Ensure dev server is running in another terminal
npm run dev

# In a new terminal, set cron secret and test
CRON_SECRET=test-secret ./scripts/test-cron.sh
```

**Expected Output:**
```json
{
  "success": true,
  "timestamp": "2026-06-22T10:30:00Z",
  "duration_ms": 45000,
  "stats": {
    "queries_run": 20,
    "total_fetched": 150,
    "total_normalized": 120,
    "total_upserted": 120
  }
}
```

### What's Happening

The cron job runs these 20 queries against Rainforest:
1. `gaming laptop under 80000`
2. `ASUS ROG laptop`
3. `MSI gaming laptop`
4. ... (20 total)

For each:
- Fetches ~6-8 results
- Normalizes specs (RAM, CPU, GPU, display) from titles
- Deduplicates by ASIN (avoids duplicates)
- Upserts to Supabase

Result: 100-150 new laptops added to catalog weekly

---

## 🚀 Production Deployment

### Before Deploying to Vercel

1. **Generate cron secret:**
   ```bash
   openssl rand -hex 32
   # Copy the output
   ```

2. **Add to Vercel Environment Variables:**
   - Go to https://vercel.com/[your-project]/settings/environment-variables
   - Add key: `CRON_SECRET`
   - Add value: (paste the generated secret)
   - Save

3. **Verify vercel.json is committed:**
   ```bash
   git log --oneline vercel.json | head -1
   # Should show the cron config commit
   ```

4. **Deploy:**
   ```bash
   git push origin main
   # Vercel will auto-deploy
   ```

### After Deployment

1. **Verify Cron in Vercel Dashboard:**
   - Go to Settings → Cron Jobs
   - Should show: `/api/cron/ingest-batch` scheduled for Sundays 9:30pm UTC
   
2. **Wait for first run:**
   - Check back Sunday evening
   - Cron logs will appear in Vercel dashboard

3. **Monitor the Logs:**
   - First run should take 30-60 seconds
   - Watch for: total_upserted count increases
   - If errors, check Rainforest API quota

---

## 🔧 Troubleshooting

### Chat Returns "Too many messages"
**Cause:** Upstash Redis rate limiting active
**Fix:** Wait 60 seconds, or increase rate limit in `/api/chat/route.ts`

### Chat Says "AI service unavailable"
**Cause:** Gemini API down (temporary)
**Fix:** This is temporary. Google usually recovers within minutes. Try again.

### Cron test returns 502 from Rainforest
**Cause:** Rainforest API key issue or quota exhausted
**Fix:** 
- Verify `RAINFOREST_API_KEY` is set in `.env.local`
- Check Rainforest dashboard for usage/quota
- Try manual search: `/api/rainforest/search?q=laptop`

### Cron upsert returns 0 items
**Cause:** Rainforest returned 0 results (unlikely) or normalization filtered all
**Fix:**
- Check logs for "total_normalized" count
- If 0, Rainforest may be down
- Manually test a query: `curl "http://localhost:3000/api/rainforest/search?q=gaming+laptop"`

---

## 📊 Success Metrics

### After 1st cron run:
- [ ] `total_upserted` > 50
- [ ] No errors in logs
- [ ] Vercel dashboard shows cron executed

### After 4 weeks:
- [ ] 300+ total laptops in Supabase
- [ ] `best_for[]` tags populated (gaming, coding, etc.)
- [ ] Chat recommendations show variety (brand/price diversity)
- [ ] Recommendation latency <100ms (cached)

### Production Health:
- [ ] Weekly cron completes without error
- [ ] 0 rate limit rejections (HTTP 429)
- [ ] <1% recommendation failures

---

## 🎯 Next Iterations

Once Phase 3 is stable:

1. **Vector Search (pgvector):**
   - Embed laptop descriptions
   - Enable semantic search: "light laptop for travel"
   - Better relevance than keyword matching

2. **Dynamic Search Queries:**
   - Use GA4 to detect popular searches
   - Auto-generate cron queries from trends
   - Self-optimizing catalog

3. **Price Tracking:**
   - Store price history (time-series data)
   - Alert users on price drops
   - Trend analysis

4. **User Feedback:**
   - Track which recommendations users click
   - Improve ranking algorithm
   - A/B test different explanations
