# /clear-cache

Purge stale entries from the recommendation cache.

## Steps
1. Check how many rows are in `recommendation_cache`
2. DELETE all rows where `expires_at < now()` (expired entries)
3. Optionally: if run with `--all` flag, DELETE all rows (force full refresh)
4. Report: X expired entries removed, Y active entries remain
5. Check `laptop_explanations` for any orphaned rows (laptop_id not in laptops table) → DELETE those

## When to Use
- After running /update-db (prices/specs changed → cached results are stale)
- If recommendations seem outdated
- Weekly maintenance before the Monday agent runs
