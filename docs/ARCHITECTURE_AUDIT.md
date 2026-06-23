# LaptopAdvisor Architecture Audit & System Mapping

This document provides a comprehensive technical audit of the **LaptopAdvisor** recommendation platform. It details the system architecture, infrastructure dependencies, data validation and query flows, database schemas, seeding/maintenance mechanisms, and API endpoints.

---

## 1. Tech Stack & Infrastructure

The LaptopAdvisor platform is a modern, high-performance web application designed to recommend laptops using a hybrid search and LLM ranking strategy.

### Core Technologies
- **Frontend & Backend Framework:** [Next.js 16.2.6](file:///home/yasmanth/Downloads/laptops/package.json#L20) (App Router configuration) paired with [React 19.2.4](file:///home/yasmanth/Downloads/laptops/package.json#L21) and React DOM.
- **Database:** Supabase (PostgreSQL 15+) with the `pgvector` extension enabled for semantic hardware knowledge queries.
- **AI / LLM Engine:** [Anthropic Claude SDK v0.97.1](file:///home/yasmanth/Downloads/laptops/package.json#L12) using `claude-haiku-4-5` for ranking and explanation generation.
- **Rate Limiting:** Upstash Redis (`@upstash/ratelimit` v2.0.8 & `@upstash/redis` v1.38.0), currently disabled in development but fully integrated.
- **Styling & Components:** Tailwind CSS v4, `@base-ui/react` v1.5.0, and `shadcn` v4.7.0.
- **Hosting Platform:** Vercel.

### Environment Variables Matrix

| Variable Name | Purpose | Scope | Required / Optional |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public endpoint URL for the Supabase project connection. | Client & Server | **Required** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key used to query public tables (RLS controlled). | Client & Server | **Required** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used to write, delete, and bypass Row Level Security. | Server Only | **Required** |
| `ANTHROPIC_API_KEY` | Secret credential used to authenticate calls to the Anthropic API. | Server Only | **Required** |
| `UPSTASH_REDIS_REST_URL` | Connection endpoint to Upstash Redis for sliding-window rate limiting. | Server Only | Required in Production |
| `UPSTASH_REDIS_REST_TOKEN` | Authentication token for Upstash Redis. | Server Only | Required in Production |
| `CACHE_ADMIN_KEY` | Secret token compared against the incoming `x-admin-key` header to secure admin endpoints. | Server Only | **Required** |
| `AFFILIATE_TAG` | Amazon affiliate tag tracked for referral links (defaults to `netha-21`). | Client & Server | Optional (defaults in code) |

### Supabase Setup & Development Errors

> [!WARNING]
> **Missing Environment Configuration:**
> There are currently no `.env` or `.env.local` files in the project root directory. Running the development server without defining these environment variables will result in immediate runtime exceptions during database or recommendation queries.

Specifically, the database connection helper in [`lib/supabase.ts`](file:///home/yasmanth/Downloads/laptops/lib/supabase.ts) is configured to raise assertions:
- **Client Client Initialization:** Calling `getSupabaseClient()` throws `Error: Missing Supabase public env vars` if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set.
- **Server Client Initialization:** Calling `getServiceClient()` throws `Error: Missing Supabase service role env vars` if `SUPABASE_SERVICE_ROLE_KEY` is missing.
- **WebSocket Deprecation Warnings:** When running scripts on older Node environments (e.g., v18.19.1), the `@supabase/realtime-js` client will fail on initialization due to a lack of WebSocket support. This requires upgrading Node to v20+ or supplying a custom WebSocket transport object.

---

## 2. Request Flow: Quiz Recommendation

When a user completes the quiz on the frontend and clicks submit, the application executes a multi-layer filtering, ranking, and generation flow.

```
                  ┌───────────────────────────────────┐
                  │          Quiz Submission          │
                  │        POST /api/recommend        │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │       Validate Request Body       │
                  │   Check role, OS, budget ranges   │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │      Compute Query SHA256         │
                  │       (From Normalized Form)      │
                  └─────────────────┬─────────────────┘
                                    │
                                    ├──────────────────────────┐
                                    ▼ [Cache Hit]              ▼ [Cache Miss]
                     ┌──────────────────────────────┐   ┌──────────────────────────────┐
                     │   Layer 1 Query Cache        │   │    Filter Active Laptops     │
                     │  (recommendation_cache table)│   │  By Budget, OS, and Brand    │
                     │   Returns direct cached JSON │   └──────────────┬───────────────┘
                     └──────────────────────────────┘                  │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │    Filter by Use-case Tag    │
                                                        │   (Falls back if results < 6)│
                                                        └──────────────┬───────────────┘
                                                                       │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │  Layer 2 Explanations Cache  │
                                                        │  (laptop_explanations table) │
                                                        └──────────────┬───────────────┘
                                                                       │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │   Anthropic API getRanking   │
                                                        │    Rank Top 3 using Claude   │
                                                        └──────────────┬───────────────┘
                                                                       │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │    On-Demand Explanations    │
                                                        │  Generate missing, write L2  │
                                                        └──────────────┬───────────────┘
                                                                       │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │ Write L1 Cache & Return JSON │
                                                        │       (X-Cache: MISS)        │
                                                        └──────────────────────────────┘
```

### Trace of Request Flow Code Path

#### Step 1: Body Parse & Validation
The endpoint [`app/api/recommend/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L34-L66) processes the `POST` request, extracts the JSON payload, and calls `validateForm(body)` to check constraints.
```typescript
function validateForm(body: unknown): RecommendationFormData | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!VALID_ROLES.includes(b.role as string)) return null
  if (!VALID_USES.includes(b.primary_use as string)) return null
  if (!BUDGET_RANGES.find((r) => r.label === b.budget_key)) return null
  if (!VALID_PRIORITIES.includes(b.top_priority as string)) return null
  if (!VALID_OS.includes(b.os_preference as string)) return null
  return b as unknown as RecommendationFormData
}
```

#### Step 2: Rate Limiting
The application queries Upstash Redis using the client's IP address ([`app/api/recommend/route.ts:L37-L52`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L37-L52)). It is currently commented out for development.

#### Step 3: Compute Query Hash
The normalized form inputs are hashed to a unique SHA256 string in [`lib/hash.ts`](file:///home/yasmanth/Downloads/laptops/lib/hash.ts):
```typescript
export function hashFormData(data: RecommendationFormData): string {
  const normalized = JSON.stringify({
    role: data.role,
    primary_use: data.primary_use,
    budget_key: data.budget_key,
    top_priority: data.top_priority,
    os_preference: data.os_preference,
  })
  return createHash('sha256').update(normalized).digest('hex')
}
```

#### Step 4: Layer 1 Query Cache Check
The route queries the `recommendation_cache` table. If a match is found and is not expired, it returns the payload immediately with the header `X-Cache: HIT` ([`app/api/recommend/route.ts:L71-L84`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L71-L84)):
```typescript
const { data: cached } = await supabase
  .from('recommendation_cache')
  .select('result_json')
  .eq('query_hash', queryHash)
  .gt('expires_at', new Date().toISOString())
  .single()

if (cached) {
  return NextResponse.json(
    { ...cached.result_json, query_hash: queryHash },
    { headers: { 'X-Cache': 'HIT' } }
  )
}
```

#### Step 5: Database Filtering (Smart Filter)
If the query cache misses, the system executes a smart filter against the active laptop list in the database using price bounds, operating system support, and brand preferences ([`app/api/recommend/route.ts:L86-L105`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L86-L105)):
```typescript
const budgetRange = BUDGET_RANGES.find((r) => r.label === form.budget_key)!
const useCaseTag = mapFormToUseCaseTag(form)

let query = supabase
  .from('laptops')
  .select('*')
  .eq('is_active', true)
  .gte('price_inr', budgetRange.min)
  .lte('price_inr', budgetRange.max)

if (form.os_preference !== 'no-preference') {
  query = query.in('os_support', [form.os_preference, 'any'])
}
if (form.brand_preference && form.brand_preference !== 'no-preference') {
  query = query.eq('brand', form.brand_preference)
}
const { data: allFiltered } = await query.order('last_updated', { ascending: false }).limit(50)
```
The results are then narrowed by use-case tag matching the `best_for` array. If fewer than 6 laptops match, it falls back to the full list, limited to the top 15 records.

#### Step 6: Layer 2 Explanation Cache Lookup
The system fetches pre-existing explanations matching the subset of laptops and use-case tag from the `laptop_explanations` table ([`app/api/recommend/route.ts:L125-L134`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L125-L134)):
```typescript
const { data: cachedExplanations } = await supabase
  .from('laptop_explanations')
  .select('*')
  .in('laptop_id', laptopsForClaude.map((l) => l.id))
  .eq('use_case', useCaseTag)

const explanationMap = new Map(
  (cachedExplanations || []).map((e: any) => [e.laptop_id, e])
)
```

#### Step 7: Anthropic Claude Ranking
The system passes the filtered metadata to Claude using the Anthropic API to select and rank the top 3 laptops ([`lib/claude.ts`](file:///home/yasmanth/Downloads/laptops/lib/claude.ts#L82-L120)). It requests lean JSON suggestions (rank, ID, headline, confidence, score) without requesting full justifications to save tokens and reduce latency.

#### Step 8: On-Demand Explanation Generation (Fallback)
For the selected top 3 laptops, if any use-case explanation is missing from the Layer 2 cache, the router dynamically generates it on-demand ([`lib/explanation-generator.ts`](file:///home/yasmanth/Downloads/laptops/lib/explanation-generator.ts)) and commits it to `laptop_explanations` ([`app/api/recommend/route.ts:L153-L182`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L153-L182)):
```typescript
const { generateExplanation } = await import('@/lib/explanation-generator')
const generated = await generateExplanation(laptop, useCaseTag)

await supabase.from('laptop_explanations').upsert(
  {
    laptop_id: laptop.id,
    use_case: useCaseTag,
    explanation: generated.explanation,
    key_strengths: generated.key_strengths,
    one_weakness: generated.one_weakness,
    cached_at: new Date().toISOString(),
  },
  { onConflict: 'laptop_id,use_case' }
)
```

#### Step 9: L1 Query Caching & Response
The recommendation payload is saved to the `recommendation_cache` table with a 24-hour expiration timestamp and returned to the client with an `X-Cache: MISS` header.

---

## 3. Database Schema & Seeding Mechanics

### Database Tables and Columns

The database is built on Supabase PostgreSQL. Below are the definitions extracted from the schema files:

#### 1. `laptops` Table
Stores technical specifications and status flags for laptops.
- `id` (uuid, Primary Key)
- `name` (text, Not Null)
- `brand` (text, Not Null)
- `slug` (text, Unique, Not Null)
- `price_inr` (int, Not Null)
- `price_usd` (int)
- `cpu_arch` (text, 'x86' or 'ARM')
- `cpu_brand` (text, 'Intel' or 'AMD' or 'Apple')
- `cpu_series` (text, 'U', 'P', 'H', 'HX', or 'M-series')
- `cpu_model` (text, default '')
- `gpu_type` (text, 'integrated' or 'dedicated')
- `gpu_model` (text, default '')
- `gpu_tgp_watts` (int, default 0)
- `ram_gb` (int)
- `ram_type` (text, 'LPDDR5X', 'LPDDR5', 'DDR5', or 'DDR4')
- `storage_gb` (int)
- `storage_type` (text, 'NVMe' or 'SATA')
- `display_size` (float)
- `display_type` (text, 'IPS', 'OLED', 'Mini-LED', 'TN', or 'AMOLED')
- `display_hz` (int, default 60)
- `display_nits` (int, default 0)
- `display_color_gamut` (int)
- `battery_wh` (int, default 0)
- `weight_kg` (float, default 0)
- `os_support` (text, 'Windows', 'macOS', 'Linux', or 'any')
- `best_for` (text[] array)
- `pros` (text)
- `cons` (text)
- `affiliate_amazon_in` (text)
- `affiliate_amazon_com` (text)
- `image_url` (text)
- `is_active` (boolean, default true)
- `last_updated` (timestamptz)
- `created_at` (timestamptz)

#### 2. `recommendation_cache` Table
Stores full-query recommendation payloads to optimize performance.
- `id` (uuid, Primary Key)
- `query_hash` (text, Unique, Not Null)
- `result_json` (jsonb, Not Null)
- `created_at` (timestamptz)
- `expires_at` (timestamptz, index)

#### 3. `laptop_explanations` Table
Maintains pre-generated Claude explanations per laptop/use-case configuration.
- `id` (uuid, Primary Key)
- `laptop_id` (uuid, Foreign Key -> `laptops(id)`)
- `use_case` (text, Not Null)
- `explanation` (text, Not Null)
- `key_strengths` (text[] array)
- `one_weakness` (text, Not Null)
- `cached_at` (timestamptz)
- *Unique Constraint:* `(laptop_id, use_case)`

#### 4. `knowledge_chunks` Table
Maintains vectorized text documents for semantic retrieval.
- `id` (uuid, Primary Key)
- `content` (text, Not Null)
- `embedding` (vector(1536) for OpenAI/similar embedding dimensions)
- `section` (text)
- `chunk_index` (int)
- `created_at` (timestamptz)

#### 5. `blog_posts` Table
Contains SEO-optimized blog posts generated by background content writing jobs.
- `id` (uuid, Primary Key)
- `slug` (text, Unique, Not Null)
- `title` (text, Not Null)
- `meta_description` (text, Not Null)
- `content_html` (text, Not Null)
- `target_keyword` (text, Not Null)
- `featured_laptop_ids` (uuid[] array)
- `published` (boolean, default false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

### Seeding Mechanics & Scripts

The database holds exactly **61 laptop rows** today:
- **Active Laptops (`is_active = true`):** 33 rows.
- **Discontinued Laptops (`is_active = false`):** 28 rows.

The system uses several seeding methods:
- **`db-seed-30-laptops.sql`:** The original SQL migration file containing 30 seed records.
- **`db-seed-31-laptops-final.sql`:** A refined SQL migration script containing 27 laptops with verified real-world Indian market specifications (omitting 6 problematic models).
- **`seed-verified.js` / `seed-laptops-verified.js`:** Utility Node scripts that clear the `laptops` table and seed the 27 verified models.
- **`scripts/upsert-new-laptops.js`:** An upsert script that populates/updates 33 newer models based on an internal dataset. It uses PostgreSQL's `ON CONFLICT (slug) DO UPDATE` pattern to update specifications without wiping previous rows or custom keys.

---

### Automated & Scheduled Updates

> [!NOTE]
> **Database Updates & Discontinuations:**
> LaptopAdvisor never deletes database entries directly. To preserve recommendation histories, outdated or unavailable models are marked as discontinued by updating their status to `is_active = false`.

Database updates are handled via two avenues:

1. **The Monday Agent:**
   Scraped and executed every Monday at 9:00 AM using the cron-schedule prompt template in [`scripts/monday-agent-prompt.md`](file:///home/yasmanth/Downloads/laptops/scripts/monday-agent-prompt.md). This agent:
   - Performs web searches for new laptop launches in India.
   - Fetches product specs directly from Amazon, updates/inserts them in the database, and injects affiliate tags (`tag=netha-21`).
   - Sweeps and updates prices for active models in the database.
   - Scrapes product pages for the **5 oldest active laptops** in the database. If they are out of stock or unavailable, it updates them to `is_active = false`.
   - Evicts recommendation caches (`recommendation_cache`) and explanation caches (`laptop_explanations`) for any modified laptops.

2. **Trigger endpoints:**
   Triggering `/api/cache` (`DELETE` method) clears expired cache entries, and visiting administrative update endpoints forces synchronizations.

---

## 4. API Routes Inventory

The following is an inventory of all active API endpoints under [`app/api/`](file:///home/yasmanth/Downloads/laptops/app/api):

### 1. `POST /api/recommend`
- **File Path:** [`app/api/recommend/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts)
- **Functionality:** Handles form submissions from the client, validates quiz options, searches matching laptops, ranks suggestions using Claude, caches results, and returns the top 3 recommendations.

### 2. `POST | GET /api/admin/generate-explanations`
- **File Path:** [`app/api/admin/generate-explanations/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/admin/generate-explanations/route.ts)
- **Functionality:**
  - **`POST`:** Pre-generates explanations for all active laptops across all 8 supported use cases using Claude, caching them in `laptop_explanations`. Requires authorization using the `x-admin-key` header.
  - **`GET`:** Returns status reports containing the counts of generated explanations categorized by use case.

### 3. `GET /api/brands`
- **File Path:** [`app/api/brands/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/brands/route.ts)
- **Functionality:** Returns a unique, sorted list of all active laptop brands (e.g., Apple, Dell, Lenovo, HP) currently stored in the database. Cached using Next.js `revalidate = 3600`.

### 4. `GET | DELETE /api/cache`
- **File Path:** [`app/api/cache/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/cache/route.ts)
- **Functionality:**
  - **`GET`:** Retrieves caching statistics showing active vs expired entries in `recommendation_cache` and total entries in `laptop_explanations`.
  - **`DELETE`:** Purges expired entries from `recommendation_cache` by default. Can purge all cache entries if called with `?mode=all`. Requires the `x-admin-key` header.

### 5. `GET /api/laptops`
- **File Path:** [`app/api/laptops/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/laptops/route.ts)
- **Functionality:** Performs database queries to search active laptops matching filters like `brand`, `use_case`, `min_price`, and `max_price`. Returns matches sorted by price.

### 6. `GET /api/og/laptop/[slug]`
- **File Path:** [`app/api/og/laptop/[slug]/route.tsx`](file:///home/yasmanth/Downloads/laptops/app/api/og/laptop/%5Bslug%5D/route.tsx)
- **Functionality:** Dynamically generates high-resolution PNG Open Graph preview images for social sharing, displaying details such as laptop model, brand, price, and a call to action.
