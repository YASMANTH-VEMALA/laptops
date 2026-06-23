# LaptopAdvisor Frontend & Bugs Audit

This document details the frontend implementation, state management, results rendering, matching logic, and known errors/testing status of the **LaptopAdvisor** platform.

---

## 1. Quiz State Collection & Submission

### State Collection Flow
The main user interaction begins on the home page ([`app/page.tsx`](file:///home/yasmanth/Downloads/laptops/app/page.tsx#L99)), which renders the stateful [`RecommendationForm`](file:///home/yasmanth/Downloads/laptops/components/RecommendationForm.tsx) component.

The form state is initialized as a client-side object using React's `useState`:
```typescript
const [form, setForm] = useState<Partial<RecommendationFormData>>({ brand_preference: 'no-preference' })
```

The component displays a list of cards defined in `BASE_FORM_FIELDS`. For each card, a Shadcn/Base-UI `Select` input allows the user to select an option, modifying the corresponding key in the `form` state object on change:
```typescript
onValueChange={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
```

The form collects 5 mandatory keys and 1 optional key:
1. `role`: The user's workflow profile (e.g. `'gamer'`).
2. `primary_use`: The primary computational task (e.g. `'gaming'`).
3. `budget_key`: The target budget range (e.g. `'₹80,000 – ₹1,20,000'`).
4. `top_priority`: The main priority parameter (e.g. `'raw-performance'`).
5. `os_preference`: The operating system (e.g. `'Windows'`).
6. `brand_preference` (Optional): The preferred manufacturer (populated dynamically from the database via `/api/brands`).

### Submission Fetch Request
Once all 5 mandatory keys are set, `isComplete` becomes `true` and enables the submit button. When clicked, `handleSubmit` makes an HTTP `POST` fetch call to `/api/recommend`:
```typescript
const res = await fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
})

if (res.status === 429) {
  setError('Too many requests. Please wait an hour before trying again.')
  return
}

if (!res.ok) {
  const data = await res.json().catch(() => ({}))
  setError(data.error || 'Something went wrong. Please try again.')
  return
}

const data = await res.json()
router.push(`/result?id=${data.query_hash}`)
```
Upon a successful response, the router redirects the client to the `/result` page, passing the generated SHA256 `query_hash` as the `id` search parameter.

---

## 2. Results Fetching & Rendering

### Fetching Cached Results
The results page ([`app/result/page.tsx`](file:///home/yasmanth/Downloads/laptops/app/result/page.tsx)) is a server component that extracts the `id` (query hash) from the URL search parameters:
```typescript
export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) notFound()

  const data = await getResult(id)
  ...
```

The page invokes the server-only `getResult(queryHash)` helper to fetch the cached recommendation payload and hydration data from the database:
```typescript
async function getResult(queryHash: string): Promise<RecommendationResponse | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('recommendation_cache')
    .select('result_json')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null

  const result = data.result_json as RecommendationResponse
  const laptopIds = result.result.top3.map((r) => r.laptop_id)

  const { data: laptops } = await supabase
    .from('laptops')
    .select('*')
    .in('id', laptopIds)

  if (!laptops) return null

  const laptopMap = Object.fromEntries(laptops.map((l: Laptop) => [l.id, l]))
  return { ...result, laptops: laptopMap }
}
```

### Rendering Results Cards
If cached results exist, the page iterates over the top 3 recommendations array, matches each recommendation item to its detailed specs using the hydrated `laptops` lookup map, and renders a [`ResultCard`](file:///home/yasmanth/Downloads/laptops/components/ResultCard.tsx) component for each of the three laptops:
```typescript
const { result, laptops } = data
...
<div className="space-y-6">
  {result.top3.map((ranked) => {
    const laptop = laptops[ranked.laptop_id]
    if (!laptop) return null
    return <ResultCard key={ranked.rank} ranked={ranked} laptop={laptop} />
  })}
</div>
```

The [`ResultCard`](file:///home/yasmanth/Downloads/laptops/components/ResultCard.tsx) displays:
- Rank badge (`#1 Best Pick`, `#2 Runner Up`, or `#3 Great Value`).
- Dynamic specs grid (Processor, GPU, RAM, Storage, Display, Battery, Weight).
- An expandable/collapsible block revealing the expert explanation (`why_best`), a list of `key_strengths`, and `one_honest_weakness`.
- An Amazon affiliate button leading directly to the referral link.

---

## 3. Matching & Scoring Logic

### Backend Database Pre-Filtering
Matching and scoring are split between deterministic database filtering and subjective AI ranking. The backend pre-filtering query in [`app/api/recommend/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L86-L105) filters the laptops table based on constraints:
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

It then refines the candidates using the user's primary use-case tag, falling back to the wider filtered list if fewer than 6 laptops match:
```typescript
let laptopsForClaude = (allFiltered as Laptop[]).filter((l) =>
  l.best_for.includes(useCaseTag)
)
if (laptopsForClaude.length < 6) {
  laptopsForClaude = allFiltered as Laptop[]
}
laptopsForClaude = laptopsForClaude.slice(0, 15)
```

### Deterministic Fallback Logic
If the Claude LLM API call fails, the backend falls back to a deterministic selection by taking the first three pre-filtered laptops directly from the array:
```typescript
ranking = laptopsForClaude.slice(0, 3).map((l, i) => ({
  rank: (i + 1) as 1 | 2 | 3,
  laptop_id: l.id,
  headline: `${l.brand} — solid ${useCaseTag} pick`,
  buy_confidence: 'Medium' as const,
  use_case_fit_score: 7,
}))
```

---

## 4. Known Errors & Bugs

### 1. "Missing Supabase public env vars" Error
- **Symptom:** App crashes during startup or raises database connection errors when querying data.
- **Root Cause:** In [`lib/supabase.ts`](file:///home/yasmanth/Downloads/laptops/lib/supabase.ts#L6-L14), `getSupabaseClient()` asserts that the environment variables are set:
  ```typescript
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase public env vars')
  ```
  Since the repository currently has no `.env` or `.env.local` files in the root folder, this error is thrown immediately when any public supabase query is made.

### 2. `/api/brands` 500 Internal Server Error
- **Symptom:** The Preferred Brand select dropdown on the homepage remains empty or hidden, and requests to `/api/brands` return a 500 error.
- **Root Cause:** In [`app/api/brands/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/brands/route.ts), the GET handler queries the database using:
  ```typescript
  export async function GET() {
    const { data, error } = await supabase
      .from('laptops')
      .select('brand')
      .eq('is_active', true)
      ...
  ```
  `supabase` is imported from `lib/supabase.ts` and maps to `getSupabaseClient()`. Because the public environment variables are missing, `getSupabaseClient()` throws `Missing Supabase public env vars` before the query runs. Since this unhandled error is thrown inside a Next.js server route, Next.js catches it and returns a standard `500 Internal Server Error` response.

---

## 5. Testing Infrastructure Status

> [!IMPORTANT]
> **No Automated Tests Present:**
> The repository does not contain any automated tests. There are no test directories (such as `test/`, `tests/`, or `__tests__/`), no unit test configurations (Jest, Vitest), no end-to-end framework configurations (Playwright, Cypress), and no `test` scripts defined in `package.json`. Testing is done manually by interacting with the app in development mode.
