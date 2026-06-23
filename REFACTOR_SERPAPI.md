# SerpAPI Refactor: "Search-Once, Serve-Forever" Architecture

## Overview

This refactor replaces the per-request Claude Haiku ranking + Gemini chat + Rainforest fetching system with a **credit-lean, permanent-cache-first** architecture:

- **Old:** Every recommendation form → Claude Haiku call. Every chat → Gemini + Rainforest call.
- **New:** First unique query → SerpAPI call (₹~0.005 per call). Every subsequent identical query → database hit (₹0).

## What Changed

### Removed
- `lib/claude.ts` — No more per-request Claude ranking
- `lib/gemini.ts` — Gemini is now optional (one-time blurb generation only)
- Rainforest API integration — No longer fetching live product data
- `recommendation_cache` (24h TTL) — Replaced with permanent `search_cache`
- `laptop_explanations` table — Replaced with `products.why_text` (one-time, permanent)

### Added
- `migrations/001_add_products_search_schema.sql` — New `products`, `search_cache`, `search_log` tables
- `lib/normalize.ts` — Deterministic query parser (budget, use-case, brand, OS)
- `lib/serpapi.ts` — SerpAPI Google Shopping integration
- `lib/rank.ts` — Deterministic scoring (45% rating + 30% reviews + 25% value)
- `lib/blurb.ts` — One-time AI blurb generation (cached forever)
- `lib/db.ts` — Database operations (cache read/write, product upsert)
- `lib/search-pipeline.ts` — Main orchestration pipeline
- `app/api/admin/revalidate-cache/route.ts` — Force-refresh a cached search

### Refactored
- `app/api/recommend/route.ts` — Now uses search pipeline instead of Claude
- `app/api/chat/route.ts` — Now uses search pipeline + Gemini (Gemini handles conversation, not ranking)

## Database Schema

### `products` (forever)
Master catalogue of all found laptops. Gets updated on each SerpAPI fetch, but **never deleted**.

```sql
id uuid primary key
source text                    -- 'google_shopping'
source_product_id text        -- dedup key
title text
brand text
price numeric                 -- latest known price
rating numeric                -- 0-5
reviews_count int
image_url text
product_url text
specs jsonb                   -- {cpu, ram, storage, display, os}
use_case_tags text[]          -- ['gaming', 'coding', ...]
why_text text                 -- one-time generated blurb
first_seen_at timestamptz
last_updated_at timestamptz
```

### `search_cache` (permanent)
Query cache. Stores normalized query + ranked product IDs. **Forever — no TTL.**

```sql
query_hash text primary key
normalized_query jsonb        -- {budget_max, budget_band, use_case, brand, os}
raw_query_text text
result_product_ids uuid[]     -- ordered by rank score
fetched_at timestamptz
hit_count int
```

### `search_log` (analytics)
Demand signal. Tracks every search.

```sql
id bigserial primary key
raw_query text
normalized_query jsonb
query_hash text
cache_hit boolean
session_id text
ip_address text
created_at timestamptz
```

## Flow: A Student's First Search for "gaming laptop under 80k"

```
1. POST /api/recommend { role: 'gamer', primary_use: 'gaming', budget: '50000-80000', ... }
2. buildQueryFromForm() → "gaming laptop under ₹80000"
3. searchPipeline(rawQuery, sessionId, ip):
   a. normalize() → { budget_max: 80000, budget_band: 80000, use_case: 'gaming', brand: null, os: null }
   b. hashQuery() → "a1b2c3d4..." (SHA1)
   c. SELECT FROM search_cache WHERE query_hash = "a1b2c3d4..." → NO HIT
   d. acquireInFlightLock("a1b2c3d4...") → Success
   e. fetchFromSerpAPI(normalized) → 20 products
   f. upsertProducts(products) → Insert/update in products table
   g. rankAndSlice(products, budget_max, 5) → Score & rank
   h. INSERT search_cache { query_hash, normalized_query, result_product_ids, ... }
   i. ensureBlurbs(products) → Generate missing why_text (Gemini if configured, else template)
   j. Return top 3 products
4. Response: { products: [...], cached: false, fetched_at: "..." }

Total cost: 1 SerpAPI call (~₹0.005) + ~1 Gemini call if blurbs missing (~₹0.0001-0.001)
```

## Flow: Second Student Searching for "gaming laptop under 80k" (Cache Hit)

```
1. Same POST request
2. buildQueryFromForm() → "gaming laptop under ₹80000" (IDENTICAL)
3. searchPipeline():
   a. normalize() → SAME normalized query
   b. hashQuery() → SAME hash "a1b2c3d4..."
   c. SELECT FROM search_cache WHERE query_hash = "a1b2c3d4..." → HIT!
   d. incrementCacheHitCount()
   e. getProductsByIds(cached.result_product_ids) → Fetch from products table
   f. logSearch(cache_hit=true)
   g. Return products
4. Response: { products: [...], cached: true, fetched_at: "..." }

Total cost: $0 (database read only)
```

