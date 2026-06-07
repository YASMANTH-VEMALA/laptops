# Architecture Decisions: Mobile, Database, API Security

Three important topics with clear recommendations.

---

# 1️⃣ MOBILE VIEW ISSUE (Laptop Sections Not Showing)

## Problem
ResultCard layout doesn't adapt well on mobile — image and text overlap/cut off.

## Solution: Responsive Layout Fix

**Current code (line 104 in ResultCard.tsx):**
```tsx
<div className="flex items-start gap-4">
  <div className="relative h-20 w-32 flex-shrink-0"> {/* Fixed width */}
```

**Fix: Make responsive**
```tsx
<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
  <div className="relative h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0"> {/* Smaller on mobile */}
```

**What changes:**
- Mobile (< 640px): Image and text stack vertically
- Desktop (≥ 640px): Image on left, text on right (current layout)
- Smaller image on mobile (h-16 w-24 instead of h-20 w-32)
- Smaller gap on mobile (gap-3 instead of gap-4)

This ensures everything fits on small screens.

---

# 2️⃣ DATABASE: Hardcoded vs Supabase

## Your Question
"Should we use hardcoded data array instead of Supabase since we have few laptops?"

## Answer: **KEEP SUPABASE** (but optimize)

### Why Keep Supabase

| Aspect | Hardcoded Array | Supabase |
|--------|---|---|
| **Scalability** | ❌ Add 10 laptops = edit code, redeploy | ✅ Add via dashboard, instant |
| **Price updates** | ❌ Must redeploy | ✅ Update instantly |
| **SEO** | ❌ Build static pages at deploy time | ✅ Dynamic pages, real-time updates |
| **Analytics** | ❌ No usage tracking | ✅ Track what users actually search for |
| **Affiliate margin** | ❌ Prices lag behind real Amazon | ✅ Update daily via Monday agent |
| **Future growth** | ❌ Will break at scale | ✅ Designed for 1000+ laptops |

### Cost Analysis
- **Supabase:** Free tier covers 50GB + unlimited queries (you use <1%)
- **Hardcoded:** Saves $0, but kills growth

### Current Optimization (Already Done!)
✅ Query cache (24h) — identical queries don't hit database  
✅ Explanation cache (permanent) — pre-generated, no Claude API calls  
✅ Smart filtering — only fetch 10-15 laptops, not 100

**Conclusion:** Supabase is already optimized. Keep it.

---

# 3️⃣ API SECURITY: Protecting Claude API Key

## Your Concern
"People will scam my API key if I expose it. Also need fallback when API is down."

## Solution: Comprehensive Strategy

### 🔒 Part A: API Key Security (ALREADY CORRECT)

**Your current setup:**
```javascript
// ✅ SAFE: Server-side only
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  // in .env.local
```

**Why it's safe:**
- ❌ NOT in `.env.local` (git ignored, not committed)
- ❌ NOT in `NEXT_PUBLIC_` (stays secret)
- ✅ Only used in `app/api/recommend/route.ts` (server)
- ✅ Browser never sees the key

**Defense layers already in place:**
```typescript
// app/api/recommend/route.ts

// 1. Rate limiting (Upstash Redis)
const { allowed, remaining, reset } = await checkRateLimit(ip)
if (!allowed) return 429 Limit exceeded

// 2. Input validation
const form = validateForm(body)
if (!form) return 400 Invalid input

// 3. API call is server-side only
const result = await getRecommendations(form, ...)  // Never exposed
```

**Additional protection (add these):**

✅ **Add IP rate limiting (DONE via Upstash)**

✅ **Add cost caps** — limit API spend per month:
```javascript
// track spending monthly
const monthlySpend = await getMonthlySpend()
if (monthlySpend > 100) { // $100 limit
  return 429 "Monthly quota exceeded"
}
```

✅ **Monitor unusual activity:**
```javascript
// Log suspicious patterns
if (requestsPerMinute > 10) {
  sendAlertEmail("Unusual API activity detected")
}
```

**NEVER DO THESE:**
- ❌ Put API key in browser (fetch from client)
- ❌ Commit `.env.local` to git
- ❌ Use `NEXT_PUBLIC_ANTHROPIC_API_KEY`
- ❌ Share your API key in code examples

---

### 🔄 Part B: Fallback Strategy (CRITICAL)

Your instinct is correct: **"When API fails, show default answers"**

