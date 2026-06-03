# /update-db

Manually trigger the Monday agent logic to update the laptop database with the latest information.

## Steps
1. Read the current date to build accurate search queries
2. WebSearch: `"new laptop releases India [current month year]"`
3. WebSearch: `"laptop price drop India [current month year] Amazon"`
4. WebSearch: `"laptop discontinued [current year] India"`
5. For each discovery:
   - **New model**: WebFetch the amazon.in product page → extract all specs → classify → INSERT into `laptops` table
   - **Price change**: UPDATE `price_inr` in Supabase
   - **Spec update**: UPDATE relevant fields in Supabase
   - **Discontinued**: SET `is_active = false`
6. After any change to `laptops`:
   - DELETE all rows from `recommendation_cache` (rankings may have changed)
   - For spec/discontinued changes: DELETE from `laptop_explanations` WHERE laptop_id = [changed_id]
7. Report a summary: X new laptops added, Y prices updated, Z discontinued

## Affiliate URL Construction
When adding a new laptop, find the ASIN from the amazon.in URL:
`https://www.amazon.in/dp/[ASIN]/` → affiliate URL: `https://www.amazon.in/dp/[ASIN]?tag=netha-21`

## Classification Guide
See `.claude/skills/laptop-researcher/SKILL.md` for how to classify CPU series, GPU TGP, display types.
