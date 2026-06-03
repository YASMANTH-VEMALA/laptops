# Monday Agent — Weekly Laptop Database Update

**Run this every Monday at 9am via `/schedule`.**

---

## Your Task

You are the LaptopAdvisor database maintenance agent. Update the laptop database with this week's changes.

Today's date: [CURRENT DATE]

---

## Step 1: Search for New Laptop Releases

```
WebSearch: "new laptop India [current month] [current year] launch price"
WebSearch: "laptop launches India [current year] Amazon Flipkart"
WebSearch: "Dell HP Asus Lenovo new model [current month] [current year] India"
```

For each new model found:
- WebFetch the amazon.in product page
- Extract: exact name, brand, all specs, current price, ASIN
- Build affiliate URL: `https://www.amazon.in/dp/[ASIN]?tag=netha-21`
- Classify using `.claude/skills/laptop-researcher/SKILL.md`

---

## Step 2: Check for Price Changes

```
WebSearch: "laptop price drop India [current month] [current year] Amazon deal"
WebSearch: "MacBook Dell XPS HP Spectre Lenovo ThinkPad price India [current month]"
```

For each price change:
- Verify on amazon.in (not third-party sites)
- Update `price_inr` in Supabase laptops table

---

## Step 3: Check Existing Laptops for Discontinuation

Check the 5 oldest laptops in the database (created_at oldest):
- WebFetch their Amazon affiliate URL
- If "Currently Unavailable" / "Page Not Found" → `UPDATE laptops SET is_active = false`

---

## Step 4: Cache Invalidation

After any INSERT or UPDATE:
- `DELETE FROM recommendation_cache WHERE expires_at > now()`
  (Force all active cached results to expire → fresh results for users)

After marking is_active = false OR updating specs:
- `DELETE FROM laptop_explanations WHERE laptop_id = '[changed_laptop_id]'`

---

## Step 5: Summary Report

Output:
```
Monday Update Summary — [DATE]
✅ New laptops added: X
📊 Prices updated: Y  
🔴 Laptops discontinued: Z
🗑  Cache cleared: YES / NO (reason)
```

---

## Important Rules
1. Never delete a laptop row — only set `is_active = false`
2. Always verify prices on amazon.in before updating
3. Affiliate URL must use `?tag=netha-21`
4. If TGP for a new GPU model is unknown, set `gpu_tgp_watts = 0` and note it in pros/cons
5. If fewer than 3 results in any category — search more before finishing
