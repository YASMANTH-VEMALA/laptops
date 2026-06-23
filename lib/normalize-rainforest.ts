/**
 * Normalize Rainforest API results to our laptop schema
 * Extracts specs from product titles and metadata
 */

interface RainforestProduct {
  asin?: string
  title?: string
  price?: number | string
  currency?: string
  image?: string
  link?: string
  rating?: number
  reviews?: number
  [key: string]: unknown
}

interface NormalizedProduct {
  name: string
  price_inr: number
  brand: string
  image_url: string
  source: 'rainforest'
  source_product_id: string
  source_url: string
  cpu_model?: string
  ram_gb?: number
  storage_gb?: number
  storage_type?: string
  gpu_model?: string
  display_size?: number
  rating?: number
  reviews?: number
}

function extractBrand(title: string): string {
  const brands = ['HP', 'Dell', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Apple', 'MacBook', 'ThinkPad', 'Vivobook', 'ROG', 'IdeaPad']
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand
    }
  }
  return title.split(' ')[0] || 'Laptop'
}

function extractSpecs(title: string): Partial<NormalizedProduct> {
  const specs: Partial<NormalizedProduct> = {}

  // CPU extraction
  const cpuMatch = title.match(/(Intel Core i[3579]|Ryzen [357]|Apple M[1234])/i)
  if (cpuMatch) specs.cpu_model = cpuMatch[1]

  // RAM extraction
  const ramMatch = title.match(/(\d+)\s*GB.*RAM/i)
  if (ramMatch) specs.ram_gb = parseInt(ramMatch[1])

  // Storage extraction
  const storageMatch = title.match(/(\d+)\s*GB\s*(SSD|HDD|Storage|SSD)/i)
  if (storageMatch) {
    specs.storage_gb = parseInt(storageMatch[1])
    specs.storage_type = storageMatch[2] === 'HDD' ? 'HDD' : 'SSD'
  }

  // GPU extraction
  const gpuMatch = title.match(/(RTX|GTX|Radeon|Arc|MX)\s*\d+/i)
  if (gpuMatch) specs.gpu_model = gpuMatch[1]

  // Display size extraction
  const displayMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:inch|"|in)/i)
  if (displayMatch) specs.display_size = parseFloat(displayMatch[1])

  return specs
}

function parsePrice(priceStr: string | number | undefined): number {
  if (!priceStr) return 0
  if (typeof priceStr === 'number') return Math.round(priceStr)

  // Handle "₹45,000" or "$500" or "45000"
  const numMatch = String(priceStr).replace(/[^\d.]/g, '')
  const price = parseFloat(numMatch)

  if (isNaN(price)) return 0
  // Assume INR if price is > 1000 and reasonable laptop range (8k-5L)
  if (price > 8000 && price < 500000) return Math.round(price)
  // If looks like USD, convert to INR (roughly 80x)
  if (price > 300 && price < 5000) return Math.round(price * 82)
  return Math.round(price)
}

export function normalizeRainforestProduct(product: RainforestProduct): NormalizedProduct | null {
  const title = product.title?.trim()
  if (!title || title.length < 10) return null

  const price = parsePrice(product.price)
  if (price < 5000 || price > 500000) return null // Reject if not in laptop price range

  const asin = product.asin?.toString().trim()
  if (!asin) return null

  const normalized: NormalizedProduct = {
    name: title,
    price_inr: price,
    brand: extractBrand(title),
    image_url: product.image ? String(product.image) : '',
    source: 'rainforest',
    source_product_id: asin,
    source_url: product.link ? String(product.link) : `https://www.amazon.in/dp/${asin}`,
    ...extractSpecs(title),
    ...(product.rating && { rating: Number(product.rating) }),
    ...(product.reviews && { reviews: Number(product.reviews) }),
  }

  return normalized.name && normalized.price_inr > 0 ? normalized : null
}

export function normalizeRainforestResults(products: RainforestProduct[]): NormalizedProduct[] {
  return products
    .map(normalizeRainforestProduct)
    .filter((p): p is NormalizedProduct => p !== null)
    .slice(0, 8) // Limit to top 8 results
}
