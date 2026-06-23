# LaptopAdvisor Database & Data Audit

This document provides a technical audit of the data architecture, sourcing pipelines, affiliate structures, scheduling mechanisms, and future scaling requirements for the **LaptopAdvisor** platform.

---

## 1. Laptop Database Statistics & Spec Fields

### Exact Count of Laptops
The database holds exactly **61 laptop rows** in total, categorized by their availability status:
- **Active Laptops (`is_active = true`):** 33 laptops
- **Discontinued/Unavailable Laptops (`is_active = false`):** 28 laptops

### Complete List of Spec Fields Stored (Per Laptop)
Every laptop record stores the following 31 columns, representing hardware specifications and system flags:

| Column Name | Data Type | Constraint / Validation | Purpose |
|---|---|---|---|
| `id` | `uuid` | Primary Key, default `gen_random_uuid()` | Unique identifier |
| `name` | `text` | Not Null | Marketing name of the model |
| `brand` | `text` | Not Null | Brand name (e.g., ASUS, Apple) |
| `slug` | `text` | Unique, Not Null | URL-safe name for page routing |
| `price_inr` | `integer` | Not Null | Indian Rupee price |
| `price_usd` | `integer` | Nullable | US Dollar price |
| `cpu_arch` | `text` | `IN ('x86', 'ARM')` | CPU instruction set architecture |
| `cpu_brand` | `text` | `IN ('Intel', 'AMD', 'Apple')` | CPU designer brand |
| `cpu_series` | `text` | `IN ('U', 'P', 'H', 'HX', 'M-series')` | CPU tier (thermal/workload type) |
| `cpu_model` | `text` | default `''` | CPU model number (e.g. `i7-13700H`) |
| `gpu_type` | `text` | `IN ('integrated', 'dedicated')` | GPU class |
| `gpu_model` | `text` | default `''` | Graphic processor model name |
| `gpu_tgp_watts` | `integer` | default `0` | Total Graphics Power (critical for GPU load) |
| `ram_gb` | `integer` | Not Null | System RAM capacity in GB |
| `ram_type` | `text` | `IN ('LPDDR5X', 'LPDDR5', 'DDR5', 'DDR4')` | Memory speed technology |
| `storage_gb` | `integer` | Not Null | SSD capacity in GB |
| `storage_type` | `text` | `IN ('NVMe', 'SATA')` | Solid state drive connection bus type |
| `display_size` | `float` | Not Null | Screen diagonal size in inches |
| `display_type` | `text` | `IN ('IPS', 'OLED', 'Mini-LED', 'TN', 'AMOLED')` | Panel technology type |
| `display_hz` | `integer` | default `60` | Screen refresh rate |
| `display_nits` | `integer` | default `0` | Maximum panel brightness |
| `display_color_gamut` | `integer` | Nullable | Percent coverage (e.g., 95% DCI-P3) |
| `battery_wh` | `integer` | default `0` | Battery capacity in Watt-hours |
| `weight_kg` | `float` | default `0` | Unit weight in kilograms |
| `os_support` | `text` | `IN ('Windows', 'macOS', 'Linux', 'any')` | OS support flag |
| `best_for` | `text[]` | array | Targeted use cases (e.g., `{'programming', 'gaming'}`) |
| `pros` | `text` | default `''` | Bulleted list of advantages |
| `cons` | `text` | default `''` | Bulleted list of disadvantages |
| `affiliate_amazon_in` | `text` | default `''` | Amazon India affiliate referral link |
| `affiliate_amazon_com` | `text` | Nullable | Amazon US affiliate referral link |
| `image_url` | `text` | Nullable | Static CDN URL for the model photo |
| `is_active` | `boolean` | default `true` | Visibility flag for recommendations |
| `last_updated` | `timestamptz` | default `now()` | Automatically updated on edits |
| `created_at` | `timestamptz` | default `now()` | Date the row was created |

---

## 2. Data Sourcing, Pricing & Availability

