# Cleanup Guide: Removing Deprecated Code

After verifying the new SerpAPI system is working, you can safely remove the following files and tables. **Do not delete these before testing.**

## Files to Delete

These files are no longer used and can be deleted:

### `lib/claude.ts`
**Why:** Per-request Claude Haiku ranking is replaced by deterministic `lib/rank.ts`

Imports:
- `lib/claude.ts` — imported by old `/api/recommend`

References in codebase:
```bash
grep -r "from.*lib/claude" . --include="*.ts"
grep -r "from.*lib/claude" . --include="*.tsx"
```

### `lib/explanation-generator.ts`
**Why:** On-demand explanation generation replaced by one-time blurbs in `lib/blurb.ts`

The old system called this for every recommendation request. Now we use:
- `products.why_text` (generated once per laptop, cached forever)
- Fallback template if GEMINI_API_KEY not set

### `lib/gemini.ts`
**Why:** Old Gemini chat system replaced

**Old logic:**
```typescript
// Old way: Gemini used for ranking + chat
export async function generateChatResponse(messages, laptopContext)
```

**New logic:**
- Chat logic moved inline to `app/api/chat/route.ts`
- Gemini is still used (for conversation quality), but only for chat, not ranking

### `lib/normalize-rainforest.ts`
**Why:** Rainforest API completely removed

Rainforest was used for real-time product fetching. Replaced by SerpAPI.

### Database Tables (Deprecated)

These Supabase tables are no longer used and can be deleted:

#### `recommendation_cache`
**Old purpose:** 24-hour TTL cache of full recommendation results

**Replaced by:** `search_cache` (permanent, on migration)

```sql
DROP TABLE IF EXISTS recommendation_cache;
```

#### `laptop_explanations`
**Old purpose:** Per-laptop, per-use-case explanation cache

**Replaced by:** `products.why_text` (one-time, permanent)

```sql
DROP TABLE IF EXISTS laptop_explanations;
```

---

## Optional: Full Cleanup Script

Run this after verifying the new system is stable (recommend: after 1 week in production):

```bash
#!/bin/bash

# Delete deprecated lib files
rm -f lib/claude.ts
rm -f lib/explanation-generator.ts
rm -f lib/gemini.ts (CAREFUL: check if imported elsewhere)
rm -f lib/normalize-rainforest.ts

# Remove old API routes (if any)
# (None exist in current codebase, these were replaced/refactored)

# In Supabase SQL Editor, run:
# DROP TABLE IF EXISTS recommendation_cache;
# DROP TABLE IF EXISTS laptop_explanations;
```

---

## Before Cleanup: Verification Checklist

✅ **Run new system for at least 1 week**
- Monitor `search_log` for successful searches
- Check cache hit ratio improves over time
- Verify cost is actually lower

✅ **Check for remaining references**
```bash
grep -r "claude" . --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
grep -r "rainforest" . --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
grep -r "laptop_explanations" . --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
grep -r "recommendation_cache" . --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

Should return: **no results** (except in comments or migration files)

✅ **Backup old tables (optional)**

If you want to keep historical data before dropping:

```sql
-- Create backups
CREATE TABLE recommendation_cache_backup AS SELECT * FROM recommendation_cache;
CREATE TABLE laptop_explanations_backup AS SELECT * FROM laptop_explanations;

-- Then drop originals
DROP TABLE IF EXISTS recommendation_cache;
DROP TABLE IF EXISTS laptop_explanations;
```

---

## Environment Variables to Remove

Once old code is gone, you can remove these from `.env.local` and CI/CD:

```
# No longer used:
ANTHROPIC_API_KEY=           # Old Claude API
RAINFOREST_API_KEY=          # Old product fetching
RAINFOREST_CATEGORY_ID=      # Old product filtering
```

Keep:
```
SERPAPI_KEY=                 # SerpAPI (new, needed)
GEMINI_API_KEY=              # Still used (blurbs + chat)
SUPABASE_*=                  # Always needed
UPSTASH_*=                   # Always needed
ADMIN_KEY=                   # Admin endpoints
```

---

## Post-Cleanup: Update Documentation

Update docs to remove references to:
- Claude Haiku ranking
- Rainforest API
- Per-request AI calls
- 24-hour recommendation cache

Add to CLAUDE.md:
```markdown
## AI Usage (After SerpAPI Refactor)

### No longer used:
- Claude Haiku for ranking ❌
- Gemini for live chat product discovery ❌
- Rainforest API for real-time product data ❌

### Current usage:
- **SerpAPI:** Product discovery (₹0.005 per unique search)
- **Gemini (optional):** One-time blurb generation (₹0.0001 per laptop)
- **No AI on cache hits** — Deterministic ranking only
```

---

## Rollback Plan (If Issues Found)

If the new system has problems, you can keep both systems running in parallel temporarily:

1. Keep old `lib/claude.ts` and `lib/gemini.ts` files
2. Add feature flag: `USE_NEW_SEARCH_PIPELINE=true` (env var)
3. Conditionally route to old vs new system
4. Gradually migrate traffic

Example:
```typescript
// app/api/recommend/route.ts
if (process.env.USE_NEW_SEARCH_PIPELINE === 'false') {
  // Use old Claude ranking
  const ranking = await getRanking(form, laptopsForClaude, budgetRange.label)
  // ...
} else {
  // Use new SerpAPI pipeline
  const result = await searchPipeline(rawQuery, sessionId, ip)
  // ...
}
```

---

## Timeline Recommendation

| Timeframe | Action |
|-----------|--------|
| Week 1 | Deploy new system, monitor search_log, test cache hits |
| Week 2 | Verify cost savings, check hit ratio climbs |
| Week 3+ | If stable, delete deprecated files |
| Month 2+ | Drop old database tables |

---

**Do not rush cleanup.** The old files don't hurt staying in the codebase for a while. Better to be safe than sorry.
