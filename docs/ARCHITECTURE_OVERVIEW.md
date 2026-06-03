# LaptopAdvisor Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ /api/recommend  │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │  RATE    │  │  FORM    │  │   QUERY      │
         │ LIMITING │  │ VALIDATION│  │ HASH (Layer 1)
         └────────┬─┘  └────────┬─┘  └──────┬───────┘
                  │             │             │
                  └─────────────┼─────────────┘
                                │ Cache HIT?
                                ├─ YES: Return cached result
                                ▼ NO
                    ┌────────────────────────────┐
                    │ SMART FILTER               │
                    ├─ Budget range             │
                    ├─ OS preference            │
                    ├─ Use-case tags            │
                    └──────────┬─────────────────┘
                               │
                               ▼
                    ┌────────────────────────────┐
                    │ FETCH CACHED EXPLANATIONS  │
                    │ (Layer 2: laptop_expls)    │
                    └──────────┬─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ALL CACHED?      SOME CACHED?      NONE CACHED?
             │                │                │
             │                │                ▼
             │                │        ┌──────────────┐
             │                │        │  CLAUDE API  │
             │                │        │ (Haiku 4.5)  │
             │                │        └────────┬─────┘
             │                │                 │
             │     ┌──────────┴──────────┐     │
             │     │                     │     │
             ▼     ▼                     ▼     ▼
        ┌─────────────────────────────────────┐
        │  CONSTRUCT RESPONSE                 │
        ├─ Rank top 3 laptops                │
        ├─ Use cached explanations           │
        ├─ Set from_cache flag               │
        └────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        │            │                │
        ▼            ▼                ▼
   ┌─────────┐  ┌──────────┐  ┌────────────────┐
   │ STORE   │  │ STORE    │  │ RETURN         │
   │ NEW     │  │ FULL     │  │ RESPONSE       │
   │ EXPL    │  │ QUERY    │  │ (200 OK)       │
   │ (if any)│  │ CACHE    │  │                │
   └─────────┘  │ (24h TTL)│  └────────────────┘
                └──────────┘
```

## Data Flow: Pre-Generation

```
┌──────────────────────────────┐
│  Admin Request               │
│  POST /api/admin/            │
│  generate-explanations       │
└──────────────────┬───────────┘
                   │ Validate admin key
                   ▼
        ┌──────────────────────┐
        │ Fetch all laptops    │
        │ (is_active=true)     │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ For each laptop ×    │
        │ each use-case:       │
        │                      │
        │ Check if exists?     │
        │ YES → skip           │
        │ NO → generate        │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ BUILD PROMPT         │
        ├─ Laptop specs        │
        ├─ Use-case context    │
        ├─ Knowledge base ref  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ CLAUDE HAIKU 4.5     │
        │ System: Expert        │
        │ advisor               │
        │ (500 token max)      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ PARSE JSON RESPONSE  │
        ├─ explanation        │
        ├─ key_strengths[]    │
        ├─ one_weakness       │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ UPSERT TO DB         │
        │ laptop_explanations  │
        │ (laptop_id, use_case)│
        └──────────┬───────────┘
                   │
            ┌──────┴──────┐
            │             │
            ▼             ▼
       SUCCESS       ERROR
         │             │
         ▼             ▼
      COUNT          COLLECT
      GENERATED      ERRORS
         │             │
         └──────┬──────┘
                │
                ▼
         Return Status
         { generated, skipped, errors }
```

## Database Schema

### Laptops Table
```sql
CREATE TABLE laptops (
  id UUID PRIMARY KEY,
  name TEXT,
  brand TEXT,
  price_inr INTEGER,
  cpu_brand TEXT,
  cpu_model TEXT,
  cpu_series TEXT,        -- U, P, H, HX, M-series
  cpu_arch TEXT,          -- x86, ARM
  gpu_type TEXT,          -- integrated, dedicated
  gpu_model TEXT,
  gpu_tgp_watts INTEGER,
  ram_gb INTEGER,
  ram_type TEXT,
  storage_gb INTEGER,
  storage_type TEXT,
  display_size NUMERIC,
  display_type TEXT,      -- IPS, OLED, Mini-LED
  display_hz INTEGER,
  display_nits INTEGER,
  display_color_gamut INTEGER,
  battery_wh INTEGER,
  weight_kg NUMERIC,
  os_support TEXT,
  best_for TEXT[],        -- ['gaming', 'programming', ...]
  pros TEXT,
  cons TEXT,
  affiliate_amazon_in TEXT,
  is_active BOOLEAN,
  last_updated TIMESTAMP,
  created_at TIMESTAMP
);
```

### Recommendation Cache Table
```sql
CREATE TABLE recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) UNIQUE,  -- SHA256 of form data
  result_json JSONB,               -- Full recommendation response
  expires_at TIMESTAMP,            -- 24h from creation
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendation_cache_expires_at 
ON recommendation_cache(expires_at);
```

### Laptop Explanations Table
```sql
CREATE TABLE laptop_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laptop_id UUID NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,          -- gaming, programming, etc
  explanation TEXT NOT NULL,       -- 3-4 sentence detailed explanation
  key_strengths TEXT[] NOT NULL,   -- Array of 3 strengths
  one_weakness TEXT NOT NULL,      -- One honest limitation
  cached_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_laptop_explanations_unique 
ON laptop_explanations(laptop_id, use_case);
```

## API Endpoints

### Recommendation Endpoint
```
POST /api/recommend
Content-Type: application/json

Request:
{
  "role": "gamer",
  "primary_use": "gaming",
  "budget_key": "₹80,000 – ₹1,20,000",
  "top_priority": "raw-performance",
  "os_preference": "Windows"
}