### Origin of Data
- **Initial Seeds:** Data originates from local SQL files ([`db-seed-31-laptops-final.sql`](file:///home/yasmanth/Downloads/laptops/db-seed-31-laptops-final.sql)) executed via the Supabase Dashboard, alongside local script utilities like [`scripts/upsert-new-laptops.js`](file:///home/yasmanth/Downloads/laptops/scripts/upsert-new-laptops.js) which parsed specs from an internal spreadsheet/CSV to populate and update model listings.
- **Weekly Updates:** New models are discovered agentically using web research. Specs are verified against teardowns and benchmarks, then inserted via database upserts.

### Sourcing of Pricing & Availability
- Pricing is stored as integers (`price_inr` and `price_usd`).
- Availability is tracked via the `is_active` column (discontinued laptops remain in the database for historical lookup but are set to `is_active = false`).
- **Automatic Refreshes:** There is no cron infrastructure, native scraping scheduler, or background script execution within the Next.js application that automates this. The updates are entirely manual/agentic, driven by running the **Monday Agent runbook** on a scheduled prompt interface.

---

## 3. Affiliate Referral Link Configuration

- **Storage:** Affiliate links are saved directly within the `affiliate_amazon_in` and `affiliate_amazon_com` fields in the `laptops` table.
- **Generation:** During data import or new model creation, affiliate links are compiled by taking the Amazon Standard Identification Number (ASIN) and appending the associate tracking tag.
  - **India URL Format:** `https://www.amazon.in/dp/[ASIN]?tag=netha-21`
  - **US URL Format:** `https://www.amazon.com/dp/[ASIN]?tag=[US_TAG]`
  - **Flipkart Integration:** Flipkart URLs are occasionally integrated, though the database schema lacks a native Flipkart column, meaning they are either stored directly inside `affiliate_amazon_in` as text overrides or handled programmatically on page render.

---

## 4. Web Scraping & Scheduled Tasks Inventory

> [!NOTE]
> **No Programmatic Scheduler Inside Codebase:**
> There are no cron jobs, GitHub actions workflows, or API scraping scripts written in the Next.js codebase. All tasks are defined as a step-by-step human/agent runbook.

The only scheduled task logic exists as a markdown prompt template at [`scripts/monday-agent-prompt.md`](file:///home/yasmanth/Downloads/laptops/scripts/monday-agent-prompt.md). This file acts as a guidelines template for an external agent (run weekly at Monday at 9:00 AM via a scheduling interface):

1. **New Release Sweeping:** Executes web searches for new laptop launches in India. It fetches the `amazon.in` product page, extracts model specifications and the ASIN, compiles the affiliate tracking URL (`?tag=netha-21`), and calls local classification tools to format the data.
2. **Price Drops Checking:** Searches for recent Indian retail price updates, verifies them against `amazon.in`, and updates `price_inr` on Supabase.
3. **Discontinuation Validation:** Web-fetches the affiliate URLs for the **5 oldest laptops** in the database. If a page returns "Currently Unavailable" or "Page Not Found", it executes:
   ```sql
   UPDATE laptops SET is_active = false WHERE id = '[id]';
   ```
4. **Cache Invalidation Execution:** If additions or updates occur, it invalidates cache tables:
   ```sql
   DELETE FROM recommendation_cache WHERE expires_at > now();
   DELETE FROM laptop_explanations WHERE laptop_id = '[changed_laptop_id]';
   ```

---

## 5. Architectural Map for 10x Scale & Daily Refreshes

To scale the catalog to **600+ laptops (10x)** and support **daily automated price updates**, several missing structural pieces must be built.

### Requirements to Grow the Catalog 10x
1. **Granular Retrieval Pre-Filter:**
   - *Problem:* Currently, the router retrieves candidates, orders them by `last_updated` and slices the top 15. With 600+ laptops, this slice will miss highly relevant options because it is too coarse.
   - *Fix:* Replace the slice with a multi-step retrieval (e.g., PostgreSQL weighted ranking, BM25 text match on hardware specs, or a secondary LLM filtering step) to choose the best 15 models *before* sending to Claude.
2. **Pre-generation Speed and Cost Constraints:**
   - *Problem:* 600 laptops × 8 use cases = 4,800 explanations. Running this through Claude-Haiku sequentially takes ~1.6 hours (due to the 1.2s delay to avoid rate limits) and is costly.
   - *Fix:* Shift to asynchronous batch generation pipelines using queue workers (e.g. Upstash QStash) to call the Anthropic API in parallel while respecting rate-limit headers.
3. **Administrative Dashboard UI:**
   - *Problem:* Managing 600+ entries via raw SQL migrations (`.sql` files) or CLI import scripts is error-prone.
   - *Fix:* Build an internal, secure admin dashboard (`/admin/laptops`) to edit laptop specifications, monitor active statuses, and trigger batch generations.

### Requirements to Refresh Prices Daily
1. **Reliable Product Sourcing APIs:**
   - *Problem:* Web scraping Amazon or Flipkart directly from Vercel serverless functions will be blocked by CAPTCHAs, IP bans, and DOM selector changes.
   - *Fix:* Integrate with a paid e-commerce API (e.g., Rainforest API for Amazon, or official affiliate API partners) to query prices reliably by ASIN.
2. **Automated Cron Trigger Engine:**
   - *Problem:* The repo lacks cron triggers.
   - *Fix:* Define a Vercel Cron Job config (`vercel.json`) or configure a scheduler (like Upstash QStash) to hit a protected API endpoint (e.g., `/api/cron/sync-prices`) every night at 2:00 AM.
3. **Selective Cache Eviction:**
   - *Problem:* Currently, any price update triggers a bulk cache deletion (`DELETE FROM recommendation_cache`). If prices update daily, user cache hits will drop to near 0%.
   - *Fix:* Implement selective cache invalidation. Clear only cache entries that contain the updated laptop, or use cache tag invalidation logic.
4. **Price History Table:**
   - *Problem:* Only current price is stored.
   - *Fix:* Add a `price_history` table (`(laptop_id, price_inr, recorded_at)`) to power price-trend charts, helping users identify actual deals.
