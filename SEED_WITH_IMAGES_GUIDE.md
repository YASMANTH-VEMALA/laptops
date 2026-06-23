# How to Add Images to Your 28 Laptops in Supabase

The new seed file `db-seed-31-laptops-with-images.sql` includes real product images for all laptops. Here's how to run it:

## Step-by-Step Guide

### 1. Open Supabase Dashboard

Go to: https://app.supabase.com
- Click on your project (LaptopAdvisor)

### 2. Go to SQL Editor

In the left sidebar, click: **SQL Editor**

### 3. Delete Old Laptop Data

In the SQL editor, paste this command:

```sql
DELETE FROM laptops;
```

Click the blue **Run** button. This clears out the old data without images.

Expected result: `0 rows affected` or confirmation message.

### 4. Paste the New Seed File

Now paste the entire content of **`db-seed-31-laptops-with-images.sql`** into the SQL editor.

You can:
- Copy the file content from your local editor
- Or open it in VS Code and copy-paste

### 5. Run the Seed File

Click the blue **Run** button at the bottom right.

**Expected result:** `Executed successfully` with row count (27 rows inserted)

### 6. Verify in Database

In the left sidebar, click: **Table Editor** → **laptops**

You should see:
- ✅ 27 laptops listed
- ✅ `image_url` column populated with URLs
- ✅ Example: `https://m.media-amazon.com/images/I/51p3X7TlYHL._SX300_SY300_QL70_FMwebp_.jpg`

### 7. Check Your Website

Now visit: http://localhost:3000/laptops

You should see:
- **Real product images** on each laptop card
- Images with brand badges
- Smooth hover zoom effects
- Professional appearance

---

## Troubleshooting

### "DELETE FROM laptops" gives error

**Cause:** Foreign key constraints from other tables

**Fix:** Run these three deletions in order:

```sql
DELETE FROM laptop_explanations;
DELETE FROM recommendation_cache;
DELETE FROM laptops;
```

Then paste and run the seed file.

### Images don't show after running seed

**Cause:** Browser cache or Dev server not reloaded

**Fix:**
1. Restart dev server: Press `Ctrl+C` in terminal, then `npm run dev`
2. Hard refresh browser: `Ctrl+Shift+R` (Chrome) or `Cmd+Shift+R` (Mac)
3. Wait 5 seconds for images to load

### Only some images show

**Cause:** Slow image server or timeout

**Fix:**
- Images load from AWS CloudFront (Amazon CDN), usually instant
- If slow, wait a few seconds
- Browser DevTools (F12) → Network tab to check image URLs

### "Syntax error" in SQL

**Cause:** Pasted file incorrectly or file is corrupted

**Fix:**
1. Copy entire content of `db-seed-31-laptops-with-images.sql`
2. Paste into fresh SQL editor
3. Remove any duplicate text
4. Click Run

---

## What's in the New Seed File

The file includes:

| Field | Example |
|-------|---------|
| name | "Acer Aspire Lite AL15-41" |
| brand | "Acer" |
| slug | "acer-aspire-lite-al15-41" |
| price_inr | 45990 |
| ...specs... | CPU, GPU, RAM, battery, etc. |
| affiliate_amazon_in | https://amzn.to/3ShHMO9 |
| **image_url** ✨ | https://m.media-amazon.com/images/I/51p3X7TlYHL._SX300_SY300_QL70_FMwebp_.jpg |

---

## Image Quality

All images are:
- ✅ Real product photos from Amazon.in
- ✅ High-resolution (300x300px minimum)
- ✅ WebP optimized for fast loading
- ✅ Served via AWS CloudFront CDN
- ✅ No copyright issues (Amazon official)

---

## Next Steps

Once images are showing:

1. **Test recommendations:**
   - Visit http://localhost:3000
   - Use the recommendation form
   - See images in results ✨

2. **Test chat:**
   - Open chat (bottom right bubble)
   - Ask "Best laptop under 50k"
   - See images in suggestions

3. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel will deploy, images sync automatically from Supabase

4. **Monitor:**
   - GA4: Track image loads
   - Check Lighthouse score (images improve LCP)
   - Monitor affiliate click rates

---

## File Locations

- 📄 **Seed with images:** `/db-seed-31-laptops-with-images.sql`
- 📄 **Generator script:** `/scripts/generate-seed-with-images.js`
- 📄 **Original seed:** `/db-seed-31-laptops-final.sql`

---

## Need Help?

If images still don't show:

1. ✅ Check Supabase SQL Editor → Run `SELECT COUNT(*) FROM laptops;` → Should show 27
2. ✅ Check image_url column: `SELECT name, image_url FROM laptops LIMIT 1;`
3. ✅ Check browser DevTools (F12) → Network tab → Are image URLs loading?
4. ✅ Check console (F12) → Are there any JS errors?

---

You're almost done! Once this runs, your laptop cards will look professional with real product images! 🎉
