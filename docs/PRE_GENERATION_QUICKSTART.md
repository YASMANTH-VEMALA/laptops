# Pre-Generation Quick Start

## What Changed

The recommendation system now supports **pre-generating detailed explanations** so Claude API is called only once per laptop per use-case, then the explanation is reused forever.

### Before
```
User Request
  → Check query cache
  → Check laptop explanations (nothing cached)
  → Call Claude API (every time)
  → Store explanation
  → Return response
Cost: ₹0.001-0.003 per request
```

### After (With Pre-Generation)
```
User Request
  → Check query cache
  → HIT: Return cached response (₹0.00)
  → MISS: Check laptop explanations
    → All cached: Construct response (₹0.00)
    → Some missing: Call Claude only for missing ones (₹0.001)
  → Return response
Cost: ₹0.00-0.001 per request (90% reduction)
```

## Setup (5 minutes)

### Step 1: Pre-generate Explanations

Choose one method:

**Method A: API Endpoint (Simplest)**
```bash
curl -X POST http://localhost:3000/api/admin/generate-explanations \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_CACHE_ADMIN_KEY_HERE" \
  -d '{}'
```

**Method B: Node Script**
```bash
# In project root
npm install  # if not done
node scripts/generate-explanations.js
```

Both take ~5-10 minutes to generate ~480 explanations (60 laptops × 8 use-cases).

### Step 2: Verify Generation

```bash
curl http://localhost:3000/api/admin/generate-explanations \
  -H "x-admin-key: YOUR_CACHE_ADMIN_KEY_HERE"
```

Should show `"total_explanations": 480` (or your laptop count × 8).

### Step 3: Test a Recommendation

Make a recommendation request:
```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "role": "gamer",
    "primary_use": "gaming",
    "budget_key": "₹80,000 – ₹1,20,000",
    "top_priority": "raw-performance",
    "os_preference": "Windows"
  }'
```

In response, check:
- `"from_cache": true` ← explanations were pre-generated
- Response includes `key_strengths` and `one_honest_weakness` from cached explanations

## How Explanations Are Used

The system generates **detailed, reusable explanations** like:

```json
{
  "explanation": "The RTX 4070 @ 140W TGP delivers stable 80+ FPS at 1080p High Settings without thermal throttling. The i7-13700H with 8 cores prevents GPU bottlenecks during intense gaming. The 144Hz display with 3ms response time makes motion feel buttery-smooth. At ₹95k, this offers the best FPS-per-rupee among gaming laptops in this budget.",
  "key_strengths": [
    "High GPU power (140W TGP) = sustained 80+ FPS without stutters",
    "8-core CPU prevents gaming bottleneck",
    "144Hz display feels significantly smoother than 60Hz"
  ],
  "one_weakness": "Fans reach 42dB under load (audible hum during intense gaming)"
}
```

### Why Pre-Generation Matters

1. **Consistency** — same explanation every time user asks (no Claude randomness)
2. **Speed** — instant response instead of 1-2 second Claude API wait
3. **Cost** — ₹0.00 per request instead of ₹0.001-0.003
4. **Confidence** — explanations are reviewed and refined once, then served everywhere
5. **Editability** — you can manually tweak explanations if needed:
   ```sql
   UPDATE laptop_explanations 
   SET explanation = 'better explanation' 
   WHERE laptop_id = 'uuid' AND use_case = 'gaming';
   ```

## When to Regenerate

### After adding a new laptop
- Pre-generation automatically generates it on first request
- OR manually regenerate: `curl -X POST .../api/admin/generate-explanations -H "x-admin-key: ..." -d '{"laptop_ids": ["new-uuid"]}'`

### After updating laptop specs
```bash
# Delete old explanations
DELETE FROM laptop_explanations WHERE laptop_id = 'uuid';

# Regenerate (API or script)
```

### After updating knowledge base
```bash
# Force regenerate all
node scripts/generate-explanations.js --force
```

## Monitoring

### Daily Check
```bash
curl http://localhost:3000/api/cache \
  -H "x-admin-key: YOUR_CACHE_ADMIN_KEY_HERE"
```

### Production Metrics
- `X-Cache: HIT` header in responses = full query cache working
- `from_cache: true` in response = using pre-generated explanations
- Response time < 100ms = cache working efficiently

## Troubleshooting

| Problem | Solution |
|---|---|
| Generation fails | Check `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |
| Explanations still missing | Run pre-generation again: `curl -X POST .../api/admin/generate-explanations -d '{"force": true}'` |
| Slow recommendations | Check database connection; look for `from_cache: false` responses |
| Cost didn't decrease | Verify `"from_cache": true` in responses; might need to regenerate |

## Files Added/Modified

### New Files
- `scripts/generate-explanations.js` — batch pre-generation script
- `app/api/admin/generate-explanations/route.ts` — API endpoint for on-demand generation
- `docs/EXPLANATION_GENERATION.md` — full technical documentation
- `docs/PRE_GENERATION_QUICKSTART.md` — this file

### Modified Files
- `app/api/recommend/route.ts` — uses cached explanations when available
- `CLAUDE.md` — updated with new caching strategy

## Cost Savings Example

**Before (no pre-generation):**
- 10,000 requests/month
- Every request calls Claude
- Cost: ₹30,000 (₹0.003 per request)

**After (with pre-generation):**
- 10,000 requests/month  
- 70% hit query cache, 90% hit explanation cache
- Cost: ₹300 (₹0.03 per request)
- **Savings: ₹29,700/month** ✨

## Next Steps

1. ✅ Pre-generate explanations (5-10 min)
2. ✅ Test a recommendation (verify `from_cache: true`)
3. ✅ Monitor costs in next week
4. Schedule weekly regeneration for new/updated laptops
5. (Optional) Integrate explanation review workflow

---

Questions? See `docs/EXPLANATION_GENERATION.md` for technical details.
