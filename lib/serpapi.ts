import type { NormalizedQuery } from './normalize'

export interface ParsedProduct {
  source_product_id: string
  title: string
  brand: string | null
  price: number | null
  rating: number | null
  reviews_count: number
  image_url: string | null
  product_url: string | null
  specs: {
    cpu?: string
    ram?: string
    storage?: string
    display?: string
    os?: string
  }
}

/**
 * Build a natural search query for SerpAPI
 */
function buildSearchQuery(q: NormalizedQuery): string {
  const parts: string[] = ['laptop']

  if (q.brand) parts.push(q.brand)

  if (q.use_case !== 'general') {
    parts.push(q.use_case)
  }

  if (q.budget_max) {
    parts.push(`under ${q.budget_max}`)
  }

  return parts.join(' ')
}

/**
 * Extract brand from title if not already known
 */
function inferBrand(title: string, knownBrand?: string): string | null {
  if (knownBrand) return knownBrand

  const brands = [
    'Apple',
    'HP',
    'Dell',
    'Lenovo',
    'ASUS',
    'Acer',
    'MSI',
    'Samsung',
  ]
  for (const b of brands) {
    if (title.includes(b)) return b
  }
  return null
}

/**
 * Parse price string like "₹79,990" -> 79990
 */
function parsePrice(priceStr: string | null): number | null {
  if (!priceStr) return null
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
  return isNaN(num) ? null : num
}

/**
 * Best-effort parse specs from title
 * E.g., "HP Pavilion 15 AMD Ryzen 5 5500U 16GB 512GB SSD" -> {cpu, ram, storage}
 */
function parseSpecsFromTitle(title: string): {
  cpu?: string
  ram?: string
  storage?: string
  display?: string
  os?: string
} {
  const specs: Record<string, string | undefined> = {}

  // CPU
  const cpuMatch = title.match(
    /(Intel Core i[357]-\w+|AMD Ryzen [357]-\w+|Apple M[1234]\w*)/i
  )
  if (cpuMatch) specs.cpu = cpuMatch[1]

  // RAM
  const ramMatch = title.match(/(\d+)\s*GB\s*RAM/i)
  if (ramMatch) specs.ram = `${ramMatch[1]}GB`

  // Storage
  const storageMatch = title.match(/(\d+)\s*GB\s*(SSD|HDD)/i)
  if (storageMatch) specs.storage = `${storageMatch[1]}GB ${storageMatch[2]}`

  // Display
  const displayMatch = title.match(/(\d+(?:\.\d+)?)\s*inches?/i)
  if (displayMatch) specs.display = `${displayMatch[1]}"`

  // OS
  if (/windows/i.test(title)) specs.os = 'Windows'
  if (/macos|mac os|osx/i.test(title)) specs.os = 'macOS'

  return specs
}

/**
 * Fetch products from SerpAPI Google Shopping
 */
export async function fetchFromSerpAPI(q: NormalizedQuery): Promise<ParsedProduct[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured')
  }

  const searchQuery = buildSearchQuery(q)

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: searchQuery,
    gl: 'in',
    hl: 'en',
    location: 'India',
    api_key: apiKey,
    num: '20',
  })

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      console.error(
        '[SerpAPI] Error:',
        response.status,
        await response.text().catch(() => '')
      )
      return []
    }

    const data = (await response.json()) as any

    if (!Array.isArray(data.shopping_results)) {
      console.warn('[SerpAPI] No shopping_results in response')
      return []
    }

    // Parse and filter results
    const products: ParsedProduct[] = data.shopping_results
      .map((item: any) => {
        const price = parsePrice(item.price)

        // Skip if no price or exceeds budget
        if (!price || (q.budget_max && price > q.budget_max)) {
          return null
        }

        return {
          source_product_id: item.product_id || item.link || '',
          title: item.title || '',
          brand: inferBrand(item.title, item.brand),
          price,
          rating: item.rating ? parseFloat(item.rating) : null,
          reviews_count: item.reviews || 0,
          image_url: item.image || null,
          product_url: item.link || null,
          specs: parseSpecsFromTitle(item.title || ''),
        }
      })
      .filter(
        (p: ParsedProduct | null) =>
          p &&
          p.source_product_id &&
          p.title &&
          p.price !== null &&
          p.product_url
      ) as ParsedProduct[]

    return products
  } catch (err: any) {
    console.error('[SerpAPI] Fetch failed:', err.message)
    return []
  }
}
