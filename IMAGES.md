# Laptop Images Guide

The 28 existing laptops in your database need images. This guide shows how to fetch and add real product images from Amazon.

## Quick Start (Recommended)

### Option 1: Fetch via API (Simplest)

**Start the dev server:**
```bash
npm run dev
```

**In another terminal, fetch images:**
```bash
curl -X POST http://localhost:3000/api/admin/fetch-images \
  -H "x-admin-key: $CACHE_ADMIN_KEY" \
  -H "Content-Type: application/json"
```

**Expected output:**
```json
{
  "success": true,
  "timestamp": "2026-06-22T10:30:00Z",
  "duration_ms": 45000,
  "stats": {
    "total_laptops": 28,
    "without_images": 28,
    "found": 24,
    "updated": 24,
    "errors": 0
  },
  "details": [
    {
      "id": "uuid-1",
      "name": "HP Pavilion 15",
      "status": "updated",
      "image_url": "https://m.media-amazon.com/images/..."
    }
  ]
}
```

---

## How It Works

1. **Fetches all laptops** without images from your database
2. **Searches Rainforest API** for each laptop: `{Brand} {Model}`
3. **Extracts image URL** from the first Amazon product result
4. **Updates database** with the real product image
5. **Rate limits** to 1.5s between queries (respects API limits)

### Image Source

All images come from **real Amazon.in product pages** via Rainforest API. This ensures:
- ✅ Real product images (not AI-generated)
- ✅ Consistent quality and branding
- ✅ No copyright issues (official product images)
- ✅ Professional appearance on your site

---

## What Happens on the UI

Once images are added, they appear automatically:

### On the "All Laptops" page:
- Each card shows the real laptop product image
- Smooth zoom effect on hover
- Falls back to animated laptop illustration if image fails to load

### On recommendation results:
- Top 3 recommendations display product images
- Images load fast (served via Next.js Image optimization)

### On individual laptop pages:
- Large product image at the top
- Next.js Image component optimizes for all devices

---

## Troubleshooting

### "x-admin-key" error
**Cause:** CACHE_ADMIN_KEY not set in `.env.local`
**Fix:**
```bash
# Check if .env.local has CACHE_ADMIN_KEY
grep CACHE_ADMIN_KEY .env.local

# If missing, generate and add it
openssl rand -hex 32  # Copy the output
# Add to .env.local: CACHE_ADMIN_KEY=<paste-here>

# Then set env var and try again
export CACHE_ADMIN_KEY=<value-from-.env.local>
curl -X POST http://localhost:3000/api/admin/fetch-images \
  -H "x-admin-key: $CACHE_ADMIN_KEY"
```

### "RAINFOREST_API_KEY not configured"
**Cause:** Rainforest API key missing
**Fix:** Add to `.env.local`:
```
RAINFOREST_API_KEY=<your-key>
```

### API returns 502/504
**Cause:** Rainforest API down or quota exceeded
**Fix:**
- Check Rainforest dashboard for usage
- Wait a few minutes and retry
- Try searching one laptop manually: `/api/rainforest/search?q=HP+laptop`

### Some images not found (skipped)
**Cause:** Rainforest couldn't find that exact laptop
**Expected:** ~85% success rate (24/28 typically)
**Why:** Some models are discontinued or have different names online

---

## Advanced: Local Script (Alternative)

If you prefer running locally without the API:

```bash
# Requires ts-node (install if needed)
npm install --save-dev ts-node @types/node

# Run the script
NEXT_PUBLIC_SUPABASE_URL=<url> \
SUPABASE_SERVICE_ROLE_KEY=<key> \
RAINFOREST_API_KEY=<key> \
npx ts-node scripts/fetch-laptop-images.ts
```

This does the same thing as the API but without needing to start the dev server.

---

## Production Deployment

After images are added locally:

1. **Verify images look good** on http://localhost:3000/laptops
2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "feat: add product images to 28 laptops"
   git push origin main
   ```
3. **Images auto-sync** from database to production

No additional deployment steps needed — images are already in Supabase!

---

## Next Steps

Once images are added:

1. ✅ Visit http://localhost:3000/laptops to see them
2. ✅ Test chat recommendations with `npm run dev`
3. ✅ Deploy to Vercel
4. ✅ Monitor how users respond to product images

### Monitoring

Track image performance:
- GA4 event: `image_loaded` (if you add tracking)
- Lighthouse score improvement (images = better LCP)
- Click-through rate on affiliate links (better visuals = higher CTR)

---

## Future Iterations

Once images are working:

1. **Add image alt-text generation** (use Claude to generate SEO-friendly alt text)
2. **Optimize image sizes** (use CloudFlare or Vercel Image Optimization)
3. **Add product gallery** (multiple images per laptop)
4. **Social media cards** (custom OG images per laptop)

These are all optional — the system works great with just the primary image!
