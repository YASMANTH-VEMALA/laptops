# Clear All Data from Supabase Database

This guide will help you delete ALL data and start fresh.

## ⚠️ WARNING

This operation **DELETES ALL DATA** from the database:
- ❌ All 28 laptops
- ❌ All recommendation cache
- ❌ All explanations
- ❌ All blog posts
- ❌ All knowledge chunks

**This action is PERMANENT and cannot be undone!**

---

## Method 1: Via Supabase Dashboard (Easiest)

### Step 1: Open Supabase
Go to: https://app.supabase.com → Your Project

### Step 2: Go to SQL Editor
Click: **SQL Editor** (left sidebar)

### Step 3: Delete All Data

Paste this into the SQL editor:

```sql
DELETE FROM laptop_explanations;
DELETE FROM recommendation_cache;
DELETE FROM knowledge_chunks;
DELETE FROM laptops;
DELETE FROM blog_posts;
```

### Step 4: Run the Queries

Click the **Run** button for each DELETE statement, or paste all and run together.

**Expected result:** `Executed successfully` with `0 rows affected` for each

### Step 5: Verify

Paste this verification query:

```sql
SELECT COUNT(*) as laptop_count FROM laptops;
SELECT COUNT(*) as explanation_count FROM laptop_explanations;
SELECT COUNT(*) as cache_count FROM recommendation_cache;
```

**Expected result:** All counts should be `0`

---

## Method 2: Using the Script

You can also use the provided SQL script:

```bash
# The script is at: scripts/clear-all-data.sql
# Copy its contents and paste into Supabase SQL Editor
```

---

## After Clearing Data

### Option A: Seed with Images Immediately

Now run the seed file with images:

```
In Supabase SQL Editor:
1. Copy entire contents of: db-seed-31-laptops-with-images.sql
2. Paste into editor
3. Click Run
4. Expected: 27 rows inserted with images
```

Then refresh: http://localhost:3000/laptops

You'll see 27 laptops with real product images!

### Option B: Fetch Images Automatically

If you cleared the database, run this script:

```bash
npm run dev
# In another terminal:
./scripts/update-all-laptop-images.sh
```

This will:
1. Create fresh 28 laptops
2. Fetch real images from Amazon.in
3. Display images on your site

---

## Step-by-Step to Fresh Start

**If you want a completely fresh start with images:**

1. ✅ Clear all data (this guide)
2. ✅ Seed with image-enabled data:
   ```sql
   -- Paste db-seed-31-laptops-with-images.sql
   ```
3. ✅ Refresh browser
4. ✅ See 27 laptops with real images!

---

## Troubleshooting

### "Cannot delete from X because it's referenced"

**Solution:** Delete in this order:
```sql
DELETE FROM laptop_explanations;
DELETE FROM recommendation_cache;
DELETE FROM knowledge_chunks;
DELETE FROM laptops;
DELETE FROM blog_posts;
```

The order matters because of foreign key constraints.

### "Still seeing old data"

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Chrome) or `Cmd+Shift+R` (Mac)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Accidentally deleted something important?

**Option 1:** Use Supabase backup/recovery (if available in your plan)

**Option 2:** Re-seed with the SQL files:
```sql
-- Run: db-seed-31-laptops-with-images.sql
```

---

## What to Do Next

Once database is clear, you have options:

### Option 1: Seed with Images (Recommended)
```bash
# Use: db-seed-31-laptops-with-images.sql
# Result: 27 laptops with images ready to show
```

### Option 2: Fresh Crawl
```bash
# Use: scripts/update-all-laptop-images.sh
# Result: Fetches images from Rainforest automatically
```

### Option 3: Manual Entry
Start fresh with a clean database and add laptops one by one.

---

## Confirm You Want to Delete

Before proceeding, answer these questions:

- ✅ Have you backed up any important data?
- ✅ Do you have the seed files ready?
- ✅ Are you ready to start fresh?

If all yes, proceed with deletion!

---

**Ready?** Open Supabase and run the delete queries! 🗑️