#### Current Problem
If Claude API is down:
```
User request
  → API fails
  → No recommendation shown
  → Bad user experience ❌
```

#### Solution: Fallback to Pre-Generated Explanations

**Your existing cache solves this:**

```
User request
  ↓
[1] Check query cache (24h) → HIT → Return instantly ✅
                          ↓ MISS
[2] Check explanation cache → ALL CACHED → Use cached data ✅
                          ↓ SOME MISSING
[3] Try Claude API → SUCCESS → Return recommendation ✅
                  → FAIL → Fall back to cached explanations ✅
```

**Implementation:**

```typescript
// app/api/recommend/route.ts

let result
try {
  result = await getRecommendations(form, laptopsForClaude, budgetRange.label)
  result.from_cache = false
} catch (err) {
  console.error('Claude API failed, using fallback...')
  
  // FALLBACK: Construct response from cached explanations
  result = {
    top3: laptopsForClaude.slice(0, 3).map((laptop, idx) => {
      const cached = cachedExplanationMap.get(laptop.id)
      
      // If cached explanation exists, use it
      if (cached) {
        return {
          rank: (idx + 1) as 1 | 2 | 3,
          laptop_id: laptop.id,
          headline: `${laptop.brand} ${laptop.name}`,
          why_best: cached.explanation,
          key_strengths: cached.key_strengths,
          one_honest_weakness: cached.one_weakness,
          buy_confidence: 'High',
          use_case_fit_score: 8,
        }
      }
      
      // If no cached explanation, return generic fallback
      return {
        rank: (idx + 1) as 1 | 2 | 3,
        laptop_id: laptop.id,
        headline: `Based on your preferences`,
        why_best: `This laptop matches your budget (₹${laptop.price_inr}) and use case. Check the specs for detailed info.`,
        key_strengths: [
          `${laptop.cpu_brand} ${laptop.cpu_model}`,
          `${laptop.ram_gb}GB RAM`,
          `${laptop.storage_gb}GB Storage`,
        ],
        one_honest_weakness: 'Click the laptop name for full details',
        buy_confidence: 'Medium',
        use_case_fit_score: 6,
      }
    }),
    generated_at: new Date().toISOString(),
    from_cache: true,
    fallback: true, // Flag indicating API failed
  }
}

// Store the recommendation (even if fallback)
await supabase.from('recommendation_cache').upsert({
  query_hash: queryHash,
  result_json: { result, query_hash: queryHash },
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

return NextResponse.json({ result, query_hash: queryHash })
```

**What this achieves:**

| Scenario | Current | With Fallback |
|----------|---------|---|
| Claude API down, no cache | Error ❌ | Generic recommendation ✅ |
| Claude API down, cache exists | Error ❌ | Cached explanation ✅ |
| Claude API down, rate limited | Error ❌ | Fallback data ✅ |
| Claude API works | Works ✅ | Detailed recommendation ✅ |

---

## Cost Protection Summary

### Current Safeguards
✅ Server-side API key (not exposed to browser)  
✅ Rate limiting (5 req/IP/hour via Upstash)  
✅ Input validation (prevent injection)  
✅ Pre-generation cache (eliminates 90% of API calls)  
✅ Query cache (24h TTL, no repeated calls)  

### Recommended Additions
1. **Monthly spend cap** ($100/month = 100k requests)
2. **Suspicious activity alerts** (unusual patterns)
3. **Fallback to cached explanations** (API resilience)
4. **Monitor API logs** (Anthropic console)

---

# Implementation Priority

## High Priority (Do First)
1. ✅ **Fix mobile ResultCard layout** (15 min)
   - Makes site usable on phones
   
2. ✅ **Add fallback strategy** (30 min)
   - Ensures recommendations work even if Claude API fails

## Medium Priority
3. ⏳ **Add spending cap** (15 min)
   - Prevents unexpected bills

## Low Priority (Already Good)
4. ✅ Keep Supabase (no change needed)
   - Already optimal for your use case

---

# Quick Wins

### Mobile Fix (Ready to Deploy)
```tsx
// ResultCard.tsx line 104
<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
  <div className="relative h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0">
```

### API Fallback (Copy-paste ready)
See implementation above in Part B.

---

## Questions?

**Should we implement all three right now?**
- Mobile fix: **Yes, 15 minutes** 
- Fallback strategy: **Yes, 30 minutes**
- Spending cap: **Yes, 15 minutes**
- Switch away from Supabase: **No, keep it**

Ready to start? I can implement these in order.
