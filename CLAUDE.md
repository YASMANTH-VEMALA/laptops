# LaptopAdvisor — Claude Code Project

AI-powered laptop recommendation engine with affiliate monetization.
Target audience: students, professionals, creators who know brand names but not specs.

## Project Stack
- **Next.js 14** (App Router) — framework
- **Supabase** (PostgreSQL + pgvector) — database + vector search
- **Claude Haiku 4.5** — recommendation engine (`claude-haiku-4-5`)
- **Upstash Redis** — rate limiting
- **Vercel** — hosting
- **Tailwind CSS + shadcn/ui** — UI

## Critical Security Rules
- The Claude API key MUST NEVER be used in client components or exposed to the browser
- All Claude API calls happen exclusively inside `app/api/recommend/route.ts` (server-side)
- Variables prefixed `NEXT_PUBLIC_` are visible to the browser — never put secrets there
- Rate limit: 5 requests per IP per hour via Upstash Redis

## Amazon Affiliate
- Store ID: `netha-21`
- All affiliate URLs format: `https://www.amazon.in/dp/[ASIN]?tag=netha-21`

## Database — Three-Layer Caching System
1. **Full Query Cache** (`recommendation_cache`) — SHA256 of form inputs, 24h TTL (eliminates Claude calls for identical queries)
2. **Per-Laptop Explanations** (`laptop_explanations`) — permanent cache of laptop explanations per use-case (eliminates Claude calls when all explanations cached)
3. **Knowledge Base** (`docs/LAPTOP_RECOMMENDATION_KNOWLEDGE_BASE.md`) — markdown reference for explanation generation (ensures consistent, detailed reasoning)

## Filtering Logic (Smart Pre-filter — Claude never sees all 100 laptops)
1. Budget range filter (eliminates ~70%)
2. OS preference filter
3. Use-case tag match on `best_for[]` array
4. Fallback: drop tag filter if < 6 results remain
→ Claude receives 10–15 laptops max

## Use-Case → Spec Focus
| Use Case | Claude Emphasizes |
|---|---|
| video-editing | GPU TGP wattage, RAM ≥16GB, display color accuracy |
| programming | CPU sustained clock, RAM, SSD speed |
| gaming | GPU TGP, display Hz, thermal design |
| general | Battery Wh, weight, value/rupee |
| business | Build quality, nits, webcam, portability |
| ai-ml | VRAM, RAM ≥32GB, CUDA cores |
| design | DCI-P3%, resolution, color calibration |
| content | Balanced: display + GPU TGP + battery |

## Custom Commands
- `/seed-laptops` — seed Supabase with initial 30 laptops
- `/gen-explanations` — pre-generate laptop explanations for all use-cases (eliminates Claude API calls during recommendation)
- `/update-db` — manually trigger Monday agent logic
- `/gen-seo` — generate a batch of SEO blog posts
- `/clear-cache` — purge stale recommendation_cache entries
- `/deploy` — deploy to Vercel and verify build

## Monday Agent (Automated DB Updates)
Runs every Monday at 9am via `/schedule`. Uses WebSearch + WebFetch (no scrapers).
Searches for new releases and price changes → upserts Supabase → clears stale cache.

