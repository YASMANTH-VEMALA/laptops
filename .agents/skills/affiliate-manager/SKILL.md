# Skill: Affiliate Manager

Use this skill when managing, checking, or updating Amazon affiliate links.

## Affiliate Account
- Amazon Associates India
- Store / Tracking ID: `netha-21`
- URL format: `https://www.amazon.in/dp/[ASIN]?tag=netha-21`

## Finding ASINs
The ASIN is the 10-character product ID in the Amazon URL:
- `amazon.in/dp/B0CHX3TKDG/` → ASIN is `B0CHX3TKDG`
- `amazon.in/[product-name]/dp/B0CHX3TKDG?` → ASIN is `B0CHX3TKDG`

## Building Affiliate URLs
```
Base: https://www.amazon.in/dp/[ASIN]
Tag:  ?tag=netha-21
Full: https://www.amazon.in/dp/B0CHX3TKDG?tag=netha-21
```

## Checking for Broken Links
When checking affiliate links (Monday agent or /clear-cache):
1. WebFetch the affiliate URL
2. If response contains "Page Not Found" or redirects to homepage → link is broken
3. If broken: search amazon.in for the laptop model → find new ASIN → UPDATE in Supabase
4. If laptop is no longer sold on Amazon India → SET is_active = false in laptops table

## Price Extraction from Amazon Pages
When WebFetching an Amazon product page, look for:
- Current selling price (may differ from original listing)
- "Deal" or "Sale" price sections
- "Sold by" (prefer Amazon.in direct over third-party sellers)
- Check if "Currently unavailable" → consider flagging as discontinued

## Legal Compliance (Amazon Associates TOS)
Every page with affiliate links must include:
"As an Amazon Associate, we earn from qualifying purchases."
This disclosure must be:
- Visible on the page (not just in footer in tiny text)
- Present before or near the first affiliate link
- In the site footer on all pages

## UTM Tracking (Optional Enhancement)
For tracking which page drives the most clicks, append UTM params:
`?tag=netha-21&utm_source=laptopform&utm_medium=recommendation&utm_campaign=[use_case]`
