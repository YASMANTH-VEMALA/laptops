import { createHash } from 'crypto'

export type NormalizedQuery = {
  budget_max: number | null
  budget_band: number | null
  use_case: 'gaming' | 'coding' | 'student' | 'editing' | 'business' | 'general'
  brand: string | null
  os: 'windows' | 'macos' | null
}

/**
 * Parse budget from text like "80k", "80000", "under 80000", "1 lakh"
 */
function parseBudget(text: string): { budget_max: number | null; budget_band: number | null } {
  const lower = text.toLowerCase()

  // Try "80k" or "80K"
  let match = lower.match(/(\d+(?:[.,]\d+)*)\s*k\b/i)
  if (match) {
    const budget = parseInt(match[1].replace(/[.,]/g, '')) * 1000
    return {
      budget_max: budget,
      budget_band: Math.floor(budget / 10000) * 10000,
    }
  }

  // Try "1 lakh" or "1l" or "1lac"
  match = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:lakh|lac|l)\b/i)
  if (match) {
    const budget = parseFloat(match[1]) * 100000
    return {
      budget_max: budget,
      budget_band: Math.floor(budget / 10000) * 10000,
    }
  }

  // Try raw number (e.g., "80000", "80,000")
  match = lower.match(/(\d+(?:[.,]\d+)*)\s*(?:rupees|inr|rs)?/i)
  if (match) {
    const budget = parseInt(match[1].replace(/[.,]/g, ''))
    if (budget > 1000) {
      // Likely a price, not random number
      return {
        budget_max: budget,
        budget_band: Math.floor(budget / 10000) * 10000,
      }
    }
  }

  return { budget_max: null, budget_band: null }
}

/**
 * Detect use case from keywords
 */
function parseUseCase(
  text: string
): 'gaming' | 'coding' | 'student' | 'editing' | 'business' | 'general' {
  const lower = text.toLowerCase()

  if (/gaming|game|fps|gpu\b|rog|alien/i.test(lower)) return 'gaming'
  if (/coding|developer|programming|dev\b|software|engineer/i.test(lower)) return 'coding'
  if (/video|editing|render|creator|stream|production/i.test(lower)) return 'editing'
  if (/business|office|work|professional|corporate|meeting/i.test(lower)) return 'business'
  if (/student|college|study|university|exam/i.test(lower)) return 'student'

  return 'general'
}

/**
 * Detect brand from known list
 */
function parseBrand(text: string): string | null {
  const lower = text.toLowerCase()
  const brands = [
    'apple',
    'macbook',
    'mac',
    'hp',
    'dell',
    'lenovo',
    'asus',
    'rog',
    'acer',
    'msi',
    'samsung',
  ]

  for (const brand of brands) {
    if (lower.includes(brand)) {
      if (brand === 'mac' || brand === 'macbook') return 'Apple'
      return brand.charAt(0).toUpperCase() + brand.slice(1)
    }
  }

  return null
}

/**
 * Detect OS preference
 */
function parseOs(text: string): 'windows' | 'macos' | null {
  const lower = text.toLowerCase()

  if (/mac|macos|osx/i.test(lower)) return 'macos'
  if (/windows/i.test(lower)) return 'windows'

  return null
}

/**
 * Normalize raw query string into structured form
 */
export function normalize(raw: string): NormalizedQuery {
  const { budget_max, budget_band } = parseBudget(raw)
  const use_case = parseUseCase(raw)
  const brand = parseBrand(raw)
  const os = parseOs(raw)

  return {
    budget_max,
    budget_band,
    use_case,
    brand,
    os,
  }
}

/**
 * Generate deterministic query hash (SHA1 of normalized query)
 */
export function hashQuery(q: NormalizedQuery): string {
  const key = `${q.budget_band ?? 'any'}|${q.use_case}|${q.brand ?? 'any'}|${q.os ?? 'any'}`
  return createHash('sha1').update(key).digest('hex')
}

/**
 * Parse query and return hash
 */
export function normalizeAndHash(raw: string): {
  normalized: NormalizedQuery
  hash: string
} {
  const normalized = normalize(raw)
  const hash = hashQuery(normalized)
  return { normalized, hash }
}