**Cache invalidation strategy:**
- **New laptop:** No action needed. First user request in each use-case generates explanation, which is cached permanently.
- **Price change:** Clear `recommendation_cache` only (prices don't affect explanations).
- **Spec change:** Clear that laptop's `laptop_explanations` + clear all `recommendation_cache` (regenerate on next request).
- **Discontinuation:** Set `is_active=false` and clear `recommendation_cache`.

**How to invalidate:**
```bash
# Clear expired query caches (24h+)
curl -X DELETE http://localhost:3000/api/cache \
  -H "x-admin-key: $CACHE_ADMIN_KEY"

# Regenerate explanations for a laptop
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "x-admin-key: $CACHE_ADMIN_KEY" \
  -d '{"laptop_ids": ["uuid"], "force": true}'
```

## Cost Estimates
- **Warm cache (all explanations pre-generated):** ₹0.00 per request
- **Cold cache (explanation missing):** ~₹0.001 per request (Claude Haiku rate)
- **Query cache hit:** ₹0.00 (no Claude call, just database read)
- **Typical monthly:** 10k requests × 70% hit rate = ₹70 (₹0.007 per request average)

## SEO Architecture (Fully Automated)

### Infrastructure
- **Robots.txt** (`public/robots.txt`) — blocks API routes, points to dynamic sitemap
- **Dynamic Sitemap** (`app/sitemap.ts`) — auto-generated from all active laptops + published blogs at build time
- **Structured Data** (JSON-LD schemas):
  - **Product Schema** → laptop detail pages (for rich snippets, shopping tab)
  - **BreadcrumbList** → laptop pages (navigation hierarchy)
  - **BlogPosting** → blog pages (article metadata)
  - **Organization** → root layout (brand authority)

### Automatic Processes
**When Adding/Updating Laptops (via Monday agent or `/seed-laptops`):**
1. Database inserts with proper `slug`, `best_for[]`, specs
2. ✅ Sitemap auto-updates at next deploy (1-2 hours)
3. ✅ OG images generated on-demand via Vercel `next/og`
4. ✅ Category pages (`/laptops?best_for=X`) auto-updated
5. ✅ Cache invalidation automatic (prices → recommendation_cache clear, specs → laptop_explanations clear)
6. ✅ Related blog posts linked automatically

**When Publishing Blog Posts (via `/gen-seo`):**
1. Content generated with target keyword + featured_laptop_ids
2. ✅ Auto-published (set `published=true`)
3. ✅ Blog route `/blog/[slug]` serves dynamically with unique metadata
4. ✅ BlogPosting schema applied
5. ✅ Internal links to featured laptops created
6. ✅ Related blog posts linked back

### Analytics & Monitoring
- **Google Analytics 4** — set `NEXT_PUBLIC_GA_ID` in `.env.local` to enable
  - Tracks: recommendation requests, result clicks, affiliate clicks, blog views
  - Custom events: `recommendation_request`, `result_click`, `affiliate_click`, `blog_view`
- **Google Search Console** — manual setup at search.google.com
  - Submit sitemap: `https://laptick.in/sitemap.xml`
  - Monitor keywords, CTR, impressions for "laptop recommendation india"

### Three-Layer Cache + SEO Impact
1. **Full Query Cache** (24h) — identical user queries return instant results (zero Claude API latency)
2. **Per-Laptop Explanations** (permanent) — pre-generated Claude explanations per use-case
3. **Knowledge Base** (`docs/LAPTOP_RECOMMENDATION_KNOWLEDGE_BASE.md`) — Claude reference for consistent explanations

**SEO Benefit:** Faster pages = better Core Web Vitals = higher search rankings

### What You Don't Need to Do
- ❌ Manually create blog posts (use `/gen-seo`)
- ❌ Update sitemaps (automatic at build)
- ❌ Generate OG images (Vercel does it)
- ❌ Create internal links (automatic per laptop/blog relationships)
- ❌ Track analytics manually (GA4 does it)
- ❌ Write metadata (auto-generated from database)

### Setup Checklist (One-Time)
- [ ] Create GA4 property at analytics.google.com
- [ ] Add `NEXT_PUBLIC_GA_ID=G-XXXXXXXX` to `.env.local`
- [ ] Claim domain in Google Search Console (search.google.com)
- [ ] Submit sitemap: `https://laptick.in/sitemap.xml`
- [ ] Deploy with `npm run build && npm start` to verify build succeeds

### Success Metrics (3-Month Target)
- #1 organic ranking for "laptop recommendation india"
- 500+ monthly organic impressions
- 5-8% CTR (above average)
- 10+ blog posts published
- $200-500/month affiliate revenue

## Environment Variables
See `.env.example` — never commit `.env.local` or `.claude/settings.local.json`
