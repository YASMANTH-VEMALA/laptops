# Laptop Explanation Pre-Generation Guide

## Overview

The laptop recommendation system now supports **pre-generating** detailed explanations for each laptop across all use-cases. This eliminates the need to call Claude API for every recommendation query, significantly reducing costs and improving response times.

## How It Works

### Three Layers of Caching

1. **Full Query Cache** (`recommendation_cache`)
   - Caches entire recommendation responses for 24 hours
   - Key: SHA256 hash of form inputs (role, use-case, budget, priority, OS)
   - Expires after 24 hours

2. **Per-Laptop Explanations** (`laptop_explanations`)
   - Permanent cache of laptop explanations per use-case
   - Never expires (deleted only when laptop specs change)
   - Format: `{ laptop_id, use_case, explanation, key_strengths[], one_weakness }`

3. **Real-Time Fallback**
   - If explanations are missing, Claude API generates them on-demand
   - New explanations automatically stored in `laptop_explanations`

### Recommendation Flow

```
User Request
    ↓
[Layer 1] Check full query cache
    ├─ HIT → Return cached result (X-Cache: HIT)
    └─ MISS → Continue to Layer 2
    ↓
[Layer 2] Check per-laptop explanations
    ├─ All cached → Construct response from cache (from_cache: true)
    └─ Some missing → Call Claude (from_cache: false)
    ↓
[Store] Save new explanations to laptop_explanations
[Cache] Save full query to recommendation_cache (24h TTL)
    ↓
Return Response
```

## Pre-Generating Explanations

### Option 1: API Endpoint (Recommended)

**Endpoint:** `POST /api/admin/generate-explanations`  
**Authentication:** `x-admin-key` header

#### Generate for all laptops and use-cases:
```bash
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{}'
```

#### Generate for specific laptops:
```bash
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "laptop_ids": ["uuid-1", "uuid-2"],
    "use_cases": ["gaming", "programming"]
  }'
```

#### Force regenerate (skip existing cache):
```bash
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "force": true
  }'
```

#### Check generation status:
```bash
curl http://localhost:3000/api/admin/generate-explanations \
  -H "x-admin-key: your-admin-key"
```

**Response:**
```json
{
  "generated": 42,
  "skipped": 15,
  "total": 57,
  "errors": [
    {
      "laptop_id": "uuid",
      "use_case": "gaming",
      "error": "reason"
    }
  ]
}
```

### Option 2: Node.js Script

**File:** `scripts/generate-explanations.js`

```bash
# Install dependencies (if not already done)
npm install

# Generate all explanations
node scripts/generate-explanations.js

# Force regenerate (skip existing cache)
node scripts/generate-explanations.js --force
```

**Features:**
- Batch processes all laptops and use-cases
- Automatically skips already-cached explanations
- Rate-limited to avoid API throttling (1200ms between requests)
- Progress indicators with detailed logging
- Error tracking and reporting

**Environment variables required:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `ANTHROPIC_API_KEY` — Claude API key

## Available Use-Cases

The system pre-generates explanations for these use-cases:

| Use-Case | Focus |
|---|---|
| `gaming` | GPU TGP, display Hz, thermal design, RAM |
| `programming` | CPU cores, RAM, SSD speed, keyboard |
| `video-editing` | GPU VRAM, CPU cores, RAM, display color accuracy |
| `design` | Display color accuracy, GPU acceleration, RAM |
| `ai-ml` | GPU VRAM (hard constraint), system RAM, CUDA cores |
| `general` | Battery life, weight, CPU efficiency, display brightness |
| `business` | Build quality, keyboard, display brightness, webcam |
| `content` | Balanced GPU/CPU, RAM, display, battery |

## Cache Invalidation Strategy

### When to Clear Cache

**Delete specific laptop's explanations:**
```sql
DELETE FROM laptop_explanations 
WHERE laptop_id = 'uuid';
```

**Regenerate for a laptop with updated specs:**
```bash
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "laptop_ids": ["uuid"],
    "force": true
  }'
```

**Clear all recommendation caches (if specs change globally):**
```bash
curl -X DELETE http://localhost:3000/api/cache?mode=all \
  -H "x-admin-key: your-admin-key"
```

## Cost Savings

With pre-generated explanations:

- **Warm cache hit (all explanations cached):** ₹0.00 (no Claude API call)
- **Cold cache hit (explanations missing):** ~₹0.001 per request (Claude Haiku rate)
- **Full query cache hit:** ₹0.00 (no database query, no Claude call)

**Estimated costs:**
- 1,000 requests/month with 80% warm cache: ~₹0.80
- 10,000 requests/month with 90% warm cache: ~₹10.00
- One laptop recommendation pays for 3-6 months of API costs

## Monitoring

### Check Explanation Cache Status

```bash
curl http://localhost:3000/api/cache \
  -H "x-admin-key: your-admin-key"
```

**Response:**
```json
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

### Expected Cache Size

With 60 laptops × 8 use-cases = **480 explanations**

Each explanation is ~300 bytes → ~150KB total storage

## Best Practices

1. **Pre-generate before launch:** Run the generation script before deploying to production
2. **Regenerate weekly:** Schedule a weekly regeneration to catch new laptops or price changes
3. **Monitor hits:** Check cache headers (`X-Cache: HIT|MISS`) in production logs
4. **Handle failures gracefully:** If generation fails, the system falls back to Claude API
5. **Keep knowledge base updated:** The explanations pull from `docs/LAPTOP_RECOMMENDATION_KNOWLEDGE_BASE.md`

## Troubleshooting

### Generation stuck or slow

- Check `ANTHROPIC_API_KEY` is valid
- Verify `SUPABASE_SERVICE_ROLE_KEY` permissions
- Reduce batch size in script if rate-limited

### Explanations are generic

- Verify knowledge base at `docs/LAPTOP_RECOMMENDATION_KNOWLEDGE_BASE.md` is comprehensive
- Check Claude model is `claude-haiku-4-5`
- Review generated explanations and update if needed

### Cache not being used

- Verify `laptop_explanations` table has data: `SELECT COUNT(*) FROM laptop_explanations`
- Check API response header `X-Cache: HIT` to confirm cache hit
- Verify query hash matches between requests

## Database Schema

```sql
-- Laptop Explanations Table
CREATE TABLE laptop_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laptop_id UUID NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  explanation TEXT NOT NULL,
  key_strengths TEXT[] NOT NULL,
  one_weakness TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(laptop_id, use_case)
);

-- Indexes
CREATE INDEX idx_laptop_explanations_laptop_id ON laptop_explanations(laptop_id);
CREATE INDEX idx_laptop_explanations_use_case ON laptop_explanations(use_case);
CREATE INDEX idx_laptop_explanations_composite ON laptop_explanations(laptop_id, use_case);
```

## Next Steps

1. **Run pre-generation:** Generate all explanations using the API or script
2. **Verify cache:** Check that explanations are stored in database
3. **Test recommendations:** Make recommendation requests and verify `from_cache: true` in responses
4. **Monitor costs:** Track API usage and confirm cost savings
5. **Schedule updates:** Set up weekly regeneration for new/updated laptops