Response:
{
  "result": {
    "top3": [
      {
        "rank": 1,
        "laptop_id": "uuid",
        "headline": "Gaming beast, RTX 4070",
        "why_best": "The RTX 4070 @ 140W TGP...",
        "key_strengths": ["High GPU power", "Good cooling", "144Hz display"],
        "one_honest_weakness": "Fans reach 42dB",
        "buy_confidence": "High",
        "use_case_fit_score": 9
      },
      ...
    ],
    "generated_at": "2026-05-24T10:30:00Z",
    "from_cache": true
  },
  "query_hash": "abc123..."
}

Headers:
X-Cache: HIT|MISS
X-RateLimit-Remaining: 4
```

### Pre-Generation Endpoint
```
POST /api/admin/generate-explanations
Headers:
x-admin-key: YOUR_ADMIN_KEY

Request (optional):
{
  "laptop_ids": ["uuid1", "uuid2"],  -- omit for all laptops
  "use_cases": ["gaming", "programming"],  -- omit for all use-cases
  "force": true  -- regenerate even if cached
}

Response:
{
  "generated": 16,
  "skipped": 4,
  "total": 20,
  "errors": []
}
```

### Cache Management Endpoint
```
GET /api/cache
DELETE /api/cache?mode=expired|all

Headers:
x-admin-key: YOUR_ADMIN_KEY

Response:
{
  "recommendation_cache": {
    "total": 156,
    "active": 120,
    "expired": 36
  },
  "laptop_explanations": {
    "total": 480
  }
}
```

## File Structure

```
laptop-advisor/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── generate-explanations/
│   │   │       └── route.ts         ← Pre-generation endpoint
│   │   ├── cache/
│   │   │   └── route.ts             ← Cache management
│   │   ├── laptops/
│   │   │   └── route.ts             ← Fetch laptops
│   │   ├── recommend/
│   │   │   └── route.ts             ← Recommendation (MODIFIED)
│   │   └── ...
│   ├── page.tsx                     ← Homepage
│   ├── result/
│   │   └── page.tsx                 ← Results page
│   └── ...
├── lib/
│   ├── claude.ts                    ← Claude API calls
│   ├── supabase.ts                  ← Supabase client
│   ├── hash.ts                      ← Query hashing
│   ├── rateLimit.ts                 ← Rate limiting
│   └── ...
├── types/
│   ├── laptop.ts                    ← Laptop type definitions
│   └── recommendation.ts            ← Recommendation types
├── scripts/
│   ├── seed.js                      ← Initial data seeding
│   └── generate-explanations.js     ← Pre-generation script (NEW)
├── docs/
│   ├── LAPTOP_RECOMMENDATION_KNOWLEDGE_BASE.md  ← Hardware knowledge
│   ├── EXPLANATION_GENERATION.md                ← Technical guide (NEW)
│   ├── PRE_GENERATION_QUICKSTART.md             ← Quick start (NEW)
│   └── ARCHITECTURE_OVERVIEW.md                 ← This file (NEW)
├── CLAUDE.md                        ← Project instructions
└── ...
```

## Performance Characteristics

### Response Times
| Scenario | Time | Cache Header |
|----------|------|--------------|
| Query cache hit | ~10ms | `X-Cache: HIT` |
| Explanations cached | ~50ms | `X-Cache: MISS` / `from_cache: true` |
| Claude call needed | 1000-2000ms | `X-Cache: MISS` / `from_cache: false` |

### Database Performance
- `recommendation_cache` query: O(1) lookup by SHA256
- `laptop_explanations` query: O(1) lookup by (laptop_id, use_case) composite index
- Pre-filtering: ~5-10ms for 50+ laptop options

### Cost per Request (Estimated)
| Scenario | Cost (₹) |
|----------|---------|
| Query cache hit | 0.00 |
| Explanations cached | 0.00 |
| Claude Haiku call | 0.001-0.003 |
| Database only (no cache) | 0.0001 |

## Scaling Considerations

### Current Limits
- 480 pre-generated explanations (60 laptops × 8 use-cases) = ~150KB storage
- Query cache: 24-hour rolling window (~1000s of queries)
- Pre-generation time: ~10 minutes for 480 explanations

### Future Optimizations
1. **Per-priority explanations:** Currently one explanation per laptop-use-case; could add "battery-optimized" variant
2. **Vector search:** Could use pgvector for semantic laptop similarity (future, if needed)
3. **A/B testing:** Multiple explanation versions per laptop to optimize conversion
4. **Dynamic explanations:** Template system to avoid pre-generating all combos

## Security Considerations

✅ **API Key Management:**
- Claude API key: **Server-side only** (`app/api/*`)
- Service role key: **Environment only** (never exposed)
- Admin key: **Verified on admin endpoints** (required for generation/cache mgmt)
- Never `NEXT_PUBLIC_` for secrets

✅ **Rate Limiting:**
- 5 requests per IP per hour (Upstash Redis)
- Protects against recommendation spam/abuse

✅ **Cache Integrity:**
- Explanations generated deterministically from laptop specs
- No user-generated content in cache (XSS-safe)
- Query hash validation prevents cache collision

## Monitoring & Observability

### Key Metrics
1. `X-Cache` header distribution (HIT/MISS ratio)
2. `from_cache` flag in responses (should be `true` >90%)
3. Response time percentiles (p50, p95, p99)
4. Claude API call frequency (should drop significantly)
5. Database query patterns (hit/miss rates)

### Logs to Monitor
```
[/api/recommend] Query cache HIT
[/api/recommend] All explanations cached, using cached data
[/api/recommend] Claude call failed
[/api/admin/generate-explanations] Generated 480 explanations
```

---

**Last Updated:** 2026-05-24  
**Version:** 1.0 (Pre-generation system)
