# /seed-laptops

Seed the Supabase `laptops` table with 30 real laptops covering all budget ranges and use cases.

## Steps
1. Read `docs/supabase-schema.sql` to understand the exact column names and types
2. WebSearch for current laptop models and prices in India (May 2026):
   - Budget (under ₹50k): Acer Aspire, Lenovo IdeaPad, HP 15s
   - Mid-range (₹50k–80k): Asus Vivobook Pro, Dell Inspiron 15, Lenovo Slim 5
   - Upper-mid (₹80k–1.2L): Dell XPS 13, HP Spectre x360, Asus Zenbook 14
   - Premium (₹1.2L–2L): MacBook Air M3, Dell XPS 15, Lenovo ThinkPad X1
   - High-end (above ₹2L): MacBook Pro M3 Pro, Razer Blade 16, ASUS ROG Zephyrus
3. For each laptop, find on amazon.in → extract ASIN → build affiliate URL: `https://www.amazon.in/dp/[ASIN]?tag=netha-21`
4. Classify each laptop using the hardware knowledge in `.claude/skills/laptop-researcher/SKILL.md`
5. Insert all 30 rows into Supabase using the MCP server

## Required Fields Per Laptop
- name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, gpu_type, gpu_model, gpu_tgp_watts
- ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits
- battery_wh, weight_kg, best_for (array), pros, cons, affiliate_amazon_in, image_url

## best_for Tag Values
`video-editing` | `programming` | `gaming` | `general` | `business` | `ai-ml` | `design` | `content`

## Ensure Coverage
- At least 3 laptops per major use case
- At least 2 MacBooks (macOS coverage)
- At least 2 gaming laptops
- Mix of Intel, AMD, Apple Silicon CPUs
