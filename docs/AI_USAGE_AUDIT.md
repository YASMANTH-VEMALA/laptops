# LaptopAdvisor AI Usage & LLM Call Audit

This document provides a comprehensive audit of all locations in the codebase that invoke Anthropic's Claude API.

---

## Overview of LLM Integration Locations

There are exactly **four locations** in the codebase that make calls to Anthropic's Claude API:
1. **`lib/claude.ts` (`getRanking`)**: Ranks a pre-filtered candidate list of laptops (up to 15) to select the top 3 recommendations based on user quiz responses.
2. **`lib/explanation-generator.ts` (`generateExplanation`)**: Generates structured explanations on-demand for a single laptop and use-case if not already cached.
3. **`app/api/admin/generate-explanations/route.ts` (`generateExplanation`)**: Batch-generates explanations for administrative caching over HTTP.
4. **`scripts/generate-explanations.js` (`generateExplanation`)**: Batch-generates explanations via a command-line script.

---

## 1. Laptop Ranking & Selection Call (`lib/claude.ts`)

### 1. File/Function & User Action
- **Location:** [`lib/claude.ts` -> `getRanking()`](file:///home/yasmanth/Downloads/laptops/lib/claude.ts#L82)
- **User Action:** Triggers when a user fills out the quiz form and submits it, sending a `POST` request to [`/api/recommend`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts).

### 2. Prompt Template & Injected Variables
The system prompt is configured to load as cached prompt context (`cache_control: { type: 'ephemeral' }`).

#### System Prompt Template
```typescript
const SYSTEM_PROMPT = `You are an expert laptop hardware advisor with deep knowledge of:
- CPU performance: why H-series processors outperform U-series for sustained workloads
- GPU TGP (Total Graphics Power): how the same GPU model at different wattages performs completely differently (an RTX 4060 at 80W is 40% faster than at 50W)
- RAM impact: why 8GB is insufficient for modern workflows and when 32GB is necessary
- Display technology: IPS vs OLED vs Mini-LED trade-offs for different use cases
- Battery life: how ARM (Apple Silicon) achieves 2x the battery life vs x86 at similar performance
- Thermal design: why thin laptops throttle and what TDP limits mean for real-world sustained performance
- Value analysis: price-to-performance across different market segments in India

Your job is to analyze a filtered list of laptops and recommend the TOP 3 for the user's specific use case.

IMPORTANT RULES:
1. Your explanation must be specific — mention actual specs and WHY they matter for this person
2. Do NOT use generic phrases like "powerful processor" — say "Intel Core i7-13700H which maintains 45W sustained = no throttling during long Premiere Pro exports"
3. Rank based on the user's top priority, not just general quality
4. Be honest about weaknesses — mention TGP limits, soldered RAM, fan noise, weight
5. Write for a non-technical reader — explain every technical term you use

You MUST respond with valid JSON only. No markdown, no extra text.`
```

#### User Prompt Template
```typescript
function buildUserPrompt(
  form: RecommendationFormData,
  laptops: Laptop[],
  budgetLabel: string
): string {
  const laptopList = laptops.map((l) => ({
    id: l.id,
    name: l.name,
    price_inr: l.price_inr,
    cpu: `${l.cpu_brand} ${l.cpu_model} (${l.cpu_series}-series, ${l.cpu_arch})`,
    gpu: l.gpu_type === 'dedicated'
      ? `${l.gpu_model} @ ${l.gpu_tgp_watts}W TGP`
      : `${l.gpu_model} (integrated)`,
    ram: `${l.ram_gb}GB ${l.ram_type}`,
    storage: `${l.storage_gb}GB ${l.storage_type}`,
    display: `${l.display_size}" ${l.display_type} ${l.display_hz}Hz ${l.display_nits}nits`,
    battery: `${l.battery_wh}Wh`,
    weight: `${l.weight_kg}kg`,
    best_for: l.best_for.join(', '),
    pros: l.pros,
    cons: l.cons,
  }))

  return JSON.stringify({
    user: {
      role: form.role,
      primary_use: form.primary_use,
      budget: budgetLabel,
      top_priority: form.top_priority,
      os_preference: form.os_preference,
    },
    available_laptops: laptopList,
    task: `Analyze these laptops against the user's needs and RANK the top 3.
Focus on: their top_priority (${form.top_priority}), primary_use (${form.primary_use}), and budget fit.
Compare GPU TGP wattages, CPU series (H vs U vs HX), RAM capacity, and display specs against what matters for ${form.primary_use}.
ONLY return the ranking and headline — do NOT write explanations (those are pre-written separately).`,
    response_schema: {
      top3: [
        {
          rank: '1 | 2 | 3',
          laptop_id: 'uuid string from available_laptops',
          headline: 'Max 8 words — the single most compelling reason for this user',
          buy_confidence: 'High | Medium',
          use_case_fit_score: '1-10 integer based on how well specs match this use case',
        },
      ],
    },
  })
}
```

#### Injected Variables
- `form.role`: E.g., `'software-developer'`, `'gamer'`, etc.
- `form.primary_use`: E.g., `'coding'`, `'gaming'`, etc.
- `budgetLabel`: Selected budget range display string, e.g., `'₹80,000 – ₹1,20,000'`.
- `form.top_priority`: E.g., `'battery-life'`, `'raw-performance'`, etc.
- `form.os_preference`: E.g., `'Windows'`, `'macOS'`, `'no-preference'`.
- `laptopList`: Array of pre-filtered laptop objects mapped into lean spec profiles.

> [!IMPORTANT]
> **Is the full list of laptops from the database sent?**
> **No.** The query executes a database-level **Smart Filter** inside [`app/api/recommend/route.ts`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L86-L105) matching the selected price bounds, OS support, and brand filters. It is then narrowed to matching use-cases and sliced down to a **maximum of 15 candidate laptops** (`laptopsForClaude = laptopsForClaude.slice(0, 15)`) before passing to Claude.

### 3. Sorting & Ranking Decision
- **Method:** **Claude** makes the decision. It receives the candidate list, compares specs, and outputs ranked recommendations based on the user's top priorities.
- **Fallback Ranking Logic:** If the Claude API fails or times out, a fallback sorting is implemented in code inside [`app/api/recommend/route.ts:L142-L151`](file:///home/yasmanth/Downloads/laptops/app/api/recommend/route.ts#L142-L151):
  ```typescript
  // Fallback: order by price fit and use cached explanations
  ranking = laptopsForClaude.slice(0, 3).map((l, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    laptop_id: l.id,
    headline: `${l.brand} — solid ${useCaseTag} pick`,
    buy_confidence: 'Medium' as const,
    use_case_fit_score: 7,
  }))
  ```

### 4. Model & Parameters
- **Model:** `claude-haiku-4-5`
- **max_tokens:** `400`
- **temperature:** Default (not specified, defaults to 1.0)

### 5. Caching & Cache Key
- **Where:** Database table `recommendation_cache` (Layer 1 - Full query cache).
- **Cache Key:** `query_hash` (A SHA256 hash computed in [`lib/hash.ts`](file:///home/yasmanth/Downloads/laptops/lib/hash.ts) based on the user's normalized form inputs).

---

## 2. On-Demand Explanation Generator (`lib/explanation-generator.ts`)

### 1. File/Function & User Action
- **Location:** [`lib/explanation-generator.ts` -> `generateExplanation()`](file:///home/yasmanth/Downloads/laptops/lib/explanation-generator.ts#L57)
- **User Action:** Triggers on form submission inside `/api/recommend` if any of the top 3 ranked laptops chosen by Claude do not have a pre-existing explanation for that specific use-case in the `laptop_explanations` table.

### 2. Prompt Template & Injected Variables

#### System Prompt Template
```typescript
const SYSTEM_PROMPT = `You are India's top laptop hardware expert. Write concise, specific explanations for why a laptop is great for a specific use case.

RULES:
1. Explain WHY specs matter, not just what they are
2. Use real-world numbers and comparisons
3. Be honest about weaknesses specific to THIS laptop for THIS use case
4. Write for non-technical readers

Return ONLY valid JSON:
{
  "explanation": "2-3 sentences explaining why this laptop fits this use case based on specific specs",
  "key_strengths": [
    "Specific strength with real-world impact",
    "Another specific strength",
    "A third specific strength"
  ],
  "one_weakness": "ONE specific weakness for THIS laptop and THIS use case, not generic"
}`
```

#### User Prompt Template
```typescript
function buildExplanationPrompt(laptop: Laptop, useCase: string): string {
  const useCaseContext: Record<string, string> = {
    gaming: `For gaming, prioritize GPU TGP, display refresh rate, CPU cooling.
This ${laptop.name}: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W, ${laptop.display_hz}Hz display, ${laptop.cpu_model}`,

    programming: `For programming, prioritize CPU cores, RAM, SSD speed.
This ${laptop.name}: ${laptop.cpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.storage_gb}GB ${laptop.storage_type}`,

    'video-editing': `For video editing, prioritize GPU VRAM, RAM (32GB+), CPU cores, display accuracy.
This ${laptop.name}: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W, ${laptop.ram_gb}GB RAM, ${laptop.display_color_gamut || 'unknown'} color accuracy`,

    design: `For graphic design, prioritize display color accuracy, brightness, GPU, RAM.
This ${laptop.name}: ${laptop.display_nits}nits, ${laptop.display_color_gamut || 'unknown'} DCI-P3, ${laptop.gpu_model}, ${laptop.ram_gb}GB RAM`,

    'ai-ml': `For AI/ML, prioritize GPU VRAM (8GB+), RAM (32GB+), CUDA cores, CPU.
This ${laptop.name}: ${laptop.gpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.cpu_model}`,

    general: `For general everyday use, prioritize battery life, weight, efficiency, display brightness.
This ${laptop.name}: ${laptop.battery_wh}Wh battery, ${laptop.weight_kg}kg, ${laptop.display_nits}nits`,

    business: `For business work, prioritize build quality, keyboard, display brightness, webcam.
This ${laptop.name}: ${laptop.brand}, ${laptop.display_nits}nits, ${laptop.weight_kg}kg`,

    content: `For content creation (YouTubers, streamers), prioritize balanced GPU+CPU, RAM, display color, audio.
This ${laptop.name}: ${laptop.gpu_model}, ${laptop.cpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.battery_wh}Wh battery`,
  }

  return `Why is ${laptop.name} (₹${laptop.price_inr.toLocaleString()}) good for ${useCase}?

${useCaseContext[useCase] || useCaseContext['general']}

Be specific. Mention actual specs and real-world performance expectations.`
}
```

#### Injected Variables
- `laptop.name`: Laptop model name.
- `laptop.price_inr`: Indian Rupee price.
- `useCase`: Target use case tag (e.g. `'gaming'`).
- `useCaseContext`: Selected spec parameters specific to the target use case.

> [!IMPORTANT]
> **Is the full list of laptops from the database sent?**
> **No.** Only the details of the single laptop requiring an explanation are sent in the prompt.

### 3. Sorting & Ranking Decision
- **N/A.** This function does not perform laptop selection or ranking; it operates on a single pre-selected laptop.

### 4. Model & Parameters
- **Model:** `claude-haiku-4-5`
- **max_tokens:** `500`
- **temperature:** Default (not specified, defaults to 1.0)

### 5. Caching & Cache Key
- **Where:** Database table `laptop_explanations` (Layer 2 - Explanation cache).
- **Cache Key:** Composite unique index of `(laptop_id, use_case)`.

---

## 3. Administrative Explanation Endpoint (`app/api/admin/generate-explanations/route.ts`)

### 1. File/Function & User Action
- **Location:** [`app/api/admin/generate-explanations/route.ts` -> `generateExplanation()`](file:///home/yasmanth/Downloads/laptops/app/api/admin/generate-explanations/route.ts#L158)
- **User Action:** Called on-demand by an administrator triggering a `POST` request to `/api/admin/generate-explanations`.

### 2. Prompt Template & Injected Variables

#### System Prompt Template
```typescript
const SYSTEM_PROMPT = `You are India's top laptop hardware expert. Write specific, confident explanations for why a laptop is great for a use case.

RULES:
1. Explain WHY specs matter, not just what they are
2. Use real-world numbers and comparisons
3. Be honest about India-specific context (battery, brightness, weight)
4. Write for non-technical readers

Return ONLY valid JSON:
{
  "explanation": "2-3 sentences with specific specs and real-world impact",
  "key_strengths": [
    "Specific strength with real-world impact",
    "Another specific strength",
    "A third specific strength"
  ],
  "one_weakness": "ONE specific weakness for THIS laptop and THIS use case"
}`
```

#### User Prompt Template
Similar to the explanation generator user prompt, but wrapped with instructions to enforce a confident tone (refer to [`app/api/admin/generate-explanations/route.ts:L34-L156`](file:///home/yasmanth/Downloads/laptops/app/api/admin/generate-explanations/route.ts#L34-L156)).

#### Injected Variables
- `laptop.name`: Laptop name.
- `useCase`: Use case name.
- `context`: Formatted string showing exact specs (GPU TGP, screen refresh rates, CPU, RAM details, and price).

> [!IMPORTANT]
> **Is the full list of laptops from the database sent?**
> **No.** The query iterates over the database collection one-by-one. Each individual API call contains details for only one laptop.

### 3. Sorting & Ranking Decision
- **N/A.**

### 4. Model & Parameters
- **Model:** `claude-haiku-4-5`
- **max_tokens:** `400`
- **temperature:** Default (not specified)

### 5. Caching & Cache Key
- **Where:** Database table `laptop_explanations`.
- **Cache Key:** Composite unique index of `(laptop_id, use_case)`.

---

## 4. Batch Pre-generation Script (`scripts/generate-explanations.js`)

### 1. File/Function & User Action
- **Location:** [`scripts/generate-explanations.js` -> `generateExplanation()`](file:///home/yasmanth/Downloads/laptops/scripts/generate-explanations.js#L209)
- **User Action:** Triggered manually via CLI by running `node scripts/generate-explanations.js`.

### 2. Prompt Template & Injected Variables

#### System Prompt Template
Features comprehensive copywriting rules for hardware explanation text (refer to [`scripts/generate-explanations.js:L39-L85`](file:///home/yasmanth/Downloads/laptops/scripts/generate-explanations.js#L39-L85)).

#### User Prompt Template
Takes the laptop profile and injects target use-case requirements (refer to [`scripts/generate-explanations.js:L87-L207`](file:///home/yasmanth/Downloads/laptops/scripts/generate-explanations.js#L87-L207)).

#### Injected Variables
- `laptop.name`: Laptop name.
- `useCase`: Use case name.
- `useCaseContext`: Structured spec metrics relevant to the use case.

> [!IMPORTANT]
> **Is the full list of laptops from the database sent?**
> **No.** Only the details of the single laptop currently being generated are sent.

### 3. Sorting & Ranking Decision
- **N/A.**

### 4. Model & Parameters
- **Model:** `claude-haiku-4-5`
- **max_tokens:** `1200`
- **temperature:** Default (not specified)

### 5. Caching & Cache Key
- **Where:** Database table `laptop_explanations`.
- **Cache Key:** Composite unique index of `(laptop_id, use_case)`.

---

## Token Consumption & Scaling Analysis

### 1. Token Estimation (Per User Request Flow)

If a user request results in a **Layer 1 cache hit** (`recommendation_cache`), token consumption is **0 tokens** (no LLM calls are made).

If a user request **cache misses**, the system makes exactly **one ranking call** to Claude, plus between **0 to 3 explanation calls** depending on whether the explanations for the top 3 recommendations are already cached in `laptop_explanations`.

#### Scenario A: Cache Miss + All 3 Explanations Cached (Common State)
- **Ranking Call Input:**
  - System Prompt: ~350 tokens (utilizes Prompt Caching)
  - User Prompt (15 candidate laptops + form options): ~1,100 tokens
  - *Total Input:* ~1,450 tokens
- **Ranking Call Output:**
  - Structured JSON (3 ranked objects with headlines): ~180 tokens
- **Explanation Calls:** 0 calls
- **Estimated Total Cost per request:** ~1,450 input tokens, ~180 output tokens.

#### Scenario B: Cache Miss + No Explanations Cached (Worst-Case State / First Launch)
- **Ranking Call:** ~1,450 input tokens, ~180 output tokens.
- **Explanation Call #1:** ~300 input tokens, ~200 output tokens.
- **Explanation Call #2:** ~300 input tokens, ~200 output tokens.
- **Explanation Call #3:** ~300 input tokens, ~200 output tokens.
- **Estimated Total Cost per request:** ~2,350 input tokens, ~780 output tokens.

---

### 2. Scaling Behavior (As Laptop Count Grows)

How does token usage scale when the number of laptops in the database grows from 61 to 500 or 1,000?

#### A. Ranking Calls (`lib/claude.ts`)
- **Scaling Complexity:** $O(1)$ constant scaling.
- **Why:** The API route performs a database-level Smart Filter and **slices the candidate list to a maximum of 15 laptops** using `laptopsForClaude.slice(0, 15)` before compiling the prompt. Even if there are 10,000 laptops in the database, the prompt size remains bounded at a maximum of 15 laptops (~1,450 input tokens).

#### B. Explanation Calls (`lib/explanation-generator.ts`)
- **Scaling Complexity:** $O(1)$ constant scaling.
- **Why:** The recommendation flow only selects the top 3 laptops to display. Therefore, the system will never generate more than 3 explanations on-demand, regardless of the total laptop count in the database.

#### C. Batch Pre-Generation Calls (`scripts/generate-explanations.js` & `api/admin`)
- **Scaling Complexity:** $O(N)$ linear scaling (where $N$ is the number of active laptops).
- **Why:** Pre-generation generates explanations for every active laptop across 8 use cases. This requires $N \times 8$ LLM calls. If the database grows to 500 active laptops, the administrator must run $500 \times 8 = 4,000$ LLM calls to pre-populate the database. However, this is a one-time administrative action and does not affect the live user recommendation flow.