## Cost Estimates

| Scenario | Cost | Notes |
|----------|------|-------|
| Cold search (first time) | ₹0.005 + ₹0.0001 | 1 SerpAPI + Gemini blurb |
| Warm search (cache hit) | ₹0 | Database read only |
| Monthly (100 students, 70% hit) | ~₹0.15 | 30 cold + 70 warm |
| Annual | ~₹1.80 | Negligible |

**vs. Old System (Claude + Gemini):**
- Old: 100 searches/month × ₹0.05/request = ₹5/month
- New: 30 unique searches/month × ₹0.005/request = ₹0.15/month
- **Savings: 97%**

## Query Normalization Examples

| Input | Normalized |
|-------|-----------|
| "gaming laptop under 80k" | budget_band: 80000, use_case: 'gaming' |
| "best laptop 80000" | budget_band: 80000, use_case: 'general' |
| "gaming laptop" | budget_band: null, use_case: 'gaming' |
| "MacBook for coding" | brand: 'Apple', os: 'macos', use_case: 'coding' |

**Same normalized query = Same `query_hash` = One SerpAPI call, infinite reuses**

## Admin Revalidation

Force-refresh a cached search (e.g., prices changed):

```bash
curl -X POST http://localhost:3000/api/admin/revalidate-cache \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query_hash": "a1b2c3d4..."}'
```

Next request will re-fetch from SerpAPI.

## Environment Variables

### New (Only SerpAPI is paid)
```
SERPAPI_KEY=                   # ONLY paid API, all other calls free
GEMINI_API_KEY=                # Optional, for one-time blurbs (leave blank = template)
ADMIN_KEY=                     # For revalidation endpoint
```

### Still Required
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=     # Server-side only
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Acceptance Criteria Checklist

- [x] Two identical searches → 1 SerpAPI call total, 2nd is DB hit
- [x] "laptops under 80k" and "best laptop 80000" map to same query_hash
- [x] Results filtered by budget, ranked by deterministic formula
- [x] Every returned laptop persisted in products table
- [x] why_text generated at most once per laptop
- [x] No Claude/Gemini call on cache HIT
- [x] No Rainforest usage anywhere
- [x] search_log records every query with cache_hit flag

## Deployment Steps

1. **Run migration:**
   ```bash
   # In Supabase SQL Editor, run migrations/001_add_products_search_schema.sql
   ```

2. **Set environment variables:**
   ```
   SERPAPI_KEY=your-key
   GEMINI_API_KEY=optional-key
   ADMIN_KEY=random-key
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "refactor: search-once, serve-forever with SerpAPI + permanent cache"
   npm run build
   git push
   ```

4. **Test:**
   ```bash
   curl -X POST http://localhost:3000/api/recommend \
     -H "Content-Type: application/json" \
     -d '{
       "role": "gamer",
       "primary_use": "gaming",
       "budget_key": "₹50,000 – ₹80,000",
       "top_priority": "raw-performance",
       "os_preference": "Windows"
     }'
   ```

   Expected response (first call):
   ```json
   {
     "products": [...],
     "cached": false,
     "fetched_at": "2024-12-20T..."
   }
   ```

   Call again → `"cached": true`

## Monitoring

- **Search analytics:** Query `search_log` to see demand signals
- **Cache performance:** Check `search_cache.hit_count` for popular queries
- **Product updates:** Monitor `products.last_updated_at` to see staleness

```sql
-- Top 10 most popular searches
SELECT query_hash, raw_query_text, hit_count + 1 as total_queries
FROM search_cache
ORDER BY (hit_count + 1) DESC
LIMIT 10;

-- Cache hit ratio
SELECT 
  COUNT(*) FILTER (WHERE cache_hit) as cache_hits,
  COUNT(*) FILTER (WHERE NOT cache_hit) as cache_misses,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit) / COUNT(*), 1) as hit_ratio_pct
FROM search_log;
```

## Future Improvements

1. **Smart revalidation:** Auto-refresh products older than 7 days on next request
2. **Demand-driven crawl:** Use search_log to identify hot queries, pre-fetch them weekly
3. **Per-category cache warming:** Periodically re-fetch top N use cases
4. **A/B test ranking:** Experiment with different scoring formulas on new searches
5. **User feedback loop:** Track click-through rates, adjust ranking accordingly

---

**Questions?** Check `lib/search-pipeline.ts` for the orchestration, or `lib/normalize.ts` for query parsing logic.
