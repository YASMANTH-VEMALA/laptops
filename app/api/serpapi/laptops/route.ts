import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json'

type SerpApiShoppingResult = {
  position?: number
  title?: string
  source?: string
  price?: string
  extracted_price?: number
  rating?: number
  reviews?: number
  delivery?: string
  link?: string
  product_link?: string
  product_id?: string
  thumbnail?: string
  serpapi_thumbnail?: string
  extensions?: string[]
  snippet?: string
  tag?: string
}

function getConditionWarning(item: SerpApiShoppingResult) {
  const text = [
    item.title,
    item.source,
    item.snippet,
    item.tag,
    ...(item.extensions ?? []),
  ].filter(Boolean).join(' ').toLowerCase()

  if (/\b(refurbished|renewed|used|pre-owned|preowned|second hand|open box|gameloot)\b/.test(text)) {
    return 'May be used/refurbished. Verify condition before trusting this price.'
  }

  const price = item.extracted_price ?? 0
  if (/macbook pro|macbook air|rog|predator|legion|omen|alienware/i.test(item.title ?? '') && price > 0 && price < 35000) {
    return 'Price looks unusually low for this model. Verify seller, condition, and warranty.'
  }

  return null
}

function toNumberParam(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SERPAPI_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'SERPAPI_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query) {
    return Response.json({ error: 'Missing required query parameter: q' }, { status: 400 })
  }

  const limit = toNumberParam(request.nextUrl.searchParams.get('limit'), 12, 40)
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_shopping',
    q: query,
    google_domain: request.nextUrl.searchParams.get('google_domain') || 'google.co.in',
    gl: request.nextUrl.searchParams.get('gl') || 'in',
    hl: request.nextUrl.searchParams.get('hl') || 'en',
    num: String(limit),
  })

  const minPrice = request.nextUrl.searchParams.get('min_price')
  const maxPrice = request.nextUrl.searchParams.get('max_price')
  if (minPrice) params.set('min_price', minPrice)
  if (maxPrice) params.set('max_price', maxPrice)

  const response = await fetch(`${SERPAPI_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const data = await response.json()

  if (!response.ok || data.error) {
    return Response.json(
      { error: 'SerpApi request failed.', details: data.error ?? data },
      { status: response.ok ? 502 : response.status }
    )
  }

  const shoppingResults = Array.isArray(data.shopping_results)
    ? (data.shopping_results as SerpApiShoppingResult[])
    : []

  const results = shoppingResults.slice(0, limit).map((item) => ({
    position: item.position ?? null,
    title: item.title ?? 'Untitled laptop result',
    source: item.source ?? null,
    price: item.price ?? null,
    extracted_price: item.extracted_price ?? null,
    rating: item.rating ?? null,
    reviews: item.reviews ?? null,
    delivery: item.delivery ?? null,
    link: item.link ?? item.product_link ?? null,
    product_link: item.product_link ?? null,
    product_id: item.product_id ?? null,
    thumbnail: item.thumbnail ?? item.serpapi_thumbnail ?? null,
    extensions: item.extensions ?? [],
    snippet: item.snippet ?? null,
    tag: item.tag ?? null,
    condition_warning: getConditionWarning(item),
    price_verified: false,
  }))

  return Response.json({
    query,
    engine: data.search_parameters?.engine ?? 'google_shopping',
    location: {
      google_domain: data.search_parameters?.google_domain ?? 'google.co.in',
      gl: data.search_parameters?.gl ?? 'in',
      hl: data.search_parameters?.hl ?? 'en',
    },
    count: results.length,
    raw_result_count: shoppingResults.length,
    data_fields: [
      'position',
      'title',
      'source',
      'price',
      'extracted_price',
      'rating',
      'reviews',
      'delivery',
      'link',
      'product_link',
      'product_id',
      'thumbnail',
      'extensions',
      'snippet',
      'tag',
      'condition_warning',
      'price_verified',
    ],
    results,
  })
}
